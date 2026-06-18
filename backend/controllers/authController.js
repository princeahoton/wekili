'use strict';

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const twilio = require('twilio');

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
    id:         user.id,
    email:      user.email,
    prenom:     user.prenom,
    nom:        user.nom,
    pays:       user.pays,
    avatar_url: user.avatar_url || null,
    auth_method: user.auth_method || 'email',
  };
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
    res.status(201).json({ success: true, message: 'Compte créé avec succès !', token: makeJwt(user), user: safeUser(user) });
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
      'SELECT id, email, password, nom, prenom, pays, avatar_url, auth_method FROM users WHERE email = $1',
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

    res.json({ success: true, message: 'Connexion réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur login:', err.message);
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
        `UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url), auth_method = 'google'
         WHERE id = $3 RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
        [googleId, avatarUrl, rows[0].id]
      );
      user = updated[0];
    } else {
      // Nouveau compte via Google
      const { rows: created } = await pool.query(
        `INSERT INTO users (email, google_id, prenom, nom, pays, avatar_url, auth_method)
         VALUES ($1, $2, $3, $4, '', $5, 'google')
         RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
        [emailNorm, googleId, prenom || '', nom || '', avatarUrl || null]
      );
      user = created[0];
    }

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
        `UPDATE users SET facebook_id = $1, avatar_url = COALESCE($2, avatar_url), auth_method = 'facebook'
         WHERE id = $3 RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
        [facebookId, avatarUrl, rows[0].id]
      );
      user = updated[0];
    } else {
      const { rows: created } = await pool.query(
        `INSERT INTO users (email, facebook_id, prenom, nom, pays, avatar_url, auth_method)
         VALUES ($1, $2, $3, $4, '', $5, 'facebook')
         RETURNING id, email, nom, prenom, pays, avatar_url, auth_method`,
        [email, facebookId, prenom, nom, avatarUrl]
      );
      user = created[0];
    }

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

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return res.status(503).json({ success: false, message: 'SMS non configuré. Ajoutez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER dans .env' });
  }

  try {
    // Générer un code à 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeOtp(phoneNorm, code);

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Votre code Wekili : ${code} (valable 10 minutes)`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNorm,
    });

    res.json({ success: true, message: `Code SMS envoyé au ${phoneNorm}` });
  } catch (err) {
    console.error('Erreur envoi SMS:', err.message);
    otpStore.delete(phoneNorm);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du SMS. Vérifiez votre numéro.' });
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

    res.json({ success: true, message: 'Connexion par téléphone réussie !', token: makeJwt(user), user: safeUser(user) });
  } catch (err) {
    console.error('Erreur verify OTP:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
