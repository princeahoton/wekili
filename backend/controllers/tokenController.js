'use strict';

const pool = require('../config/database');
const {
  makeAccessToken,
  hashToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require('../utils/tokens');

function safeUser(row) {
  return {
    id:             row.uid  || row.id,
    email:          row.email,
    prenom:         row.prenom,
    nom:            row.nom,
    pays:           row.pays,
    avatar_url:     row.avatar_url  || null,
    auth_method:    row.auth_method || 'email',
    two_fa_enabled: row.two_fa_enabled || false,
    role:           row.role || 'user',
  };
}

// POST /api/auth/refresh
// Body: { refreshToken }
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ success: false, message: 'Refresh token requis.' });

  try {
    const { rows } = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, rt.device_hash,
              u.id as uid, u.email, u.nom, u.prenom, u.pays,
              u.avatar_url, u.auth_method, u.two_fa_enabled, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [hashToken(refreshToken)]
    );

    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Session invalide. Reconnectez-vous.' });

    const row = rows[0];

    if (row.revoked_at)
      return res.status(401).json({ success: false, message: 'Session révoquée. Reconnectez-vous.' });

    if (new Date(row.expires_at) < new Date())
      return res.status(401).json({ success: false, message: 'Session expirée. Reconnectez-vous.' });

    // Rotation atomique : révocation de l'ancien + émission du nouveau
    const newRefreshToken = await rotateRefreshToken(row.id, row.user_id, row.device_hash);

    const token = makeAccessToken({ id: row.uid, email: row.email });
    res.json({ success: true, token, refreshToken: newRefreshToken, user: safeUser(row) });
  } catch (err) {
    console.error('Erreur refresh token:', err.message);
    res.status(500).json({ success: false, message: 'Le renouvellement de session a échoué. Reconnectez-vous.' });
  }
};

// POST /api/auth/logout
// Body: { refreshToken }
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    await revokeRefreshToken(refreshToken);
  } catch { /* révocation silencieuse — la déconnexion réussit toujours */ }
  res.json({ success: true, message: 'Déconnexion réussie.' });
};
