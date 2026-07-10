const express = require('express');
const router = express.Router();
const { getMessages, editMessage, deleteMessage, deleteFullChat, searchMessages } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/search', authenticateToken, searchMessages);
router.get('/:userId', authenticateToken, getMessages);
router.put('/:messageId', authenticateToken, editMessage);
router.delete('/chat/:userId', authenticateToken, deleteFullChat);
router.delete('/:messageId', authenticateToken, deleteMessage);

module.exports = router;
