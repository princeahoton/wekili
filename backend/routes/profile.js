const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, saveProfile } = require('../controllers/profileController');

router.get('/', auth, getProfile);
router.post('/', auth, saveProfile);

module.exports = router;
