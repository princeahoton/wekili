'use strict';

const { storeOtp, checkOtp, makeCode } = require('../utils/otp');

describe('makeCode', () => {
  it('génère un code à 6 chiffres', () => {
    const code = makeCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('génère des codes différents à chaque appel', () => {
    const codes = new Set(Array.from({ length: 20 }, () => makeCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('storeOtp / checkOtp', () => {
  it('valide un code correct', () => {
    storeOtp('test-ns', 'key1', '123456');
    expect(checkOtp('test-ns', 'key1', '123456')).toBe(true);
  });

  it('rejette un code incorrect', () => {
    storeOtp('test-ns', 'key2', '111111');
    expect(checkOtp('test-ns', 'key2', '222222')).toBe(false);
  });

  it('invalide un code déjà utilisé (usage unique)', () => {
    storeOtp('test-ns', 'key3', '333333');
    checkOtp('test-ns', 'key3', '333333'); // premier usage
    expect(checkOtp('test-ns', 'key3', '333333')).toBe(false);
  });

  it("rejette un code pour une clé inexistante", () => {
    expect(checkOtp('test-ns', 'no-such-key', '000000')).toBe(false);
  });

  it('ignore les espaces autour du code', () => {
    storeOtp('test-ns', 'key4', '444444');
    expect(checkOtp('test-ns', 'key4', '  444444  ')).toBe(true);
  });

  it('isole les namespaces — un code dans ns1 ne valide pas dans ns2', () => {
    storeOtp('ns1', 'shared-key', '555555');
    expect(checkOtp('ns2', 'shared-key', '555555')).toBe(false);
    expect(checkOtp('ns1', 'shared-key', '555555')).toBe(true);
  });

  it('rejette un code expiré', () => {
    storeOtp('test-ns', 'key5', '666666', -1); // TTL négatif = déjà expiré
    expect(checkOtp('test-ns', 'key5', '666666')).toBe(false);
  });

  it('accepte les clés numériques (coercition en string)', () => {
    storeOtp('test-ns', 42, '777777');
    expect(checkOtp('test-ns', 42, '777777')).toBe(true);
  });
});
