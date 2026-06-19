'use strict';

const pool   = require('../config/database');
const { sendSMS } = require('../utils/sms');

// ── Validation date de naissance ──────────────────────────────────────────────

const AGE_MIN = 16;
const AGE_MAX = 120;

function validerDateNaissance(valeur) {
  if (!valeur) return null;
  const dob = new Date(valeur);
  if (isNaN(dob.getTime())) return 'Date de naissance invalide.';
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  if (dob >= auj) return "La date de naissance doit être antérieure à aujourd'hui.";
  const age = Math.floor((auj - dob) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < AGE_MIN) return `Vous devez avoir au moins ${AGE_MIN} ans pour utiliser cette plateforme.`;
  if (age > AGE_MAX) return `Date de naissance invalide (âge supérieur à ${AGE_MAX} ans).`;
  return null;
}

// ── Validation téléphone ──────────────────────────────────────────────────────

function normalisePhone(phone) {
  return (phone || '').replace(/[\s\-().]/g, '');
}

function isPhoneValide(phone) {
  // Format international strict : +suivi de 7 à 14 chiffres (total 8-15 chiffres)
  return /^\+[1-9][0-9]{6,13}$/.test(phone);
}

// ── OTP store en mémoire pour vérification profil ─────────────────────────────

const profilePhoneOtpStore = new Map();

function storeOtp(phone, code) {
  profilePhoneOtpStore.set(phone, { code, expires: Date.now() + 10 * 60 * 1000 });
}

function checkOtp(phone, code) {
  const entry = profilePhoneOtpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expires) { profilePhoneOtpStore.delete(phone); return false; }
  if (entry.code !== code) return false;
  profilePhoneOtpStore.delete(phone);
  return true;
}

// ── GET /api/profile ──────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    if (rows.length === 0) return res.json({ profile: null });
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── POST /api/profile ─────────────────────────────────────────────────────────

exports.saveProfile = async (req, res) => {
  const {
    nationalite, pays_residence, telephone, date_naissance,
    niveau_etudes, domaine, etablissement, moyenne,
    langue_principale, niveau_langue, certification, langue2, niveau_langue2,
    pays_cibles, niveau_vise, domaine_vise, budget,
  } = req.body;

  // Validation date de naissance
  const errDate = validerDateNaissance(date_naissance);
  if (errDate) return res.status(400).json({ message: errDate });

  // Validation et normalisation du téléphone
  const telNorm = telephone ? normalisePhone(telephone) : null;
  if (telNorm) {
    if (!isPhoneValide(telNorm)) {
      return res.status(400).json({ message: 'Format de téléphone invalide. Utilisez le format international (ex. : +22997000000).' });
    }
    // Unicité : pas deux profils avec le même numéro
    const dup = await pool.query(
      'SELECT user_id FROM profiles WHERE telephone = $1 AND user_id != $2',
      [telNorm, req.userId]
    ).catch(() => ({ rows: [] }));
    if (dup.rows.length > 0) {
      return res.status(409).json({ message: 'Ce numéro de téléphone est déjà associé à un autre compte.' });
    }
  }

  try {
    const existing = await pool.query(
      'SELECT id, telephone, phone_verified FROM profiles WHERE user_id = $1',
      [req.userId]
    );

    if (existing.rows.length === 0) {
      // Nouveau profil — phone_verified = FALSE par défaut
      await pool.query(
        `INSERT INTO profiles
          (user_id, nationalite, pays_residence, telephone, phone_verified, date_naissance,
           niveau_etudes, domaine, etablissement, moyenne,
           langue_principale, niveau_langue, certification, langue2, niveau_langue2,
           pays_cibles, niveau_vise, domaine_vise, budget, updated_at)
         VALUES ($1,$2,$3,$4,FALSE,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())`,
        [req.userId, nationalite, pays_residence, telNorm,
         date_naissance || null,
         niveau_etudes, domaine, etablissement, moyenne ? parseFloat(moyenne) : null,
         langue_principale, niveau_langue, certification, langue2, niveau_langue2,
         pays_cibles, niveau_vise, domaine_vise, budget || null]
      );
    } else {
      // Profil existant — conserver phone_verified si le numéro n'a pas changé
      const oldTel       = existing.rows[0].telephone;
      const wasVerified  = existing.rows[0].phone_verified || false;
      const phoneVerified = telNorm && telNorm === oldTel ? wasVerified : false;

      await pool.query(
        `UPDATE profiles SET
          nationalite=$2, pays_residence=$3, telephone=$4, phone_verified=$5, date_naissance=$6,
          niveau_etudes=$7, domaine=$8, etablissement=$9, moyenne=$10,
          langue_principale=$11, niveau_langue=$12, certification=$13,
          langue2=$14, niveau_langue2=$15, pays_cibles=$16,
          niveau_vise=$17, domaine_vise=$18, budget=$19, updated_at=NOW()
         WHERE user_id=$1`,
        [req.userId, nationalite, pays_residence, telNorm, phoneVerified,
         date_naissance || null,
         niveau_etudes, domaine, etablissement, moyenne ? parseFloat(moyenne) : null,
         langue_principale, niveau_langue, certification, langue2, niveau_langue2,
         pays_cibles, niveau_vise, domaine_vise, budget || null]
      );
    }

    const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    res.json({ message: 'Profil sauvegardé', profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── POST /api/profile/phone/send-otp ─────────────────────────────────────────

exports.sendProfilePhoneOTP = async (req, res) => {
  const { telephone } = req.body;
  if (!telephone) return res.status(400).json({ success: false, message: 'Numéro de téléphone requis.' });

  const tel = normalisePhone(telephone);
  if (!isPhoneValide(tel)) {
    return res.status(400).json({ success: false, message: 'Format invalide. Utilisez le format international : +22997000000' });
  }

  // Unicité
  const dup = await pool.query(
    'SELECT user_id FROM profiles WHERE telephone = $1 AND user_id != $2',
    [tel, req.userId]
  ).catch(() => ({ rows: [] }));
  if (dup.rows.length > 0) {
    return res.status(409).json({ success: false, message: 'Ce numéro est déjà associé à un autre compte.' });
  }

  try {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeOtp(tel, code);

    const result = await sendSMS(tel, `Votre code de vérification Wekili : ${code} (valable 10 min)`);

    if (result.notConfigured) {
      profilePhoneOtpStore.delete(tel);
      return res.status(503).json({ success: false, message: 'Vérification SMS non disponible pour le moment.' });
    }

    res.json({ success: true, message: `Code envoyé au ${tel}` });
  } catch (err) {
    console.error('Erreur OTP profil phone:', err.message);
    profilePhoneOtpStore.delete(tel);
    res.status(500).json({ success: false, message: "Impossible d'envoyer le SMS. Vérifiez votre numéro." });
  }
};

// ── POST /api/profile/phone/verify ────────────────────────────────────────────

exports.verifyProfilePhoneOTP = async (req, res) => {
  const { telephone, code } = req.body;
  if (!telephone || !code) return res.status(400).json({ success: false, message: 'Numéro et code requis.' });

  const tel = normalisePhone(telephone);
  if (!checkOtp(tel, code.trim())) {
    return res.status(401).json({ success: false, message: 'Code incorrect ou expiré. Renvoyez un nouveau code.' });
  }

  try {
    const { rows } = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [req.userId]);
    if (rows.length > 0) {
      await pool.query(
        'UPDATE profiles SET telephone = $1, phone_verified = TRUE, updated_at = NOW() WHERE user_id = $2',
        [tel, req.userId]
      );
    } else {
      await pool.query(
        'INSERT INTO profiles (user_id, telephone, phone_verified) VALUES ($1, $2, TRUE)',
        [req.userId, tel]
      );
    }
    res.json({ success: true, message: 'Numéro vérifié avec succès !' });
  } catch (err) {
    console.error('Erreur vérification OTP profil:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
