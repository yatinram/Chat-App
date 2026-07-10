import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
} from 'react-native';
import dayjs from 'dayjs';
import Colors from '../../constants/colors';
import MessageStatus from './MessageStatus';
import MediaMessage from './MediaMessage';
import ReactionPicker from './ReactionPicker';
import socketService from '../../services/socketService';
import { messageApi } from '../../api/messageApi';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import useChatStore from '../../store/useChatStore';

/**
 * MessageBubble — renders a single chat message
 */
const MessageBubble = ({
  message,
  isSelf,
  currentUserId,
  receiverId,
  onReply,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { updateMessage, deleteMessageLocally } = useChatStore();

  const timeLabel = dayjs(message.createdAt).format('h:mm A');
  const myReaction = message.reactions?.[currentUserId] || null;
  const allReactions = message.reactions ? Object.values(message.reactions) : [];

  // ── Reply preview inside bubble ─────────────────────
  const renderReplyTo = () => {
    if (!message.repliedTo) return null;
    const isOwn = message.repliedTo.senderId === currentUserId;
    
    const replyText = message.repliedTo.isDeleted 
      ? '🚫 This message was deleted' 
      : (message.repliedTo.content || `[${message.repliedTo.type}]`);

    return (
      <View style={[styles.replyQuote, isSelf ? styles.replyQuoteSelf : styles.replyQuoteOther]}>
        <View style={styles.replyAccent} />
        <View style={styles.replyContent}>
          <Text style={styles.replyFrom}>{isOwn ? 'You' : 'Them'}</Text>
          <Text style={[styles.replyText, message.repliedTo.isDeleted && { fontStyle: 'italic', color: Colors.textMuted }]} numberOfLines={1}>
            {replyText}
          </Text>
        </View>
      </View>
    );
  };

  // ── Long press menu ──────────────────────────────────
  const handleLongPress = useCallback(() => {
    const options = ['Reply'];
    if (isSelf && !message.isDeleted && message.type === 'text') options.push('Edit');
    if (!message.isDeleted) options.push('React');
    options.push('Delete for me');
    if (isSelf && !message.isDeleted) options.push('Delete for everyone');
    options.push('Cancel');

    Alert.alert('Message Options', '', [
      ...options.slice(0, -1).map((opt) => ({
        text: opt,
        onPress: () => handleMenuAction(opt),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [message, isSelf]);

  const handleMenuAction = useCallback(
    async (action) => {
      switch (action) {
        case 'Reply':
          onReply && onReply(message);
          break;

        case 'Edit':
          Alert.prompt(
            'Edit Message',
            '',
            async (newContent) => {
              if (!newContent?.trim() || newContent === message.content) return;
              try {
                await messageApi.editMessage(message.id, newContent.trim());
                updateMessage(message.id, { content: newContent.trim(), isEdited: true });
                socketService.emit(SOCKET_EVENTS.MESSAGE_EDIT, {
                  messageId: message.id,
                  receiverId,
                  content: newContent.trim(),
                });
              } catch (err) {
                Alert.alert('Error', 'Failed to edit message');
              }
            },
            'plain-text',
            message.content,
          );
          break;

        case 'React':
          setShowReactionPicker(true);
          break;

        case 'Delete for me':
          Alert.alert('Delete Message', 'Delete this message for you?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await messageApi.deleteMessage(message.id, 'me');
                  deleteMessageLocally(message.id, 'me', currentUserId);
                  socketService.emit(SOCKET_EVENTS.MESSAGE_DELETE, {
                    messageId: message.id,
                    receiverId,
                    scope: 'me',
                  });
                } catch (err) {
                  Alert.alert('Error', 'Failed to delete message');
                }
              },
            },
          ]);
          break;

        case 'Delete for everyone':
          Alert.alert('Delete for Everyone', 'This will delete the message for both users.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await messageApi.deleteMessage(message.id, 'both');
                  deleteMessageLocally(message.id, 'both', currentUserId);
                  socketService.emit(SOCKET_EVENTS.MESSAGE_DELETE, {
                    messageId: message.id,
                    receiverId,
                    scope: 'both',
                  });
                } catch (err) {
                  Alert.alert('Error', 'Failed to delete message');
                }
              },
            },
          ]);
          break;
      }
    },
    [message, receiverId, currentUserId],
  );

  const handleReact = useCallback(
    (emoji) => {
      socketService.emit(
        SOCKET_EVENTS.MESSAGE_REACT,
        { messageId: message.id, receiverId, emoji },
        (res) => {
          if (res?.success) {
            updateMessage(message.id, { reactions: res.reactions });
          }
        },
      );
    },
    [message.id, receiverId],
  );

  // ── Deleted message ──────────────────────────────────
  if (message.isDeleted) {
    return (
      <View style={[styles.row, isSelf ? styles.rowSelf : styles.rowOther]}>
        <View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther, styles.deletedBubble]}>
          <Text style={styles.deletedText}>🚫 This message was deleted</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableWithoutFeedback onLongPress={handleLongPress}>
        <View style={[styles.row, isSelf ? styles.rowSelf : styles.rowOther]}>
          <View
            style={[
              styles.bubble,
              isSelf ? styles.bubbleSelf : styles.bubbleOther,
            ]}
          >
            {/* Reply quote */}
            {renderReplyTo()}

            {/* Message content */}
            {message.type === 'text' ? (
              <Text style={[styles.text, isSelf ? styles.textSelf : styles.textOther]}>
                {message.content}
              </Text>
            ) : (
              <MediaMessage
                type={message.type}
                mediaUrl={message.mediaUrl}
                mediaName={message.mediaName}
                mediaSize={message.mediaSize}
                isSelf={isSelf}
              />
            )}

            {/* Footer: time + edited label + status */}
            <View style={styles.footer}>
              {message.isEdited && (
                <Text style={styles.editedLabel}>edited · </Text>
              )}
              <Text style={[styles.time, isSelf ? styles.timeSelf : styles.timeOther]}>
                {timeLabel}
              </Text>
              {isSelf && <MessageStatus status={message.status} />}
            </View>
          </View>

          {/* Reactions display */}
          {allReactions.length > 0 && (
            <TouchableOpacity
              style={[styles.reactionsRow, isSelf ? styles.reactionsRowSelf : styles.reactionsRowOther]}
              onPress={() => setShowReactionPicker(true)}
            >
              {[...new Set(allReactions)].map((emoji, i) => (
                <Text key={i} style={styles.reactionEmoji}>
                  {emoji}
                </Text>
              ))}
              {allReactions.length > 1 && (
                <Text style={styles.reactionCount}>{allReactions.length}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>

      <ReactionPicker
        visible={showReactionPicker}
        onSelect={handleReact}
        onClose={() => setShowReactionPicker(false)}
        currentReaction={myReaction}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    maxWidth: '80%',
  },
  rowSelf: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleSelf: {
    backgroundColor: Colors.bubbleSelf,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.bubbleOther,
    borderBottomLeftRadius: 4,
  },
  deletedBubble: {
    opacity: 0.5,
  },
  deletedText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  text: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  textSelf: {
    color: Colors.textPrimary,
  },
  textOther: {
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  editedLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  time: {
    fontSize: 10,
  },
  timeSelf: {
    color: 'rgba(255,255,255,0.6)',
  },
  timeOther: {
    color: Colors.textMuted,
  },
  replyQuote: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  replyQuoteSelf: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  replyQuoteOther: {
    backgroundColor: Colors.bgSurface3,
  },
  replyAccent: {
    width: 3,
    backgroundColor: Colors.accent,
  },
  replyContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyFrom: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 1,
  },
  replyText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface2,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  reactionsRowSelf: {
    alignSelf: 'flex-end',
  },
  reactionsRowOther: {
    alignSelf: 'flex-start',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
});

export default MessageBubble;
