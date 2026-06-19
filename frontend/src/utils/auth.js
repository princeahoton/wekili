/**
 * Helpers d'authentification.
 *
 * "Se souvenir de moi" coché  → token + user dans localStorage (persiste entre sessions)
 * Non coché                   → token + user dans sessionStorage (disparaît à la fermeture)
 *
 * Toutes les fonctions lisent les deux stores pour rester rétrocompatibles.
 */

export const getToken = () =>
  sessionStorage.getItem('token') || localStorage.getItem('token') || null;

export const getUser = () => {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

export const saveAuth = (token, user, remember = true) => {
  const store = remember ? localStorage : sessionStorage;
  store.setItem('token', token);
  store.setItem('user', JSON.stringify(user));
  // Nettoyer l'autre store pour éviter les doublons
  if (remember) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const clearAuth = () => {
  ['token', 'user'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

export const updateStoredUser = (user) => {
  const json = JSON.stringify(user);
  if (localStorage.getItem('user')) localStorage.setItem('user', json);
  if (sessionStorage.getItem('user')) sessionStorage.setItem('user', json);
};
