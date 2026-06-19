const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const uploadDocument = async (type, file) => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const deleteDocument = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const launchAnalysis = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/analysis/launch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getAnalysis = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/analysis/latest`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getAllAnalyses = async () => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(filtres).toString();
  const response = await fetch(`${API_URL}/bourses${params ? '?' + params : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getBourseDetail = async (id) => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(filtres).toString();
  const response = await fetch(`${API_URL}/universities${params ? '?' + params : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getUniversityDetail = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/universities/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const getCandidatures = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/universities/candidatures`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const upsertCandidature = async (universityId, data) => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/universities/${universityId}/candidature`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// ── Auth sociale & téléphone ─────────────────────────────────────────
export const googleLogin = async (credential) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  return response.json();
};

export const facebookLogin = async (accessToken) => {
  const response = await fetch(`${API_URL}/auth/facebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
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

// ── Lettre de motivation ─────────────────────────────────────────────
const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` });

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
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('cv', file);
  const res = await fetch(`${API_URL}/cv/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
  return res.json();
};

// ── Logement ─────────────────────────────────────────────────────────
export const getLogement = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/logement`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

export const upsertLogement = async (data) => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/logement/guide-ia`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};