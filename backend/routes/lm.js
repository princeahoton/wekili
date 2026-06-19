const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getLMVersions, genererLM, corrigerLM, sauvegarderLM } = require('../controllers/lmController');

router.get('/',          auth, getLMVersions);
router.post('/generate', auth, genererLM);
router.post('/correct',  auth, corrigerLM);
router.post('/save',     auth, sauvegarderLM);

module.exports = router;
