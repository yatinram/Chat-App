const { Op } = require('sequelize');
const { Message, User } = require('../models');

// GET /api/messages/:userId?cursor=<timestamp>&limit=30
const getMessages = async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 30;
    const cursor = req.query.cursor; // ISO timestamp for cursor-based pagination

    const whereClause = {
      [Op.or]: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
      expiresAt: { [Op.gt]: new Date() }, // only non-expired
    };

    if (cursor) {
      whereClause.createdAt = { [Op.lt]: new Date(cursor) };
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: Message,
          as: 'repliedTo',
          attributes: ['id', 'content', 'type', 'mediaUrl', 'senderId', 'isDeleted'],
          required: false,
        },
      ],
    });

    // Filter deleted messages:
    // 1. Exclude completely if deleted for me ('sender' or 'receiver' matching my role)
    // 2. Mark as isDeleted if deleted for everyone ('both')
    const filtered = [];
    messages.forEach(msg => {
      const m = msg.toJSON();
      if (m.deletedFor === 'both') {
        m.content = null;
        m.mediaUrl = null;
        m.isDeleted = true;
        filtered.push(m);
      } else if (m.deletedFor === 'sender' && m.senderId === myId) {
        // Skip for sender
        return;
      } else if (m.deletedFor === 'receiver' && m.receiverId === myId) {
        // Skip for receiver
        return;
      } else {
        filtered.push(m);
      }
    });

    res.json({
      success: true,
      messages: filtered.reverse(), // chronological order
      hasMore: messages.length === limit,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/messages/:messageId — edit message
const editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findByPk(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (message.senderId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot edit others messages' });
    }
    if (message.type !== 'text') {
      return res.status(400).json({ success: false, message: 'Only text messages can be edited' });
    }

    await message.update({ content, isEdited: true });
    res.json({ success: true, message: message });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/messages/:messageId?scope=me|both
const deleteMessage = async (req, res) => {
  try {
    const scope = req.query.scope || 'me';
    const message = await Message.findByPk(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isSender = message.senderId === req.user.id;

    if (scope === 'both') {
      if (!isSender) {
        return res.status(403).json({ success: false, message: 'Only sender can delete for both' });
      }
      await message.update({ deletedFor: 'both', isDeleted: true, content: null, mediaUrl: null });
    } else {
      // delete for me only
      const targetDelete = isSender ? 'sender' : 'receiver';
      await message.update({
        deletedFor: message.deletedFor === 'both' ? 'both' : targetDelete,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/messages/chat/:userId — delete entire conversation
const deleteFullChat = async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = parseInt(req.params.userId);

    const deleted = await Message.destroy({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      },
    });

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Delete full chat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/messages/search?q=text&userId=otherId
const searchMessages = async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = parseInt(req.query.userId);
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
        content: { [Op.like]: `%${query}%` },
        expiresAt: { [Op.gt]: new Date() },
        deletedFor: { [Op.ne]: 'both' },
        isDeleted: false,
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // Exclude messages deleted for this user
    const filtered = messages.filter(m => {
      if (m.deletedFor === 'sender' && m.senderId === myId) return false;
      if (m.deletedFor === 'receiver' && m.receiverId === myId) return false;
      return true;
    });

    res.json({ success: true, messages: filtered });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMessages, editMessage, deleteMessage, deleteFullChat, searchMessages };
