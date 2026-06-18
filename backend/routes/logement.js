'use strict';

const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/logementController');

router.use(auth);

router.get('/',          ctrl.getLogement);
router.post('/',         ctrl.upsertLogement);
router.get('/guide-ia',  ctrl.getGuideIA);

module.exports = router;
