const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { launchAnalysis, getLatestAnalysis, getAllAnalyses } = require('../controllers/analysisController');

router.post('/launch', auth, launchAnalysis);
router.get('/latest', auth, getLatestAnalysis);
router.get('/all', auth, getAllAnalyses);

module.exports = router;
