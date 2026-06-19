const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { updateUser, changePassword, deleteAccount, getSessions, enable2FA, confirm2FA, disable2FA } = require('../controllers/userController');

router.patch('/',                auth, updateUser);
router.post('/change-password',  auth, changePassword);
router.delete('/',               auth, deleteAccount);

// Historique des connexions
router.get('/sessions',          auth, getSessions);

// Gestion de la double authentification (2FA)
router.post('/2fa/enable',       auth, enable2FA);
router.post('/2fa/confirm',      auth, confirm2FA);
router.post('/2fa/disable',      auth, disable2FA);

module.exports = router;
