const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Call = sequelize.define('Call', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  callerId: {
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
    type: DataTypes.ENUM('voice', 'video'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('missed', 'answered', 'rejected'),
    defaultValue: 'missed',
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds',
  },
}, {
  tableName: 'calls',
  timestamps: true,
  indexes: [
    { fields: ['callerId'] },
    { fields: ['receiverId'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Call;
