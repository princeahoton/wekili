import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, googleLogin } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Login() {
  const navigate = useNavigate();

  // Email/password
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');


  // ── Initialiser Google Identity Services ─────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REMPLACE')) return;

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        use_fedcm_for_prompt: false,
      });
    };

    if (document.getElementById('gsi-script')) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, []);

  // ── Helpers communs ──────────────────────────────────────────────────
  function saveAndRedirect(result) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    navigate('/dashboard');
  }

  // ── Connexion email ──────────────────────────────────────────────────
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await login(form);
      if (result.success) saveAndRedirect(result);
      else setError(result.message || 'Email ou mot de passe incorrect');
    } catch { setError('Erreur de connexion au serveur. Vérifiez que le backend tourne.'); }
    finally { setLoading(false); }
  };

  // ── Connexion Google ─────────────────────────────────────────────────
  const handleGoogleCredential = async (response) => {
    setLoading(true); setError('');
    try {
      const result = await googleLogin(response.credential);
      if (result.success) saveAndRedirect(result);
      else setError(result.message || 'Erreur Google');
    } catch { setError('Erreur lors de la connexion Google.'); }
    finally { setLoading(false); }
  };

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REMPLACE')) {
      setError('Connexion Google non configurée — ajoutez VITE_GOOGLE_CLIENT_ID dans frontend/.env');
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('SDK Google non chargé. Rechargez la page.');
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=80"
          alt="Étudiants Wekili"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a6b] via-[#1a3a6b]/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between h-full p-10 w-full">
          <a href="/"><img src="/logo.svg" alt="Wekili" className="h-12 w-auto" /></a>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 text-[#F5A623]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white text-sm leading-relaxed italic mb-4">
              "Wekili m'a aidé à obtenir la Bourse Eiffel en identifiant exactement les faiblesses de mon dossier. Mon score est passé de 61 à 82 !"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
              <div>
                <p className="text-white font-semibold text-sm">Aminata Diallo</p>
                <p className="text-white/60 text-xs">Sénégal — Bourse Eiffel, France</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-white overflow-y-auto">

        <div className="flex justify-center mb-8 lg:hidden">
          <img src="/logo.svg" alt="Wekili" className="h-10" />
        </div>

        <div className="max-w-md w-full mx-auto">

          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Bon retour !
            </span>
            <h1 className="text-3xl font-bold text-[#1a3a6b] mb-2">Connectez-vous</h1>
            <p className="text-gray-500 text-base">Votre dossier, vos bourses et vos recommandations IA vous attendent.</p>
          </div>

          {/* ── Formulaire email ──────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse e-mail</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="exemple@email.com" required className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Mot de passe</label>
                <a href="/forgot-password" className="text-xs text-[#1a3a6b] hover:text-[#F5A623] transition-colors">Mot de passe oublié ?</a>
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-[#1a3a6b] hover:bg-[#0f2550] text-white py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Connexion en cours...' : 'Se connecter →'}
            </button>
          </form>

          {/* ── Séparateur ────────────────────────────────────────── */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou continuer avec</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Boutons sociaux ───────────────────────────────────── */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

          </div>

          {/* ── Lien inscription ──────────────────────────────────── */}
          <p className="text-center text-sm text-gray-500 mt-7">
            Pas encore de compte ?{' '}
            <button onClick={() => navigate('/register')} className="text-[#1a3a6b] font-bold hover:text-[#F5A623] transition-colors">
              Créer un compte gratuit
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;
