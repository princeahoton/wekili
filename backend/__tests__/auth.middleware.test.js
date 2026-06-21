'use strict';

jest.mock('jsonwebtoken');

const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

function makeReqRes(authorizationHeader) {
  const req = { headers: { authorization: authorizationHeader } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('authMiddleware', () => {
  it('rejette si aucun header Authorization', () => {
    const { req, res, next } = makeReqRes(undefined);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token manquant' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejette si le header ne commence pas par Bearer', () => {
    const { req, res, next } = makeReqRes('Basic abc123');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejette si le token JWT est invalide', () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });
    const { req, res, next } = makeReqRes('Bearer bad.token.here');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide' });
    expect(next).not.toHaveBeenCalled();
  });

  it('appelle next() et positionne req.userId pour un token valide', () => {
    jwt.verify.mockReturnValue({ id: 99, email: 'user@test.com' });
    const { req, res, next } = makeReqRes('Bearer valid.token.here');
    authMiddleware(req, res, next);
    expect(req.userId).toBe(99);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
