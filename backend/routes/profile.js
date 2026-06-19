const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getProfile,
  saveProfile,
  sendProfilePhoneOTP,
  verifyProfilePhoneOTP,
} = require('../controllers/profileController');

router.get('/',                 auth, getProfile);
router.post('/',                auth, saveProfile);
router.post('/phone/send-otp',  auth, sendProfilePhoneOTP);
router.post('/phone/verify',    auth, verifyProfilePhoneOTP);

module.exports = router;
