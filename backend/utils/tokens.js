'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../config/database');

const REFRESH_DAYS = 30;

function makeAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function makeRefreshToken() {
  return crypto.randomBytes(40).toString('hex'); // 80-char opaque token
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId, token, deviceHash = null) {
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, hashToken(token), deviceHash, expiresAt]
  );
}

// Révoque l'ancien token et émet un nouveau (atomique)
async function rotateRefreshToken(tokenId, userId, deviceHash) {
  const newToken  = makeRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  const client    = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [tokenId]
    );
    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, hashToken(newToken), deviceHash, expiresAt]
    );
    await client.query('COMMIT');
    return newToken;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function revokeRefreshToken(token) {
  if (!token) return;
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(token)]
  );
}

async function revokeAllUserRefreshTokens(userId) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

module.exports = {
  makeAccessToken,
  makeRefreshToken,
  hashToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};
