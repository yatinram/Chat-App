const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'file', 'voice'),
    defaultValue: 'text',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mediaUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mediaName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mediaMimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  mediaSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'seen'),
    defaultValue: 'sent',
  },
  repliedToId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'messages', key: 'id' },
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedFor: {
    type: DataTypes.STRING(20),
    defaultValue: 'none',
  },
  reactions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Object: { userId: emoji }',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['expiresAt'] },
    { fields: ['senderId', 'receiverId'] },
    { fields: ['createdAt'] },
  ],
  hooks: {
    // Ensure expiresAt is populated before validation so non-null constraint passes
    beforeValidate: (message) => {
      if (!message.expiresAt) {
        const expire = new Date();
        expire.setHours(expire.getHours() + 24);
        message.expiresAt = expire;
      }
    },
  },
});

module.exports = Message;
