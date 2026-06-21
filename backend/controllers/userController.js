'use strict';

const pool   = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { sendEmail, otpHtml } = require('../utils/email');
const otpNs  = require('../utils/otp');
const { deleteS3Object, s3Active } = require('../utils/s3');

// PATCH /api/user — mettre à jour prénom + nom
exports.updateUser = async (req, res) => {
  const { prenom, nom } = req.body;
  if (!prenom?.trim() || !nom?.trim())
    return res.status(400).json({ success: false, message: 'Prénom et nom requis.' });

  try {
    const { rows } = await pool.query(
      `UPDATE users SET prenom = $1, nom = $2 WHERE id = $3
       RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
      [prenom.trim(), nom.trim(), req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Erreur updateUser:', err.message);
    res.status(500).json({ success: false, message: 'La mise à jour de vos informations a échoué. Réessayez.' });
  }
};

// POST /api/user/change-password
exports.changePassword = async (req, res) => {
  const { actuel, nouveau } = req.body;
  if (!actuel || !nouveau)
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });

  try {
    const { rows } = await pool.query(
      'SELECT password, auth_method FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const user = rows[0];

    if (user.auth_method !== 'email')
      return res.status(400).json({ success: false, message: 'Ce compte utilise une connexion sociale (Google ou Facebook). La modification du mot de passe n\'est pas disponible pour ce type de compte.' });

    const match = await bcrypt.compare(actuel, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect.' });

    if (nouveau.length < 8)
      return res.status(400).json({ success: false, message: 'Mot de passe trop court (8 caractères min.)' });
    if (!/[A-Z]/.test(nouveau))
      return res.status(400).json({ success: false, message: 'Ajoutez au moins une lettre majuscule.' });
    if (!/[0-9]/.test(nouveau))
      return res.status(400).json({ success: false, message: 'Ajoutez au moins un chiffre.' });

    const hashed = await bcrypt.hash(nouveau, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.userId]);

    // Révocation de toutes les sessions existantes après changement de mot de passe
    const { revokeAllUserRefreshTokens } = require('../utils/tokens');
    await revokeAllUserRefreshTokens(req.userId).catch(() => {});

    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('Erreur changePassword:', err.message);
    res.status(500).json({ success: false, message: 'Le changement de mot de passe a échoué. Réessayez.' });
  }
};

// DELETE /api/user — supprimer le compte
exports.deleteAccount = async (req, res) => {
  const { password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT password, auth_method FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const user = rows[0];

    if (user.auth_method === 'email') {
      if (!password)
        return res.status(400).json({ success: false, message: 'Mot de passe requis pour confirmer la suppression.' });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
    }

    // Suppression des fichiers S3 avant la suppression en base (cascade)
    if (s3Active()) {
      const { rows: docs } = await pool.query(
        'SELECT url_s3 FROM documents WHERE user_id = $1 AND url_s3 IS NOT NULL',
        [req.userId]
      );
      await Promise.allSettled(docs.map(d => deleteS3Object(d.url_s3)));
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.json({ success: true, message: 'Compte supprimé définitivement.' });
  } catch (err) {
    console.error('Erreur deleteAccount:', err.message);
    res.status(500).json({ success: false, message: 'La suppression du compte a échoué. Réessayez dans quelques instants.' });
  }
};

// GET /api/user/sessions
exports.getSessions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ip, user_agent, device_hash, created_at
       FROM login_sessions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [req.userId]
    );
    res.json({ success: true, sessions: rows });
  } catch (err) {
    console.error('Erreur getSessions:', err.message);
    res.status(500).json({ success: false, message: 'Impossible de charger vos sessions actives. Réessayez.' });
  }
};

// POST /api/user/2fa/enable — envoie OTP par email pour confirmer l'activation
exports.enable2FA = async (req, res) => {
  const { password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT email, password, auth_method, prenom, two_fa_enabled FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const user = rows[0];

    if (user.two_fa_enabled)
      return res.status(400).json({ success: false, message: 'La 2FA est déjà activée.' });

    if (user.auth_method === 'email') {
      if (!password) return res.status(400).json({ success: false, message: 'Mot de passe requis.' });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
    }

    const code = otpNs.makeCode();
    otpNs.storeOtp('2fa-enable', req.userId, code);

    await sendEmail({
      to:      user.email,
      subject: 'Activation de la double authentification Wekili',
      html:    otpHtml(code, "Vous avez demandé l'activation de la double authentification (2FA). Entrez ce code pour confirmer."),
    });

    res.json({ success: true, message: 'Code envoyé à votre adresse email.' });
  } catch (err) {
    console.error('Erreur enable2FA:', err.message);
    res.status(500).json({ success: false, message: 'L\'activation de la double authentification a échoué. Réessayez.' });
  }
};

// POST /api/user/2fa/confirm — vérifie OTP et active la 2FA
exports.confirm2FA = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Code requis.' });

  if (!otpNs.checkOtp('2fa-enable', req.userId, code))
    return res.status(401).json({ success: false, message: 'Code incorrect ou expiré.' });

  try {
    await pool.query('UPDATE users SET two_fa_enabled = TRUE WHERE id = $1', [req.userId]);
    res.json({ success: true, message: 'Double authentification activée avec succès.' });
  } catch (err) {
    console.error('Erreur confirm2FA:', err.message);
    res.status(500).json({ success: false, message: 'La confirmation de la double authentification a échoué. Réessayez.' });
  }
};

// POST /api/user/2fa/disable
exports.disable2FA = async (req, res) => {
  const { password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT password, auth_method, two_fa_enabled FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const user = rows[0];

    if (!user.two_fa_enabled)
      return res.status(400).json({ success: false, message: "La 2FA n'est pas activée." });

    if (user.auth_method === 'email') {
      if (!password) return res.status(400).json({ success: false, message: 'Mot de passe requis.' });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
    }

    await pool.query('UPDATE users SET two_fa_enabled = FALSE WHERE id = $1', [req.userId]);
    res.json({ success: true, message: 'Double authentification désactivée.' });
  } catch (err) {
    console.error('Erreur disable2FA:', err.message);
    res.status(500).json({ success: false, message: 'La désactivation de la double authentification a échoué. Réessayez.' });
  }
};
