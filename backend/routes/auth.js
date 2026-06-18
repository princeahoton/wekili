const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// 10 tentatives par fenêtre de 15 min sur les endpoints auth
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes.' },
  skipSuccessfulRequests: true,
});

router.post('/register', authLimit, authController.register);
router.post('/login',    authLimit, authController.login);

// Connexion sociale
router.post('/google',   authLimit, authController.googleLogin);
router.post('/facebook', authLimit, authController.facebookLogin);

// Connexion par téléphone (OTP SMS)
router.post('/phone/send-otp', authLimit, authController.sendPhoneOTP);
router.post('/phone/verify',   authLimit, authController.verifyPhoneOTP);

module.exports = router;
