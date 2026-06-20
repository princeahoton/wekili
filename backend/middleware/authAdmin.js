'use strict';
const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Non autorisé' });
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, role FROM users WHERE id=$1', [payload.id]);
    if (!rows.length || !['admin', 'superadmin'].includes(rows[0].role)) {
      return res.status(403).json({ message: 'Accès refusé — droits administrateur requis' });
    }
    req.userId   = payload.id;
    req.userRole = rows[0].role;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};
