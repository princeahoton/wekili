import { getToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

export const register = async (data) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const login = async (data) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const saveProfile = async (data) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getProfile = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const uploadDocument = async (type, file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);
  const response = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return response.json();
};

export const getDocuments = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const deleteDocument = async (id) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const launchAnalysis = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/analysis/launch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getAnalysis = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/analysis/latest`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getAllAnalyses = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/analysis/all`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// Endpoint public — aucun token requis
export const getBoursesPublic = async (filtres = {}) => {
  const params = new URLSearchParams(filtres).toString();
  const response = await fetch(`${API_URL}/bourses/public${params ? '?' + params : ''}`);
  return response.json();
};

export const getBourses = async (filtres = {}) => {
  const token = getToken();
  const params = new URLSearchParams(filtres).toString();
  const response = await fetch(`${API_URL}/bourses${params ? '?' + params : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getBourseDetail = async (id) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/bourses/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// ── Universités ──────────────────────────────────────────────────────
export const getUniversitiesPublic = async (filtres = {}) => {
  const params = new URLSearchParams(filtres).toString();
  const response = await fetch(`${API_URL}/universities/public${params ? '?' + params : ''}`);
  return response.json();
};

export const getUniversities = async (filtres = {}) => {
  const token = getToken();
  const params = new URLSearchParams(filtres).toString();
  const response = await fetch(`${API_URL}/universities${params ? '?' + params : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getUniversityDetail = async (id) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/universities/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getCandidatures = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/universities/candidatures`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const upsertCandidature = async (universityId, data) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/universities/${universityId}/candidature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteCandidature = async (universityId) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/universities/${universityId}/candidature`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// ── Auth sociale & téléphone ─────────────────────────────────────────
export const googleLogin = async (credential, signup = false) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, signup }),
  });
  return response.json();
};

export const facebookLogin = async (accessToken, signup = false) => {
  const response = await fetch(`${API_URL}/auth/facebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, signup }),
  });
  return response.json();
};

export const sendPhoneOTP = async (phone) => {
  const response = await fetch(`${API_URL}/auth/phone/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return response.json();
};

export const verifyPhoneOTP = async (phone, code, prenom, nom) => {
  const response = await fetch(`${API_URL}/auth/phone/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, prenom, nom }),
  });
  return response.json();
};

// ── Gestion utilisateur ───────────────────────────────────────────────

export const updateUser = async (data) => {
  const res = await fetch(`${API_URL}/user`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const changePassword = async (data) => {
  const res = await fetch(`${API_URL}/user/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteAccount = async (data) => {
  const res = await fetch(`${API_URL}/user`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── Vérification téléphone profil ────────────────────────────────────

export const sendProfilePhoneOTP = async (telephone) => {
  const res = await fetch(`${API_URL}/profile/phone/send-otp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ telephone }),
  });
  return res.json();
};

export const verifyProfilePhoneOTP = async (telephone, code) => {
  const res = await fetch(`${API_URL}/profile/phone/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ telephone, code }),
  });
  return res.json();
};

// ── Lettre de motivation ─────────────────────────────────────────────

export const getLMVersions = async () => {
  const res = await fetch(`${API_URL}/lm`, { headers: authHeaders() });
  return res.json();
};

export const genererLM = async (data) => {
  const res = await fetch(`${API_URL}/lm/generate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return res.json();
};

export const corrigerLM = async (data) => {
  const res = await fetch(`${API_URL}/lm/correct`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return res.json();
};

export const sauvegarderLM = async (data) => {
  const res = await fetch(`${API_URL}/lm/save`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return res.json();
};

// ── CV ───────────────────────────────────────────────────────────────
export const getCVVersions = async () => {
  const res = await fetch(`${API_URL}/cv`, { headers: authHeaders() });
  return res.json();
};

export const corrigerCV = async (data) => {
  const res = await fetch(`${API_URL}/cv/correct`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return res.json();
};

export const sauvegarderCV = async (data) => {
  const res = await fetch(`${API_URL}/cv/save`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return res.json();
};

export const uploadCVPDF = async (file) => {
  const token = getToken();
  const form = new FormData();
  form.append('cv', file);
  const res = await fetch(`${API_URL}/cv/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
  return res.json();
};

// ── Logement ─────────────────────────────────────────────────────────
export const getLogement = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/logement`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const upsertLogement = async (data) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/logement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getGuideLogementIA = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/logement/guide-ia`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// ── 2FA ──────────────────────────────────────────────────────────────────────
export const verifyEmailOTP = async (email, code) => {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  return res.json();
};

export const resendVerificationEmail = async (email) => {
  const res = await fetch(`${API_URL}/auth/resend-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const verify2FA = async (tempToken, code) => {
  const res = await fetch(`${API_URL}/auth/2fa-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, code }),
  });
  return res.json();
};

export const enable2FA = async (password) => {
  const res = await fetch(`${API_URL}/user/2fa/enable`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ password }),
  });
  return res.json();
};

export const confirm2FA = async (code) => {
  const res = await fetch(`${API_URL}/user/2fa/confirm`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ code }),
  });
  return res.json();
};

export const disable2FA = async (password) => {
  const res = await fetch(`${API_URL}/user/2fa/disable`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ password }),
  });
  return res.json();
};

// ── Sessions ─────────────────────────────────────────────────────────────────
export const getSessions = async () => {
  const res = await fetch(`${API_URL}/user/sessions`, { headers: authHeaders() });
  return res.json();
};

// ── Accès documents ───────────────────────────────────────────────────────────
export const requestDocAccess = async () => {
  const res = await fetch(`${API_URL}/documents/request-access`, {
    method: 'POST', headers: authHeaders(),
  });
  return res.json();
};

export const verifyDocAccess = async (code) => {
  const res = await fetch(`${API_URL}/documents/verify-access`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ code }),
  });
  return res.json();
};