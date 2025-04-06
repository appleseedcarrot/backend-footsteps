const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/request', authMiddleware, friendController.sendFriendRequest);
router.post('/accept', authMiddleware, friendController.acceptFriendRequest);
router.post('/remove', authMiddleware, friendController.removeFriend);
router.get('/', authMiddleware, friendController.getFriendList);

module.exports = router;