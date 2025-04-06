const express = require('express');
const jumpscareController = require('../controllers/jumpscareController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/send', authMiddleware, jumpscareController.sendJumpscare);
router.get('/', authMiddleware, jumpscareController.getPendingJumpscares);

module.exports = router;