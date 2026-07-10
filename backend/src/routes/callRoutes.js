const express = require('express');
const router = express.Router();
const { createCallRecord, getCallHistory } = require('../controllers/callController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createCallRecord);
router.get('/history', authenticateToken, getCallHistory);

module.exports = router;
