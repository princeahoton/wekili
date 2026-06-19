const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCVVersions, corrigerCV, sauvegarderCV, extractPDF, uploadMiddleware } = require('../controllers/cvController');

router.get('/',          auth, getCVVersions);
router.post('/correct',  auth, corrigerCV);
router.post('/save',     auth, sauvegarderCV);
router.post('/upload',   auth, uploadMiddleware, extractPDF);

module.exports = router;
