import { getToken, getRefreshToken, saveTokens, clearAuth } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Refresh silencieux ────────────────────────────────────────────────────────

let _refreshing = null; // singleton — évite les refreshes parallèles

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.token) return false;
    saveTokens(data.token, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// Wrapper central pour toutes les requêtes authentifiées.
// En cas de 401, tente un refresh une seule fois avant de déconnecter.
async function authedFetch(url, options = {}) {
  const makeHeaders = () => ({
    ...options.headers,
    'Authorization': `Bearer ${getToken()}`,
  });

  const res = await fetch(url, { ...options, headers: makeHeaders() });

  if (res.status !== 401) return res;

  // Refresh (singleton pour requêtes parallèles)
  if (!_refreshing) {
    _refreshing = refreshAccessToken().finally(() => { _refreshing = null; });
  }
  const ok = await _refreshing;

  if (!ok) {
    clearAuth();
    window.location.href = '/login';
    return res;
  }

  // Réessai avec le nouveau token
  return fetch(url, { ...options, headers: makeHeaders() });
}

// ── Auth (sans token) ─────────────────────────────────────────────────────────

export const register = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const googleLogin = async (credential, signup = false) => {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, signup }),
  });
  return res.json();
};

export const facebookLogin = async (accessToken, signup = false) => {
  const res = await fetch(`${API_URL}/auth/facebook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, signup }),
  });
  return res.json();
};

export const sendPhoneOTP = async (phone) => {
  const res = await fetch(`${API_URL}/auth/phone/send-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }),
  });
  return res.json();
};

export const verifyPhoneOTP = async (phone, code, prenom, nom) => {
  const res = await fetch(`${API_URL}/auth/phone/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, prenom, nom }),
  });
  return res.json();
};

export const verifyEmailOTP = async (email, code) => {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }),
  });
  return res.json();
};

export const resendVerificationEmail = async (email) => {
  const res = await fetch(`${API_URL}/auth/resend-verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  });
  return res.json();
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  });
  return res.json();
};

export const resetPassword = async (email, code, newPassword) => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  return res.json();
};

export const verify2FA = async (tempToken, code) => {
  const res = await fetch(`${API_URL}/auth/2fa-verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, code }),
  });
  return res.json();
};

// Révocation du refresh token côté serveur + déconnexion locale
export const logout = async () => {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch { /* silencieux — la déconnexion locale réussit toujours */ }
  clearAuth();
};

// ── Profil ────────────────────────────────────────────────────────────────────

export const saveProfile = async (data) => {
  const res = await authedFetch(`${API_URL}/profile`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const getProfile = async () => {
  const res = await authedFetch(`${API_URL}/profile`);
  return res.json();
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const uploadDocument = async (type, file) => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);
  const res = await authedFetch(`${API_URL}/documents/upload`, { method: 'POST', body: formData });
  return res.json();
};

export const getDocuments = async () => {
  const res = await authedFetch(`${API_URL}/documents`);
  return res.json();
};

export const deleteDocument = async (id) => {
  const res = await authedFetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
  return res.json();
};

// ── Analyse ───────────────────────────────────────────────────────────────────

export const launchAnalysis = async () => {
  const res = await authedFetch(`${API_URL}/analysis/launch`, { method: 'POST' });
  return res.json();
};

export const getAnalysis = async () => {
  const res = await authedFetch(`${API_URL}/analysis/latest`);
  return res.json();
};

export const getAllAnalyses = async () => {
  const res = await authedFetch(`${API_URL}/analysis/all`);
  return res.json();
};

// ── Bourses ───────────────────────────────────────────────────────────────────

export const getBoursesPublic = async (filtres = {}) => {
  const params = new URLSearchParams(filtres).toString();
  const res = await fetch(`${API_URL}/bourses/public${params ? '?' + params : ''}`);
  return res.json();
};

export const getBourses = async (filtres = {}) => {
  const params = new URLSearchParams(filtres).toString();
  const res = await authedFetch(`${API_URL}/bourses${params ? '?' + params : ''}`);
  return res.json();
};

export const getBourseDetail = async (id) => {
  const res = await authedFetch(`${API_URL}/bourses/${id}`);
  return res.json();
};

// ── Universités ───────────────────────────────────────────────────────────────

export const getUniversitiesPublic = async (filtres = {}) => {
  const params = new URLSearchParams(filtres).toString();
  const res = await fetch(`${API_URL}/universities/public${params ? '?' + params : ''}`);
  return res.json();
};

export const getUniversities = async (filtres = {}) => {
  const params = new URLSearchParams(filtres).toString();
  const res = await authedFetch(`${API_URL}/universities${params ? '?' + params : ''}`);
  return res.json();
};

export const getUniversityDetail = async (id) => {
  const res = await authedFetch(`${API_URL}/universities/${id}`);
  return res.json();
};

export const getCandidatures = async () => {
  const res = await authedFetch(`${API_URL}/universities/candidatures`);
  return res.json();
};

export const upsertCandidature = async (universityId, data) => {
  const res = await authedFetch(`${API_URL}/universities/${universityId}/candidature`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteCandidature = async (universityId) => {
  const res = await authedFetch(`${API_URL}/universities/${universityId}/candidature`, { method: 'DELETE' });
  return res.json();
};

// ── Gestion utilisateur ───────────────────────────────────────────────────────

export const updateUser = async (data) => {
  const res = await authedFetch(`${API_URL}/user`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const changePassword = async (data) => {
  const res = await authedFetch(`${API_URL}/user/change-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteAccount = async (data) => {
  const res = await authedFetch(`${API_URL}/user`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

// ── 2FA ───────────────────────────────────────────────────────────────────────

export const enable2FA = async (password) => {
  const res = await authedFetch(`${API_URL}/user/2fa/enable`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
  });
  return res.json();
};

export const confirm2FA = async (code) => {
  const res = await authedFetch(`${API_URL}/user/2fa/confirm`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
  });
  return res.json();
};

export const disable2FA = async (password) => {
  const res = await authedFetch(`${API_URL}/user/2fa/disable`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
  });
  return res.json();
};

// ── Sessions ──────────────────────────────────────────────────────────────────

export const getSessions = async () => {
  const res = await authedFetch(`${API_URL}/user/sessions`);
  return res.json();
};

// ── Vérification téléphone profil ─────────────────────────────────────────────

export const sendProfilePhoneOTP = async (telephone) => {
  const res = await authedFetch(`${API_URL}/profile/phone/send-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telephone }),
  });
  return res.json();
};

export const verifyProfilePhoneOTP = async (telephone, code) => {
  const res = await authedFetch(`${API_URL}/profile/phone/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telephone, code }),
  });
  return res.json();
};

// ── Lettre de motivation ───────────────────────────────────────────────────────

export const getLMVersions = async () => {
  const res = await authedFetch(`${API_URL}/lm`, { headers: { 'Content-Type': 'application/json' } });
  return res.json();
};

export const genererLM = async (data) => {
  const res = await authedFetch(`${API_URL}/lm/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const corrigerLM = async (data) => {
  const res = await authedFetch(`${API_URL}/lm/correct`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const sauvegarderLM = async (data) => {
  const res = await authedFetch(`${API_URL}/lm/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

// ── CV ────────────────────────────────────────────────────────────────────────

export const getCVVersions = async () => {
  const res = await authedFetch(`${API_URL}/cv`, { headers: { 'Content-Type': 'application/json' } });
  return res.json();
};

export const corrigerCV = async (data) => {
  const res = await authedFetch(`${API_URL}/cv/correct`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const sauvegarderCV = async (data) => {
  const res = await authedFetch(`${API_URL}/cv/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const uploadCVPDF = async (file) => {
  const form = new FormData();
  form.append('cv', file);
  const res = await authedFetch(`${API_URL}/cv/upload`, { method: 'POST', body: form });
  return res.json();
};

// ── Logement ──────────────────────────────────────────────────────────────────

export const getLogement = async () => {
  const res = await authedFetch(`${API_URL}/logement`);
  return res.json();
};

export const upsertLogement = async (data) => {
  const res = await authedFetch(`${API_URL}/logement`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
};

export const getGuideLogementIA = async () => {
  const res = await authedFetch(`${API_URL}/logement/guide-ia`);
  return res.json();
};

// ── Accès documents (PIN) ─────────────────────────────────────────────────────

export const requestDocAccess = async () => {
  const res = await authedFetch(`${API_URL}/documents/request-access`, { method: 'POST' });
  return res.json();
};

export const verifyDocAccess = async (code) => {
  const res = await authedFetch(`${API_URL}/documents/verify-access`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
  });
  return res.json();
};

export const checkDocPin = async () => {
  const res = await authedFetch(`${API_URL}/documents/pin/check`);
  return res.json();
};

export const createDocPin = async (pin) => {
  const res = await authedFetch(`${API_URL}/documents/pin/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
  });
  return res.json();
};

export const verifyDocPin = async (pin) => {
  const res = await authedFetch(`${API_URL}/documents/pin/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
  });
  return res.json();
};

export const requestPinReset = async () => {
  const res = await authedFetch(`${API_URL}/documents/pin/reset/request`, { method: 'POST' });
  return res.json();
};

export const confirmPinReset = async (code, newPin) => {
  const res = await authedFetch(`${API_URL}/documents/pin/reset/confirm`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, newPin }),
  });
  return res.json();
};

export const getDocumentLogs = async () => {
  const res = await authedFetch(`${API_URL}/documents/logs`);
  return res.json();
};

// ── Admin ─────────────────────────────────────────────────────────────────────

const adminFetch = async (path, options = {}) => {
  const res = await authedFetch(`${API_URL}/admin${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  return res.json();
};

export const adminGetStats        = ()           => adminFetch('/stats');
export const adminGetUsers        = (p = {})     => adminFetch(`/users?${new URLSearchParams(p)}`);
export const adminGetUserDetail   = (id)         => adminFetch(`/users/${id}`);
export const adminUpdateUserRole  = (id, role)   => adminFetch(`/users/${id}/role`,    { method: 'PATCH',  body: JSON.stringify({ role }) });
export const adminDeleteUser      = (id)         => adminFetch(`/users/${id}`,         { method: 'DELETE' });

export const adminGetBourses      = (p = {})     => adminFetch(`/bourses?${new URLSearchParams(p)}`);
export const adminCreateBourse    = (data)       => adminFetch('/bourses',             { method: 'POST',   body: JSON.stringify(data) });
export const adminUpdateBourse    = (id, data)   => adminFetch(`/bourses/${id}`,       { method: 'PATCH',  body: JSON.stringify(data) });
export const adminDeleteBourse    = (id)         => adminFetch(`/bourses/${id}`,       { method: 'DELETE' });

export const adminGetUniversities   = (p = {})   => adminFetch(`/universities?${new URLSearchParams(p)}`);
export const adminCreateUniversity  = (data)     => adminFetch('/universities',        { method: 'POST',   body: JSON.stringify(data) });
export const adminUpdateUniversity  = (id, data) => adminFetch(`/universities/${id}`,  { method: 'PATCH',  body: JSON.stringify(data) });
export const adminDeleteUniversity  = (id)       => adminFetch(`/universities/${id}`,  { method: 'DELETE' });
