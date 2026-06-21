/**
 * Gestion des tokens d'authentification.
 *
 * "Se souvenir de moi" coché  → tokens + user dans localStorage (persiste entre sessions)
 * Non coché                   → tokens + user dans sessionStorage (disparaît à la fermeture)
 */

export const getToken = () =>
  sessionStorage.getItem('token') || localStorage.getItem('token') || null;

export const getRefreshToken = () =>
  sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken') || null;

export const getUser = () => {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

export const saveAuth = (token, refreshToken, user, remember = true) => {
  const store = remember ? localStorage : sessionStorage;
  store.setItem('token', token);
  if (refreshToken) store.setItem('refreshToken', refreshToken);
  store.setItem('user', JSON.stringify(user));
  // Nettoyer l'autre store pour éviter les doublons
  const other = remember ? sessionStorage : localStorage;
  ['token', 'refreshToken', 'user'].forEach(k => other.removeItem(k));
};

// Met à jour seulement les tokens (appelé après un refresh silencieux)
export const saveTokens = (token, refreshToken) => {
  if (localStorage.getItem('token')) {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  } else if (sessionStorage.getItem('token')) {
    sessionStorage.setItem('token', token);
    if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearAuth = () => {
  ['token', 'refreshToken', 'user'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

export const updateStoredUser = (user) => {
  const json = JSON.stringify(user);
  if (localStorage.getItem('user'))    localStorage.setItem('user', json);
  if (sessionStorage.getItem('user'))  sessionStorage.setItem('user', json);
};
