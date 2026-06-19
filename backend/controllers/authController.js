'use strict';

const pool   = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendSMS } = require('../utils/sms');
const { sendEmail, otpHtml, newDeviceHtml } = require('../utils/email');
const otpNs  = require('../utils/otp');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone) {
  // Supprimer espaces et tirets, garder le +
  return phone.replace(/[\s\-().]/g, '');
}

function isValidPhone(phone) {
  return /^\+?[0-9]{8,15}$/.test(normalizePhone(phone));
}

function makeJwt(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
}

function safeUser(user) {
  return {
    id:             user.id,
    email:          user.email,
    prenom:         user.prenom,
    nom:            user.nom,
    pays:           user.pays,
    avatar_url:     user.avatar_url || null,
    auth_method:    user.auth_method || 'email',
    two_fa_enabled: user.two_fa_enabled || false,
  };
}

// ── Device & session helpers ──────────────────────────────────────────────────

function deviceHash(req) {
  const ua = (req.headers['user-agent'] || '').slice(0, 200);
  const ip = req.ip || '';
  return crypto.createHash('sha256').update(`${ua}|${ip}`).digest('hex').slice(0, 24);
}

async function handleNewSession(userId, user, req) {
  const hash = deviceHash(req);
  const ip   = req.ip || null;
  const ua   = (req.headers['user-agent'] || '').slice(0, 500) || null;

  const { rows } = await pool.query(
    `SELECT id FROM login_sessions
     WHERE user_id = $1 AND device_hash = $2 AND created_at > NOW() - INTERVAL '30 days'
     LIMIT 1`,
    [userId, hash]
  );
  const isNew = rows.length === 0;

  await pool.query(
    `INSERT INTO login_sessions (user_id, ip, user_agent, device_hash) VALUES ($1, $2, $3, $4)`,
    [userId, ip, ua, hash]
  );

  if (isNew && user.email) {
    const date = new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
    sendEmail({
      to:      user.email,
      subject: '⚠️ Nouvelle connexion sur votre compte Wekili',
      html:    newDeviceHtml({ prenom: user.prenom, ip, ua, date }),
    }).catch(err => console.error('[email:new-device]', err.message));
  }
}

// ─── OTP store en mémoire (expiration 10 min) ─────────────────────────────────
const otpStore = new Map(); // clé = phone normalisé → { code, expires }

function storeOtp(phone, code) {
  otpStore.set(phone, { code, expires: Date.now() + 10 * 60 * 1000 });
}

function verifyOtp(phone, code) {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expires) { otpStore.delete(phone); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

// ─── MODULE 1 — Email / Mot de passe ─────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { prenom, nom, email, password, pays } = req.body;

    if (!prenom || typeof prenom !== 'string' || prenom.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Prénom invalide (2 caractères min.)' });
    if (!nom || typeof nom !== 'string' || nom.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Nom invalide (2 caractères min.)' });
    if (!email || !isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Adresse email invalide' });
    if (!password || password.length < 8)
      return res.status(400).json({ success: false, message: 'Mot de passe trop court (8 caractères min.)' });
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return res.status(400).json({ success: false, message: 'Mot de passe faible : ajoutez au moins une majuscule et un chiffre' });
    if (!pays || typeof pays !== 'string' || pays.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Pays requis' });

    const emailNorm = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password, nom, prenom, pays, auth_method)
       VALUES ($1, $2, $3, $4, $5, 'email')
       RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
      [emailNorm, hashedPassword, nom.trim(), prenom.trim(), pays.trim()]
    );

    const user = result.rows[0];

    const code = otpNs.makeCode();
    otpNs.storeOtp('email-verify', emailNorm, code);
    sendEmail({
      to:      emailNorm,
      subject: 'Activez votre compte Wekili',
      html:    otpHtml(code, `Bienvenue ${user.prenom} ! Entrez ce code pour activer votre compte Wekili.`),
    }).catch(err => console.error('[email:verify-register]', err.message));

    res.status(201).json({ success: true, requiresVerification: true, email: emailNorm });
  } catch (err) {
    console.error('Erreur register:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Email invalide' });
    if (!password || typeof password !== 'string')
      return res.status(400).json({ success: false, message: 'Mot de passe requis' });

    const emailNorm = email.trim().toLowerCase();
    const result = await pool.query(
      'SELECT id, email, password, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled, email_verified FROM users WHERE email = $1',
      [emailNorm]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const user = result.rows[0];
    if (!user.password)
      return res.status(401).json({ success: false, message: `Ce compte utilise la connexion ${user.auth_method}. Pas de mot de passe.` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });

    if (!user.email_verified) {
      const code = otpNs.makeCode();
      otpNs.storeOtp('email-verify', emailNorm, code);
      sendEmail({
        to:      emailNorm,
        subject: 'Activez votre compte Wekili',
        html:    otpHtml(code, 'Entrez ce code pour activer votre compte. Valable 10 minutes.'),
      }).catch(err => console.error('[email:verify-login]', err.message));
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: emailNorm,
        message: 'Votre adresse email n\'est pas encore vérifiée. Un code vient de vous être envoyé.',
      });
    }

    // 2FA : envoyer OTP et retourner un token temporaire
    if (user.two_fa_enabled) {
      const code      = otpNs.makeCode();
      const tempToken = jwt.sign({ id: user.id, twofa: true }, process.env.JWT_SECRET, { expiresIn: '5m' });
      otpNs.storeOtp('2fa-login', user.id, code);
      sendEmail({
        to:      user.email,
        subject: 'Votre code de connexion Wekili',
        html:    otpHtml(code, 'Entrez ce code pour finaliser votre connexion sécurisée.'),
      }).catch(err => console.error('[email:2fa-login]', err.message));
      return res.json({ success: true, requires2FA: true, tempToken });
    }

    await handleNewSession(user.id, user, req).catch(err => console.error('[session]', err.message));
    res.json({ success: true, message: 'Connexion réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur login:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── MODULE 1b — Vérification 2FA ────────────────────────────────────────────

exports.verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code)
      return res.status(400).json({ success: false, message: 'Token temporaire et code requis.' });

    let payload;
    try { payload = jwt.verify(tempToken, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ success: false, message: 'Code expiré — reconnectez-vous.' }); }

    if (!payload.twofa)
      return res.status(401).json({ success: false, message: 'Token invalide.' });

    if (!otpNs.checkOtp('2fa-login', payload.id, code))
      return res.status(401).json({ success: false, message: 'Code incorrect ou expiré.' });

    const { rows } = await pool.query(
      'SELECT id, email, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled FROM users WHERE id = $1',
      [payload.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const user = rows[0];
    await handleNewSession(user.id, user, req).catch(err => console.error('[session]', err.message));
    res.json({ success: true, message: 'Connexion 2FA réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur verify2FA:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── MODULE 1c — Vérification email à l'inscription ─────────────────────────

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ success: false, message: 'Email et code requis.' });

    const emailNorm = email.trim().toLowerCase();

    if (!otpNs.checkOtp('email-verify', emailNorm, code))
      return res.status(401).json({ success: false, message: 'Code incorrect ou expiré.' });

    const { rows } = await pool.query(
      `UPDATE users SET email_verified = true WHERE email = $1
       RETURNING id, email, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled`,
      [emailNorm]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Compte introuvable.' });

    const user = rows[0];
    await handleNewSession(user.id, user, req).catch(err => console.error('[session:verify-email]', err.message));
    res.json({ success: true, message: 'Email vérifié ! Bienvenue sur Wekili.', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur verifyEmail:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requis.' });

    const emailNorm = email.trim().toLowerCase();
    const { rows } = await pool.query('SELECT email_verified, prenom FROM users WHERE email = $1', [emailNorm]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Compte introuvable.' });
    if (rows[0].email_verified) return res.json({ success: true, message: 'Email déjà vérifié.' });

    const code = otpNs.makeCode();
    otpNs.storeOtp('email-verify', emailNorm, code);
    sendEmail({
      to:      emailNorm,
      subject: 'Votre nouveau code Wekili',
      html:    otpHtml(code, `Entrez ce code pour activer votre compte Wekili.`),
    }).catch(err => console.error('[email:resend-verify]', err.message));

    res.json({ success: true, message: 'Nouveau code envoyé par email.' });
  } catch (err) {
    console.error('Erreur resendVerification:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── MODULE 2 — Google (ID Token) ────────────────────────────────────────────

exports.googleLogin = async (req, res) => {
  const { credential } = req.body; // JWT ID token renvoyé par Google Identity Services
  if (!credential) return res.status(400).json({ success: false, message: 'Token Google manquant' });

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'Connexion Google non configurée. Ajoutez GOOGLE_CLIENT_ID dans .env' });
  }

  try {
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: prenom, family_name: nom, picture: avatarUrl } = payload;

    if (!email) return res.status(400).json({ success: false, message: 'Google n\'a pas fourni d\'email' });
    const emailNorm = email.toLowerCase();

    // Chercher par google_id ou email
    let { rows } = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1',
      [googleId, emailNorm]
    );

    let user;
    if (rows.length > 0) {
      // Mettre à jour google_id si pas encore lié
      const { rows: updated } = await pool.query(
        `UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url), auth_method = 'google', email_verified = true
         WHERE id = $3 RETURNING id, email, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled`,
        [googleId, avatarUrl, rows[0].id]
      );
      user = updated[0];
    } else {
      // Pas de compte existant
      if (!req.body.signup) {
        return res.status(404).json({
          success: false,
          noAccount: true,
          message: 'Aucun compte Wekili associé à ce compte Google. Créez un compte d\'abord.',
        });
      }
      // Nouveau compte via Google (inscription)
      const { rows: created } = await pool.query(
        `INSERT INTO users (email, google_id, prenom, nom, pays, avatar_url, auth_method, email_verified)
         VALUES ($1, $2, $3, $4, '', $5, 'google', true)
         RETURNING id, email, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled`,
        [emailNorm, googleId, prenom || '', nom || '', avatarUrl || null]
      );
      user = created[0];
    }

    await handleNewSession(user.id, user, req).catch(err => console.error('[session:google]', err.message));
    res.json({ success: true, message: 'Connexion Google réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur Google login:', err.message);
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token'))
      return res.status(401).json({ success: false, message: 'Token Google invalide ou expiré' });
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la vérification Google' });
  }
};

// ─── MODULE 3 — Facebook (Access Token) ──────────────────────────────────────

exports.facebookLogin = async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ success: false, message: 'Token Facebook manquant' });

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return res.status(503).json({ success: false, message: 'Connexion Facebook non configurée. Ajoutez FACEBOOK_APP_ID et FACEBOOK_APP_SECRET dans .env' });
  }

  try {
    // Vérifier le token avec le Graph API Facebook
    const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appToken}`;
    const debugRes = await fetch(debugUrl);
    const debug = await debugRes.json();

    if (!debug.data?.is_valid) {
      return res.status(401).json({ success: false, message: 'Token Facebook invalide' });
    }

    // Récupérer le profil
    const profileUrl = `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.type(large)&access_token=${accessToken}`;
    const profileRes = await fetch(profileUrl);
    const profile = await profileRes.json();

    const facebookId = profile.id;
    const email = profile.email?.toLowerCase() || null;
    const prenom = profile.first_name || '';
    const nom = profile.last_name || '';
    const avatarUrl = profile.picture?.data?.url || null;

    // Chercher par facebook_id ou email
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE facebook_id = $1 OR (email = $2 AND $2 IS NOT NULL) LIMIT 1',
      [facebookId, email]
    );

    let user;
    if (rows.length > 0) {
      const { rows: updated } = await pool.query(
        `UPDATE users SET facebook_id = $1, avatar_url = COALESCE($2, avatar_url), auth_method = 'facebook', email_verified = true
         WHERE id = $3 RETURNING id, email, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled`,
        [facebookId, avatarUrl, rows[0].id]
      );
      user = updated[0];
    } else {
      if (!req.body.signup) {
        return res.status(404).json({
          success: false,
          noAccount: true,
          message: 'Aucun compte Wekili associé à ce compte Facebook. Créez un compte d\'abord.',
        });
      }
      const { rows: created } = await pool.query(
        `INSERT INTO users (email, facebook_id, prenom, nom, pays, avatar_url, auth_method, email_verified)
         VALUES ($1, $2, $3, $4, '', $5, 'facebook', true)
         RETURNING id, email, nom, prenom, pays, avatar_url, auth_method, two_fa_enabled`,
        [email, facebookId, prenom, nom, avatarUrl]
      );
      user = created[0];
    }

    await handleNewSession(user.id, user, req).catch(err => console.error('[session:facebook]', err.message));
    res.json({ success: true, message: 'Connexion Facebook réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur Facebook login:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la vérification Facebook' });
  }
};

// ─── MODULE 4 — Téléphone (OTP SMS via Twilio) ───────────────────────────────

exports.sendPhoneOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Numéro de téléphone requis' });

  const phoneNorm = normalizePhone(phone);
  if (!isValidPhone(phoneNorm))
    return res.status(400).json({ success: false, message: 'Numéro de téléphone invalide (format international: +225...)' });

  try {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeOtp(phoneNorm, code);

    const result = await sendSMS(phoneNorm, `Votre code Wekili : ${code} (valable 10 minutes)`);

    if (result.notConfigured) {
      otpStore.delete(phoneNorm);
      return res.status(503).json({ success: false, message: 'Vérification SMS non disponible pour le moment. Réessayez plus tard.' });
    }

    res.json({ success: true, message: `Code SMS envoyé au ${phoneNorm}` });
  } catch (err) {
    console.error('Erreur envoi SMS:', err.message);
    otpStore.delete(phoneNorm);
    res.status(500).json({ success: false, message: "Impossible d'envoyer le SMS. Vérifiez votre numéro." });
  }
};

exports.verifyPhoneOTP = async (req, res) => {
  const { phone, code, prenom, nom } = req.body;
  if (!phone || !code)
    return res.status(400).json({ success: false, message: 'Téléphone et code requis' });

  const phoneNorm = normalizePhone(phone);

  if (!verifyOtp(phoneNorm, code.trim()))
    return res.status(401).json({ success: false, message: 'Code incorrect ou expiré' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phoneNorm]);
    let user;

    if (rows.length > 0) {
      user = rows[0];
    } else {
      // Nouveau compte
      const { rows: created } = await pool.query(
        `INSERT INTO users (phone, prenom, nom, pays, email, auth_method)
         VALUES ($1, $2, $3, '', NULL, 'phone')
         RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
        [phoneNorm, prenom?.trim() || 'Étudiant', nom?.trim() || '']
      );
      user = created[0];
    }

    await handleNewSession(user.id, user, req).catch(err => console.error('[session:phone]', err.message));
    res.json({ success: true, message: 'Connexion par téléphone réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur verify OTP:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
