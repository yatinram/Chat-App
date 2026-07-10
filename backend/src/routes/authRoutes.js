const express = require('express');
const router = express.Router();
const { login, updateFcmToken, getMe, getOtherUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/fcm-token', authenticateToken, updateFcmToken);
router.get('/me', authenticateToken, getMe);
router.get('/other-user', authenticateToken, getOtherUser);

module.exports = router;
