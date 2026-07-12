const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');

router.get('/user/:username', rewardController.getUserProfile);
router.post('/reward', rewardController.claimReward);
router.post('/generate-article', rewardController.generateArticleTask); // <-- Added

module.exports = router;