'use strict';

const { Resend } = require('resend');

let _resend = null;
function client() {
  if (!_resend && process.env.RESEND_API_KEY)
    _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM || 'Wekili <noreply@wekili.app>';

async function sendEmail({ to, subject, html }) {
  const r = client();
  if (!r) {
    console.warn(`[email] RESEND_API_KEY absent — simulé → ${to}: ${subject}`);
    return { simulated: true };
  }
  try {
    return await r.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] Erreur envoi:', err.message);
    throw err;
  }
}

function otpHtml(code, context) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
  <div style="background:#1a3a6b;padding:28px 32px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Code de vérification Wekili</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:15px;margin:0 0 20px">${context}</p>
    <div style="background:#f0f4ff;border-radius:12px;padding:24px;text-align:center;margin:0 0 20px">
      <span style="font-size:36px;font-weight:800;color:#1a3a6b;letter-spacing:10px">${code}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0 0 8px">⏱ Ce code expire dans <strong>10 minutes</strong>.</p>
    <p style="color:#6b7280;font-size:13px;margin:0">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 32px;text-align:center">
    <p style="color:#9ca3af;font-size:11px;margin:0">© 2025 Wekili — La plateforme des étudiants africains</p>
  </div>
</div>
</body></html>`;
}

function newDeviceHtml({ prenom, ip, ua, date }) {
  const uaShort = (ua || 'inconnu').slice(0, 100);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
  <div style="background:#1a3a6b;padding:28px 32px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">⚠️ Nouvelle connexion détectée</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;font-size:15px;margin:0 0 16px">Bonjour ${prenom || 'vous'},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Une connexion a été effectuée sur votre compte depuis un <strong>nouvel appareil ou réseau</strong>.</p>
    <div style="background:#fef3f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:0 0 20px">
      <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#6b7280;width:110px">Date :</td><td style="font-weight:600">${date}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">IP :</td><td style="font-weight:600">${ip || 'inconnue'}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Navigateur :</td><td style="font-weight:600">${uaShort}</td></tr>
      </table>
    </div>
    <p style="color:#374151;font-size:14px;margin:0 0 8px">✅ <strong>C'était vous ?</strong> Aucune action requise.</p>
    <p style="color:#dc2626;font-size:14px;margin:0">🚨 <strong>Ce n'était pas vous ?</strong> Changez votre mot de passe depuis <a href="https://wekili.app/settings" style="color:#1a3a6b;font-weight:700">Paramètres → Sécurité</a>.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 32px;text-align:center">
    <p style="color:#9ca3af;font-size:11px;margin:0">© 2025 Wekili</p>
  </div>
</div>
</body></html>`;
}

module.exports = { sendEmail, otpHtml, newDeviceHtml };
