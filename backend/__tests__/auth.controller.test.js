'use strict';

// ── Mocks déclarés avant tout import ──────────────────────────────────────────

jest.mock('../config/database', () => ({ query: jest.fn() }));

jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2b$12$mocked_hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign:   jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ id: 1, twofa: false }),
}));

jest.mock('../utils/email', () => ({
  sendEmail:      jest.fn().mockResolvedValue({}),
  otpHtml:        jest.fn().mockReturnValue('<p>code</p>'),
  newDeviceHtml:  jest.fn().mockReturnValue('<p>new device</p>'),
}));

jest.mock('../utils/sms', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
}));

// ── Imports après les mocks ───────────────────────────────────────────────────

const pool    = require('../config/database');
const bcrypt  = require('bcryptjs');
const ctrl    = require('../controllers/authController');

// ── Utilitaires de test ───────────────────────────────────────────────────────

function mockReqRes(body = {}) {
  const req = {
    body,
    headers:  { 'user-agent': 'jest-agent' },
    ip:       '127.0.0.1',
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  return { req, res };
}

// Simule un utilisateur complet en base
const DB_USER = {
  id: 1, email: 'alice@test.com', password: '$2b$12$hash',
  nom: 'Dupont', prenom: 'Alice', pays: 'Bénin',
  avatar_url: null, auth_method: 'email',
  two_fa_enabled: false, email_verified: true,
};

// Simule handleNewSession (2 requêtes supplémentaires)
function mockSessionQueries() {
  pool.query
    .mockResolvedValueOnce({ rows: [] })  // SELECT login_sessions (nouveau device)
    .mockResolvedValueOnce({ rows: [] }); // INSERT login_sessions
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRE = '24h';
});

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════════════════════

describe('register', () => {
  it('400 — prénom manquant', async () => {
    const { req, res } = mockReqRes({ nom: 'Dupont', email: 'a@b.com', password: 'Pass1234', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('400 — prénom trop court (< 2 caractères)', async () => {
    const { req, res } = mockReqRes({ prenom: 'A', nom: 'Dupont', email: 'a@b.com', password: 'Pass1234', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 — email invalide', async () => {
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'pas-un-email', password: 'Pass1234', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('email') }));
  });

  it('400 — mot de passe trop court', async () => {
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'a@b.com', password: 'Abc1', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('court') }));
  });

  it('400 — mot de passe sans majuscule', async () => {
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'a@b.com', password: 'password1', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('majuscule') }));
  });

  it('400 — mot de passe sans chiffre', async () => {
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'a@b.com', password: 'PasswordABC', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 — pays manquant', async () => {
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'a@b.com', password: 'Pass1234' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Pays requis' }));
  });

  it('400 — email déjà utilisé', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 9 }] }); // email existe
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'existe@b.com', password: 'Pass1234', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('déjà utilisé') }));
  });

  it('201 — inscription réussie avec vérification email requise', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // SELECT (pas de doublon)
      .mockResolvedValueOnce({ rows: [{ id: 2, email: 'new@b.com', nom: 'Dupont', prenom: 'Alice', pays: 'Bénin' }] }); // INSERT
    const { req, res } = mockReqRes({ prenom: 'Alice', nom: 'Dupont', email: 'new@b.com', password: 'Pass1234', pays: 'Bénin' });
    await ctrl.register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      requiresVerification: true,
      email: 'new@b.com',
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe('login', () => {
  it('400 — email invalide', async () => {
    const { req, res } = mockReqRes({ email: 'pas-un-email', password: 'Pass1234' });
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 — mot de passe manquant', async () => {
    const { req, res } = mockReqRes({ email: 'a@b.com' });
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('401 — utilisateur introuvable', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ email: 'inconnu@b.com', password: 'Pass1234' });
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('incorrect') }));
  });

  it('401 — mot de passe incorrect', async () => {
    pool.query.mockResolvedValueOnce({ rows: [DB_USER] });
    bcrypt.compare.mockResolvedValueOnce(false);
    const { req, res } = mockReqRes({ email: 'alice@test.com', password: 'WrongPass' });
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('403 — email non vérifié → renvoie un code de vérification', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...DB_USER, email_verified: false }] });
    const { req, res } = mockReqRes({ email: 'alice@test.com', password: 'Pass1234' });
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ requiresVerification: true }));
  });

  it('200 — connexion réussie, retourne token + user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [DB_USER] });
    mockSessionQueries();
    const { req, res } = mockReqRes({ email: 'alice@test.com', password: 'Pass1234' });
    await ctrl.login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: 'mock.jwt.token',
      user: expect.objectContaining({ email: 'alice@test.com' }),
    }));
  });

  it('200 — 2FA activé → retourne requires2FA et tempToken sans connecter', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...DB_USER, two_fa_enabled: true }] });
    const { req, res } = mockReqRes({ email: 'alice@test.com', password: 'Pass1234' });
    await ctrl.login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      requires2FA: true,
      tempToken: 'mock.jwt.token',
    }));
  });

  it("401 — compte OAuth sans mot de passe", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...DB_USER, password: null, auth_method: 'google' }] });
    const { req, res } = mockReqRes({ email: 'alice@test.com', password: 'Pass1234' });
    await ctrl.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Google') }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('forgotPassword', () => {
  it('400 — email invalide', async () => {
    const { req, res } = mockReqRes({ email: 'invalid' });
    await ctrl.forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 — email inconnu (réponse identique pour éviter l\'énumération)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ email: 'inconnu@b.com' });
    await ctrl.forgotPassword(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('400 — compte OAuth (pas de mot de passe)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, prenom: 'Alice', auth_method: 'google' }] });
    const { req, res } = mockReqRes({ email: 'alice@test.com' });
    await ctrl.forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Google') }));
  });

  it('200 — code envoyé avec succès', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, prenom: 'Alice', auth_method: 'email' }] });
    const { req, res } = mockReqRes({ email: 'alice@test.com' });
    await ctrl.forgotPassword(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('resetPassword', () => {
  it('400 — champs manquants', async () => {
    const { req, res } = mockReqRes({ email: 'a@b.com' }); // code et newPassword absents
    await ctrl.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('401 — code OTP incorrect ou expiré', async () => {
    // On ne stocke pas de code → checkOtp retourne false
    const { req, res } = mockReqRes({ email: 'alice@test.com', code: '000000', newPassword: 'NewPass1' });
    await ctrl.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('expiré') }));
  });

  it('400 — nouveau mot de passe trop court', async () => {
    // Injecter un OTP valide manuellement
    const { storeOtp } = require('../utils/otp');
    storeOtp('pwd-reset', 'short@test.com', '123456');
    const { req, res } = mockReqRes({ email: 'short@test.com', code: '123456', newPassword: 'Ab1' });
    await ctrl.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('court') }));
  });

  it('200 — mot de passe réinitialisé avec succès', async () => {
    const { storeOtp } = require('../utils/otp');
    storeOtp('pwd-reset', 'alice@test.com', '654321');
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // UPDATE password
    const { req, res } = mockReqRes({ email: 'alice@test.com', code: '654321', newPassword: 'NewPass1' });
    await ctrl.resetPassword(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
