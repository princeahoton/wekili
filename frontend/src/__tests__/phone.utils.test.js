import { describe, it, expect } from 'vitest';
import { normalisePhone, validatePhone } from '../utils/phone';

// ─── normalisePhone ───────────────────────────────────────────────────────────

describe('normalisePhone', () => {
  it('supprime les espaces', () => {
    expect(normalisePhone('+229 97 00 00 00')).toBe('+22997000000');
  });

  it('supprime les tirets', () => {
    expect(normalisePhone('+229-97-00-00-00')).toBe('+22997000000');
  });

  it('supprime les parenthèses', () => {
    expect(normalisePhone('+229(97)000000')).toBe('+22997000000');
  });

  it('supprime les points', () => {
    expect(normalisePhone('+229.97.00.00.00')).toBe('+22997000000');
  });

  it('conserve le signe + et les chiffres', () => {
    expect(normalisePhone('+33612345678')).toBe('+33612345678');
  });

  it('retourne une chaîne vide si la valeur est falsy', () => {
    expect(normalisePhone('')).toBe('');
    expect(normalisePhone(null)).toBe('');
    expect(normalisePhone(undefined)).toBe('');
  });
});

// ─── validatePhone ────────────────────────────────────────────────────────────

describe('validatePhone', () => {
  it('retourne null pour une valeur vide (champ optionnel)', () => {
    expect(validatePhone('')).toBeNull();
    expect(validatePhone(null)).toBeNull();
    expect(validatePhone(undefined)).toBeNull();
  });

  it("erreur si le préfixe + est absent", () => {
    expect(validatePhone('22997000000')).toMatch(/préfixe/i);
  });

  it('erreur si le numéro contient des lettres après le +', () => {
    expect(validatePhone('+229ABCDEFG')).toMatch(/invalide/i);
  });

  it('erreur si le numéro est trop court (< 9 chars normalisés)', () => {
    expect(validatePhone('+22912')).toMatch(/court/i);
  });

  it('erreur si le numéro est trop long (> 16 chars normalisés)', () => {
    expect(validatePhone('+12345678901234567')).toMatch(/long/i);
  });

  it('retourne null pour un numéro béninois valide', () => {
    expect(validatePhone('+229 97 00 00 00')).toBeNull();
  });

  it('retourne null pour un numéro sénégalais valide', () => {
    expect(validatePhone('+221 77 123 45 67')).toBeNull();
  });

  it('retourne null pour un numéro français valide', () => {
    expect(validatePhone('+33 6 12 34 56 78')).toBeNull();
  });

  it('erreur si le premier chiffre après + est 0', () => {
    // +0XX n'est pas un indicatif valide
    expect(validatePhone('+012345678')).toMatch(/invalide/i);
  });
});
