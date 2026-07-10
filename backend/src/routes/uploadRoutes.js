const express = require('express');
const router = express.Router();
const { uploadMedia } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, uploadMedia);

module.exports = router;
