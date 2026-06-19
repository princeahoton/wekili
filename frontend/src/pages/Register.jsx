import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, googleLogin } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const PAYS_AFRIQUE = [
  'Bénin', 'Burkina Faso', "Côte d'Ivoire", 'Cameroun', 'Congo',
  'Gabon', 'Guinée', 'Madagascar', 'Mali', 'Mauritanie',
  'Niger', 'République Démocratique du Congo', 'Rwanda', 'Sénégal',
  'Tchad', 'Togo', 'Autre',
];

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', pays: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const renderBtn = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        locale: 'fr',
        width: googleBtnRef.current.offsetWidth || 400,
      });
    };

    if (window.google) { renderBtn(); return; }

    if (!document.getElementById('gsi-script')) {
      const script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.google) { clearInterval(interval); renderBtn(); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  function saveAndRedirect(result) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    navigate('/dashboard');
  }

  const handleGoogleCredential = async (response) => {
    setLoading(true); setError('');
    try {
      const result = await googleLogin(response.credential);
      if (result.success) saveAndRedirect(result);
      else setError(result.message || 'Erreur Google');
    } catch { setError('Erreur lors de la connexion Google.'); }
    finally { setLoading(false); }
  };


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await register(form);
      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        setError(result.message || "Erreur lors de l'inscription");
      }
    } catch {
      setError('Erreur de connexion au serveur. Vérifiez que le backend tourne.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════════════
          PANNEAU GAUCHE — image + logo
      ══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">

        {/* Image étudiant */}
        <img
          src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=900&q=80"
          alt="Étudiants Wekili"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a6b] via-[#1a3a6b]/40 to-[#1a3a6b]/10" />

        {/* Contenu sur l'image */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 w-full">

          {/* Logo en haut */}
          <div>
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Wekili" className="h-12 w-auto" />
            </a>
          </div>

          {/* Stats milieu */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-white text-4xl font-extrabold">500+</p>
              <p className="text-white/70 text-sm">dossiers analysés avec succès</p>
            </div>
            <div>
              <p className="text-white text-4xl font-extrabold">60+</p>
              <p className="text-white/70 text-sm">bourses disponibles dans la base</p>
            </div>
            <div>
              <p className="text-white text-4xl font-extrabold">6</p>
              <p className="text-white/70 text-sm">pays de destination couverts</p>
            </div>
          </div>

          {/* Témoignage en bas */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map((i) => (
                <svg key={i} className="w-4 h-4 text-[#F5A623]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white text-sm leading-relaxed italic mb-4">
              "En 48h, Wekili a analysé mon profil et identifié 5 bourses auxquelles je n'avais même pas pensé. Je suis maintenant à Lyon !"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center text-white font-bold text-sm shrink-0">
                K
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Kofi Mensah</p>
                <p className="text-white/60 text-xs">Côte d'Ivoire — Master à Lyon</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          PANNEAU DROIT — formulaire
      ══════════════════════════════ */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-12 lg:px-14 py-10 bg-white overflow-y-auto">

        {/* Logo mobile */}
        <div className="flex justify-center mb-6 lg:hidden">
          <img src="/logo.svg" alt="Wekili" className="h-10" />
        </div>

        <div className="max-w-md w-full mx-auto">

          {/* En-tête */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Inscription gratuite
            </span>
            <h1 className="text-3xl font-bold text-[#1a3a6b] mb-2">Créez votre compte</h1>
            <p className="text-gray-500 text-base">
              Analysez votre dossier en quelques minutes et découvrez vos bourses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Prénom + Nom */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                <input
                  type="text" name="prenom" value={form.prenom} onChange={handleChange}
                  placeholder="Aminata" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-700 placeholder-gray-400 outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
                <input
                  type="text" name="nom" value={form.nom} onChange={handleChange}
                  placeholder="Diallo" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-700 placeholder-gray-400 outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse e-mail</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="exemple@email.com" required
                  className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Pays */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pays d'origine</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <select
                  name="pays" value={form.pays} onChange={handleChange} required
                  className="flex-1 outline-none text-base text-gray-700 bg-transparent appearance-none"
                >
                  <option value="">Sélectionnez votre pays</option>
                  {PAYS_AFRIQUE.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Minimum 8 caractères" required minLength={8}
                  className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* CGU */}
            <p className="text-xs text-gray-400 leading-relaxed">
              En créant un compte, vous acceptez nos{' '}
              <a href="#" className="text-[#1a3a6b] hover:underline">Conditions d'utilisation</a>
              {' '}et notre{' '}
              <a href="#" className="text-[#1a3a6b] hover:underline">Politique de confidentialité</a>.
            </p>

            {/* Bouton inscription */}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#F5A623] hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Création du compte...' : 'Analyser mon dossier gratuitement →'}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="w-full flex justify-center mb-3" />
          ) : (
            <p className="text-xs text-center text-gray-400 mb-3">Connexion Google non disponible</p>
          )}


          {/* Lien connexion */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <button onClick={() => navigate('/login')} className="text-[#1a3a6b] font-bold hover:text-[#F5A623] transition-colors">
              Se connecter
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;
