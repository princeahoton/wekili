const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController  = require('../controllers/authController');
const tokenController = require('../controllers/tokenController');

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

// Vérification 2FA après connexion
router.post('/2fa-verify', authLimit, authController.verify2FA);

// Vérification email à l'inscription
router.post('/verify-email',  authLimit, authController.verifyEmail);
router.post('/resend-verify', authLimit, authController.resendVerificationEmail);

// Mot de passe oublié
router.post('/forgot-password', authLimit, authController.forgotPassword);
router.post('/reset-password',  authLimit, authController.resetPassword);

// Gestion des sessions
router.post('/refresh', tokenController.refresh);
router.post('/logout',  tokenController.logout);

module.exports = router;
