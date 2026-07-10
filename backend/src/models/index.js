const sequelize = require('../config/database');
const User = require('./User');
const Message = require('./Message');
const Call = require('./Call');

// ─── Associations ────────────────────────────────────────────────────────────

// User <-> Message (sender)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User <-> Message (receiver)
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Message self-reference (reply)
Message.belongsTo(Message, { foreignKey: 'repliedToId', as: 'repliedTo' });
Message.hasMany(Message, { foreignKey: 'repliedToId', as: 'replies' });

// User <-> Call (caller)
User.hasMany(Call, { foreignKey: 'callerId', as: 'outgoingCalls' });
Call.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });

// User <-> Call (receiver)
User.hasMany(Call, { foreignKey: 'receiverId', as: 'incomingCalls' });
Call.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// ─── Sync DB ─────────────────────────────────────────────────────────────────
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
};

module.exports = { sequelize, User, Message, Call, syncDatabase };
