import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, getRefreshToken, getUser, saveAuth, saveTokens, clearAuth, updateStoredUser } from '../utils/auth';

const MOCK_USER         = { id: 1, email: 'alice@test.com', prenom: 'Alice' };
const MOCK_TOKEN        = 'mock.jwt.token';
const MOCK_REFRESH_TOKEN = 'mock.refresh.token';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ─── getToken ─────────────────────────────────────────────────────────────────

describe('getToken', () => {
  it('retourne null si aucun token stocké', () => {
    expect(getToken()).toBeNull();
  });

  it('lit depuis sessionStorage en priorité', () => {
    sessionStorage.setItem('token', 'session-token');
    localStorage.setItem('token', 'local-token');
    expect(getToken()).toBe('session-token');
  });

  it('lit depuis localStorage si sessionStorage est vide', () => {
    localStorage.setItem('token', 'local-token');
    expect(getToken()).toBe('local-token');
  });
});

// ─── getRefreshToken ──────────────────────────────────────────────────────────

describe('getRefreshToken', () => {
  it('retourne null si aucun refresh token', () => {
    expect(getRefreshToken()).toBeNull();
  });

  it('lit le refresh token depuis localStorage', () => {
    localStorage.setItem('refreshToken', MOCK_REFRESH_TOKEN);
    expect(getRefreshToken()).toBe(MOCK_REFRESH_TOKEN);
  });
});

// ─── getUser ──────────────────────────────────────────────────────────────────

describe('getUser', () => {
  it('retourne null si aucun utilisateur stocké', () => {
    expect(getUser()).toBeNull();
  });

  it('parse et retourne l\'objet utilisateur depuis sessionStorage', () => {
    sessionStorage.setItem('user', JSON.stringify(MOCK_USER));
    expect(getUser()).toEqual(MOCK_USER);
  });

  it('parse et retourne l\'objet utilisateur depuis localStorage', () => {
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    expect(getUser()).toEqual(MOCK_USER);
  });

  it('retourne null si le JSON est corrompu', () => {
    sessionStorage.setItem('user', 'not-valid-json{{{');
    expect(getUser()).toBeNull();
  });
});

// ─── saveAuth ─────────────────────────────────────────────────────────────────

describe('saveAuth', () => {
  it('stocke token, refreshToken et user dans localStorage quand remember=true', () => {
    saveAuth(MOCK_TOKEN, MOCK_REFRESH_TOKEN, MOCK_USER, true);
    expect(localStorage.getItem('token')).toBe(MOCK_TOKEN);
    expect(localStorage.getItem('refreshToken')).toBe(MOCK_REFRESH_TOKEN);
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(MOCK_USER);
  });

  it('stocke dans sessionStorage quand remember=false', () => {
    saveAuth(MOCK_TOKEN, MOCK_REFRESH_TOKEN, MOCK_USER, false);
    expect(sessionStorage.getItem('token')).toBe(MOCK_TOKEN);
    expect(sessionStorage.getItem('refreshToken')).toBe(MOCK_REFRESH_TOKEN);
    expect(JSON.parse(sessionStorage.getItem('user'))).toEqual(MOCK_USER);
  });

  it('efface sessionStorage quand remember=true (évite les doublons)', () => {
    sessionStorage.setItem('token', 'old-session-token');
    sessionStorage.setItem('refreshToken', 'old-session-refresh');
    saveAuth(MOCK_TOKEN, MOCK_REFRESH_TOKEN, MOCK_USER, true);
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
  });

  it('efface localStorage quand remember=false (évite les doublons)', () => {
    localStorage.setItem('token', 'old-local-token');
    localStorage.setItem('refreshToken', 'old-local-refresh');
    saveAuth(MOCK_TOKEN, MOCK_REFRESH_TOKEN, MOCK_USER, false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

// ─── saveTokens ───────────────────────────────────────────────────────────────

describe('saveTokens', () => {
  it('met à jour le token dans localStorage si le token courant y est stocké', () => {
    localStorage.setItem('token', MOCK_TOKEN);
    saveTokens('new-access-token', 'new-refresh-token');
    expect(localStorage.getItem('token')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
  });

  it('met à jour le token dans sessionStorage si le token courant y est stocké', () => {
    sessionStorage.setItem('token', MOCK_TOKEN);
    saveTokens('new-access-token', 'new-refresh-token');
    expect(sessionStorage.getItem('token')).toBe('new-access-token');
    expect(sessionStorage.getItem('refreshToken')).toBe('new-refresh-token');
  });

  it('ne fait rien si aucun token n\'est actuellement stocké', () => {
    saveTokens('new-access-token', 'new-refresh-token');
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});

// ─── clearAuth ────────────────────────────────────────────────────────────────

describe('clearAuth', () => {
  it('supprime token et user des deux stores', () => {
    localStorage.setItem('token', MOCK_TOKEN);
    sessionStorage.setItem('user', JSON.stringify(MOCK_USER));
    clearAuth();
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });
});

// ─── updateStoredUser ─────────────────────────────────────────────────────────

describe('updateStoredUser', () => {
  it('met à jour l\'utilisateur dans localStorage si présent', () => {
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    const updated = { ...MOCK_USER, prenom: 'Alicia' };
    updateStoredUser(updated);
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(updated);
  });

  it('met à jour l\'utilisateur dans sessionStorage si présent', () => {
    sessionStorage.setItem('user', JSON.stringify(MOCK_USER));
    const updated = { ...MOCK_USER, prenom: 'Alicia' };
    updateStoredUser(updated);
    expect(JSON.parse(sessionStorage.getItem('user'))).toEqual(updated);
  });

  it('ne crée pas d\'entrée si aucun store ne contient l\'utilisateur', () => {
    updateStoredUser(MOCK_USER);
    expect(localStorage.getItem('user')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });
});
