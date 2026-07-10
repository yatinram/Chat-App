const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    // Find user
    const user = await User.findOne({ where: { username: username.trim() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/fcm-token  — update FCM token after login
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.update({ fcmToken }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'isOnline', 'lastSeen'],
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/other-user — get the other user's info
const getOtherUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {},
      attributes: ['id', 'username', 'isOnline', 'lastSeen'],
    });

    // Find the other user (not self)
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'isOnline', 'lastSeen'],
    });
    const other = allUsers.find(u => u.id !== req.user.id);

    if (!other) {
      return res.status(404).json({ success: false, message: 'Other user not found' });
    }
    res.json({ success: true, user: other });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, updateFcmToken, getMe, getOtherUser };
