'use strict';

const pool    = require('../config/database');
const bcrypt  = require('bcryptjs');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID: uuidv4 } = require('crypto');
const path    = require('path');
const { sendEmail, otpHtml } = require('../utils/email');
const otpNs   = require('../utils/otp');
const { s3, BUCKET, s3Active, deleteS3Object } = require('../utils/s3');

// ── Journal d'activité ───────────────────────────────────────────────────────

async function logDocAction(userId, docId, docName, action) {
  try {
    await pool.query(
      `INSERT INTO document_logs (user_id, document_id, document_name, action)
       VALUES ($1, $2, $3, $4)`,
      [userId, docId || null, docName || null, action]
    );
  } catch (err) {
    console.error('[doc-log]', err.message);
  }
}

// ── Notifications email pour les actions importantes ─────────────────────────

async function notifyDocAction(userId, docName, action) {
  try {
    const { rows } = await pool.query('SELECT email, prenom FROM users WHERE id = $1', [userId]);
    if (!rows.length || !rows[0].email) return;
    const { email, prenom } = rows[0];

    const labels = {
      upload:    'a été ajouté',
      delete:    'a été supprimé',
      replace:   'a été remplacé',
      pin_reset: 'Votre PIN de l\'espace Documents a été réinitialisé',
    };

    const label = labels[action];
    if (!label) return;

    const msg = action === 'pin_reset'
      ? `Bonjour ${prenom}, ${label}. Si ce n'était pas vous, contactez le support immédiatement.`
      : `Bonjour ${prenom}, le document <strong>${docName}</strong> ${label} dans votre espace Wekili le ${new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}.`;

    sendEmail({
      to:      email,
      subject: action === 'pin_reset' ? '⚠️ PIN Documents réinitialisé — Wekili' : `📄 Document ${action === 'upload' ? 'ajouté' : action === 'delete' ? 'supprimé' : 'remplacé'} — Wekili`,
      html:    `<!DOCTYPE html><html lang="fr"><body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
  <div style="background:#1a3a6b;padding:24px 32px"><h1 style="margin:0;color:#fff;font-size:18px">Wekili — Espace Documents</h1></div>
  <div style="padding:28px 32px"><p style="color:#374151;font-size:15px">${msg}</p>
  <p style="color:#6b7280;font-size:12px;margin-top:20px">Si vous n'êtes pas à l'origine de cette action, changez votre mot de passe et votre PIN immédiatement.</p></div>
  <div style="background:#f9fafb;padding:14px 32px;text-align:center"><p style="color:#9ca3af;font-size:11px;margin:0">© 2025 Wekili</p></div>
</div></body></html>`,
    }).catch(err => console.error('[notify-doc]', err.message));
  } catch (err) {
    console.error('[notify-doc-user]', err.message);
  }
}

// ── Gestion des documents ────────────────────────────────────────────────────

exports.getDocuments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, type, nom_fichier, url_s3, taille, statut, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger vos documents. Réessayez.' });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier sélectionné. Choisissez un fichier à envoyer.' });
    const { type } = req.body;
    if (!type) return res.status(400).json({ message: 'Veuillez sélectionner le type de document avant d\'envoyer.' });

    const ext = path.extname(req.file.originalname);
    const key = `documents/${req.userId}/${type}_${uuidv4()}${ext}`;
    let url_s3 = null;

    if (s3Active()) {
      await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        req.file.buffer,
        ContentType: req.file.mimetype,
      }));
      url_s3 = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`;
    }

    // Vérifier si un doc du même type existait déjà (remplacement)
    const { rows: existing } = await pool.query(
      'SELECT nom_fichier FROM documents WHERE user_id = $1 AND type = $2',
      [req.userId, type]
    );
    const isReplace = existing.length > 0;

    await pool.query('DELETE FROM documents WHERE user_id = $1 AND type = $2', [req.userId, type]);

    const { rows } = await pool.query(
      `INSERT INTO documents (user_id, type, nom_fichier, url_s3, taille, statut)
       VALUES ($1, $2, $3, $4, $5, 'en_attente') RETURNING *`,
      [req.userId, type, req.file.originalname, url_s3, req.file.size]
    );

    const action = isReplace ? 'replace' : 'upload';
    logDocAction(req.userId, rows[0].id, req.file.originalname, action);
    notifyDocAction(req.userId, req.file.originalname, action);

    res.json({ message: 'Document uploadé', document: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'L\'envoi du document a échoué. Vérifiez le fichier et réessayez.' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Document non trouvé' });

    const doc = rows[0];

    await deleteS3Object(doc.url_s3);

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    logDocAction(req.userId, id, doc.nom_fichier, 'delete');
    notifyDocAction(req.userId, doc.nom_fichier, 'delete');

    res.json({ message: 'Document supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'La suppression du document a échoué. Réessayez.' });
  }
};

// ── Journal d'activité ───────────────────────────────────────────────────────

exports.getDocumentLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT document_name, action, created_at
       FROM document_logs WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.userId]
    );
    res.json({ logs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger l\'historique des documents. Réessayez.' });
  }
};

// ── Système de PIN ───────────────────────────────────────────────────────────

exports.checkPin = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT doc_pin_hash IS NOT NULL AS has_pin FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    res.json({ has_pin: rows[0]?.has_pin || false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de vérifier votre PIN. Réessayez.' });
  }
};

exports.createPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4,6}$/.test(pin))
      return res.status(400).json({ success: false, message: 'Le PIN doit contenir 4 à 6 chiffres.' });

    const hash = await bcrypt.hash(pin, 10);
    await pool.query(
      `INSERT INTO profiles (user_id, doc_pin_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET doc_pin_hash = $2`,
      [req.userId, hash]
    );
    logDocAction(req.userId, null, null, 'pin_created');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'La création du PIN a échoué. Réessayez.' });
  }
};

exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN requis.' });

    const { rows } = await pool.query(
      'SELECT doc_pin_hash FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    if (!rows.length || !rows[0].doc_pin_hash)
      return res.status(404).json({ success: false, noPin: true, message: 'Aucun PIN configuré.' });

    const ok = await bcrypt.compare(String(pin), rows[0].doc_pin_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'PIN incorrect. Réessayez.' });

    logDocAction(req.userId, null, null, 'access');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'La vérification du PIN a échoué. Réessayez.' });
  }
};

exports.requestPinReset = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email, prenom FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const { email, prenom } = rows[0];
    if (!email) return res.status(400).json({ success: false, message: 'Aucun email associé à ce compte.' });

    const code = otpNs.makeCode();
    otpNs.storeOtp('pin-reset', req.userId, code);

    await sendEmail({
      to:      email,
      subject: 'Réinitialisation de votre PIN Documents Wekili',
      html:    otpHtml(code, `Bonjour ${prenom}, vous avez demandé la réinitialisation de votre code PIN pour l'espace Documents sécurisé Wekili.`),
    });

    res.json({ success: true, message: 'Code envoyé à votre adresse email.' });
  } catch (err) {
    console.error('Erreur requestPinReset:', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du code.' });
  }
};

exports.confirmPinReset = async (req, res) => {
  try {
    const { code, newPin } = req.body;
    if (!code || !newPin)
      return res.status(400).json({ success: false, message: 'Code et nouveau PIN requis.' });
    if (!/^\d{4,6}$/.test(newPin))
      return res.status(400).json({ success: false, message: 'Le PIN doit contenir 4 à 6 chiffres.' });

    if (!otpNs.checkOtp('pin-reset', req.userId, code))
      return res.status(401).json({ success: false, message: 'Code incorrect ou expiré.' });

    const hash = await bcrypt.hash(newPin, 10);
    await pool.query(
      'UPDATE profiles SET doc_pin_hash = $1 WHERE user_id = $2',
      [hash, req.userId]
    );
    logDocAction(req.userId, null, null, 'pin_reset');
    notifyDocAction(req.userId, null, 'pin_reset');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'La réinitialisation du PIN a échoué. Réessayez.' });
  }
};

// ── Portail OTP email (legacy — conservé pour compatibilité) ─────────────────

exports.requestDocAccess = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT email, prenom FROM users WHERE id = $1', [req.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const { email, prenom } = rows[0];
    if (!email) return res.status(400).json({ success: false, message: 'Aucune adresse email associée.' });

    const code = otpNs.makeCode();
    otpNs.storeOtp('doc-access', req.userId, code);
    await sendEmail({
      to:      email,
      subject: "Code d'accès à vos documents Wekili",
      html:    otpHtml(code, `Bonjour ${prenom}, vous avez demandé l'accès à votre espace Documents sécurisé.`),
    });
    res.json({ success: true, message: 'Code envoyé à votre adresse email.' });
  } catch (err) {
    console.error('Erreur requestDocAccess:', err.message);
    res.status(500).json({ success: false, message: 'L\'envoi du code d\'accès a échoué. Réessayez.' });
  }
};

exports.verifyDocAccess = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Code requis.' });
  if (!otpNs.checkOtp('doc-access', req.userId, code))
    return res.status(401).json({ success: false, message: 'Code incorrect ou expiré.' });
  res.json({ success: true, message: 'Accès accordé.' });
};
