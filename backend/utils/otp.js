'use strict';

// Namespaced in-memory OTP store.
// ns examples: '2fa-login', '2fa-enable', 'doc-access'
const _stores = new Map();

function _store(ns) {
  if (!_stores.has(ns)) _stores.set(ns, new Map());
  return _stores.get(ns);
}

function storeOtp(ns, key, code, ttlMs = 10 * 60 * 1000) {
  _store(ns).set(String(key), { code: String(code), expires: Date.now() + ttlMs });
}

function checkOtp(ns, key, code) {
  const m = _store(ns);
  const entry = m.get(String(key));
  if (!entry) return false;
  if (Date.now() > entry.expires) { m.delete(String(key)); return false; }
  if (entry.code !== String(code).trim()) return false;
  m.delete(String(key));
  return true;
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { storeOtp, checkOtp, makeCode };
