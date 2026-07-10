const jwt = require('jsonwebtoken');
const { User, Message } = require('../models');
const { sendMessageNotification, sendCallNotification } = require('../utils/fcmNotification');

// In-memory mapping of active user IDs to their socket IDs
const onlineUsers = new Map(); // userId -> Set of socketIds (to support multiple tabs/connections per user)

const handleSocketConnection = (io) => {
  // Middleware to authenticate socket connections with JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${socket.username} (Socket ID: ${socket.id})`);

    // Add socket to online users mapping
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update user status in database to online
    try {
      await User.update({ isOnline: true }, { where: { id: userId } });
      // Notify the other user that this user is online
      socket.broadcast.emit('user_status', { userId, isOnline: true });
    } catch (err) {
      console.error('Socket: failed to update user online status:', err);
    }

    // --- Core Messaging Events ---

    // 1. send_message
    socket.on('send_message', async (data, callback) => {
      try {
        const { receiverId, type, content, mediaUrl, mediaName, mediaMimeType, mediaSize, repliedToId } = data;

        if (!receiverId) {
          return callback({ success: false, message: 'Receiver ID is required' });
        }

        // Create the message row in Sequelize
        const message = await Message.create({
          senderId: userId,
          receiverId,
          type: type || 'text',
          content,
          mediaUrl,
          mediaName,
          mediaMimeType,
          mediaSize,
          repliedToId,
          status: 'sent'
        });

        // Fetch full message with repliedTo relation if needed
        const fullMessage = await Message.findByPk(message.id, {
          include: [{
            model: Message,
            as: 'repliedTo',
            attributes: ['id', 'content', 'type', 'mediaUrl', 'senderId', 'isDeleted'],
            required: false
          }]
        });

        const messageData = fullMessage.toJSON();

        // Check if receiver is online to set status as delivered
        const isReceiverOnline = onlineUsers.has(receiverId) && onlineUsers.get(receiverId).size > 0;
        if (isReceiverOnline) {
          await Message.update({ status: 'delivered' }, { where: { id: message.id } });
          messageData.status = 'delivered';
        }

        // Send to sender's other sockets (if any)
        const senderSockets = onlineUsers.get(userId);
        if (senderSockets) {
          senderSockets.forEach((sid) => {
            if (sid !== socket.id) {
              io.to(sid).emit('receive_message', messageData);
            }
          });
        }

        // Send to receiver sockets
        if (isReceiverOnline) {
          const receiverSockets = onlineUsers.get(receiverId);
          receiverSockets.forEach((sid) => {
            io.to(sid).emit('receive_message', messageData);
          });
        } else {
          // Send push notification via FCM since user is offline
          try {
            const receiverUser = await User.findByPk(receiverId);
            if (receiverUser && receiverUser.fcmToken) {
              const body = type === 'text' ? content : `[Sent a ${type}]`;
              await sendMessageNotification(
                receiverUser.fcmToken,
                socket.username,
                body,
                { messageId: message.id, senderId: `${userId}` }
              );
            }
          } catch (fcmErr) {
            console.error('FCM sending error on offline user:', fcmErr);
          }
        }

        // Return the created message back to sender socket
        callback({ success: true, message: messageData });
      } catch (err) {
        console.error('Socket send_message error:', err);
        callback({ success: false, message: 'Failed to send message' });
      }
    });

    // 2. typing & stop_typing
    socket.on('typing', (data) => {
      const { receiverId } = data;
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach(sid => {
          io.to(sid).emit('typing', { senderId: userId });
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach(sid => {
          io.to(sid).emit('stop_typing', { senderId: userId });
        });
      }
    });

    // 3. message_seen
    socket.on('message_seen', async (data) => {
      try {
        const { messageId, senderId } = data; // messageId is of the message that was seen
        
        await Message.update(
          { status: 'seen' },
          { where: { id: messageId, status: ['sent', 'delivered'] } }
        );

        // Notify the original sender
        const senderSockets = onlineUsers.get(senderId);
        if (senderSockets) {
          senderSockets.forEach(sid => {
            io.to(sid).emit('message_seen', { messageId, seenBy: userId });
          });
        }
      } catch (err) {
        console.error('Socket message_seen error:', err);
      }
    });

    // 4. message_edit
    socket.on('message_edit', (data) => {
      const { messageId, receiverId, content } = data;
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach(sid => {
          io.to(sid).emit('message_edit', { messageId, content });
        });
      }
    });

    // 5. message_delete
    socket.on('message_delete', (data) => {
      const { messageId, receiverId, scope } = data; // scope: 'me' or 'both'
      
      // If deleting for everyone, notify the receiver
      if (scope === 'both') {
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach(sid => {
            io.to(sid).emit('message_delete', { messageId, scope });
          });
        }
      }

      // Sync across other connections of the same user (if logged in on multiple devices)
      const senderSockets = onlineUsers.get(userId);
      if (senderSockets) {
        senderSockets.forEach(sid => {
          if (sid !== socket.id) {
            io.to(sid).emit('message_delete', { messageId, scope });
          }
        });
      }
    });

    // 6. message_react
    socket.on('message_react', async (data, callback) => {
      try {
        const { messageId, receiverId, emoji } = data;
        const msg = await Message.findByPk(messageId);
        if (!msg) return callback({ success: false, message: 'Message not found' });

        const currentReactions = msg.reactions || {};
        if (emoji) {
          currentReactions[userId] = emoji;
        } else {
          delete currentReactions[userId];
        }

        await msg.update({ reactions: currentReactions });

        // Broadcast to receiver
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach(sid => {
            io.to(sid).emit('message_react', { messageId, reactions: currentReactions });
          });
        }

        // Return back to other sockets of sender
        const senderSockets = onlineUsers.get(userId);
        if (senderSockets) {
          senderSockets.forEach(sid => {
            if (sid !== socket.id) {
              io.to(sid).emit('message_react', { messageId, reactions: currentReactions });
            }
          });
        }

        callback({ success: true, reactions: currentReactions });
      } catch (err) {
        console.error('Message reaction error:', err);
        callback({ success: false, message: 'Failed to react' });
      }
    });

    // --- WebRTC Call Signaling Events ---

    // 1. call_initiate (outgoing call start, send FCM notification to target if offline, send signal if online)
    socket.on('call_initiate', async (data, callback) => {
      try {
        const { receiverId, type, callId } = data; // type: 'voice' | 'video'
        const isReceiverOnline = onlineUsers.has(receiverId) && onlineUsers.get(receiverId).size > 0;
        
        if (isReceiverOnline) {
          const receiverSockets = onlineUsers.get(receiverId);
          receiverSockets.forEach(sid => {
            io.to(sid).emit('call_incoming', {
              callerId: userId,
              callerName: socket.username,
              type,
              callId
            });
          });
          callback({ success: true, online: true });
        } else {
          // Send high-priority calling FCM notification to wake up the app
          const receiverUser = await User.findByPk(receiverId);
          if (receiverUser && receiverUser.fcmToken) {
            await sendCallNotification(
              receiverUser.fcmToken,
              socket.username,
              type,
              callId,
              { callerId: `${userId}` }
            );
          }
          callback({ success: true, online: false });
        }
      } catch (err) {
        console.error('Call initiate error:', err);
        callback({ success: false, message: 'Call setup failed' });
      }
    });

    // 2. call_accept
    socket.on('call_accept', (data) => {
      const { callerId, callId } = data;
      const callerSockets = onlineUsers.get(callerId);
      if (callerSockets) {
        callerSockets.forEach(sid => {
          io.to(sid).emit('call_accepted', { callId, receiverId: userId });
        });
      }
    });

    // 3. call_reject
    socket.on('call_reject', (data) => {
      const { callerId, callId } = data;
      const callerSockets = onlineUsers.get(callerId);
      if (callerSockets) {
        callerSockets.forEach(sid => {
          io.to(sid).emit('call_rejected', { callId, receiverId: userId });
        });
      }
    });

    // 4. call_webrtc_signal (relays SDP offer/answer or ICE candidate)
    socket.on('call_webrtc_signal', (data) => {
      const { targetId, signal } = data; // targetId is who we are sending this WebRTC message to
      const targetSockets = onlineUsers.get(targetId);
      if (targetSockets) {
        targetSockets.forEach(sid => {
          io.to(sid).emit('call_webrtc_signal', {
            senderId: userId,
            signal
          });
        });
      }
    });

    // 5. call_end
    socket.on('call_end', (data) => {
      const { targetId, callId } = data;
      const targetSockets = onlineUsers.get(targetId);
      if (targetSockets) {
        targetSockets.forEach(sid => {
          io.to(sid).emit('call_ended', { callId, endedBy: userId });
        });
      }
    });

    // --- Disconnect Event ---
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.username} (Socket ID: ${socket.id})`);
      
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          
          // User is fully offline now
          try {
            const now = new Date();
            await User.update(
              { isOnline: false, lastSeen: now },
              { where: { id: userId } }
            );
            // Broadcast offline status
            socket.broadcast.emit('user_status', { userId, isOnline: false, lastSeen: now });
          } catch (err) {
            console.error('Socket: failed to update offline status:', err);
          }
        }
      }
    });
  });
};

module.exports = { handleSocketConnection };
