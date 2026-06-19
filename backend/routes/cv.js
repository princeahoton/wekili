const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCVVersions, corrigerCV, sauvegarderCV } = require('../controllers/cvController');

router.get('/',         auth, getCVVersions);
router.post('/correct', auth, corrigerCV);
router.post('/save',    auth, sauvegarderCV);

module.exports = router;
