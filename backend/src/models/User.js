const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fcmToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  themePreference: {
    type: DataTypes.ENUM('light', 'dark'),
    defaultValue: 'dark',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
