const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');

router.get('/user/:username', rewardController.getUserProfile);
router.post('/start-session', rewardController.startTaskSession); // <-- Added
router.post('/reward', rewardController.claimReward);
router.post('/generate-article', rewardController.generateArticleTask);

module.exports = router;