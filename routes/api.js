const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');

router.get('/user/:username', rewardController.getUserProfile);
router.post('/start-session', rewardController.startTaskSession);
router.post('/reward', rewardController.claimReward);

module.exports = router;