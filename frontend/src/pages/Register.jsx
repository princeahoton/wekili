import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, googleLogin } from '../services/api';
import { saveAuth } from '../utils/auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const PAYS_AFRIQUE = [
  'Bénin', 'Burkina Faso', "Côte d'Ivoire", 'Cameroun', 'Congo',
  'Gabon', 'Guinée', 'Madagascar', 'Mali', 'Mauritanie',
  'Niger', 'République Démocratique du Congo', 'Rwanda', 'Sénégal',
  'Tchad', 'Togo', 'Autre',
];

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', pays: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);
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
    saveAuth(result.token, result.user, true);
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
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!cguAccepted) {
      setError("Veuillez accepter les Conditions d'utilisation pour continuer.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await register(form);
      if (result.success && result.requiresVerification) {
        navigate('/verify-email', { state: { email: result.email || form.email } });
      } else if (result.success) {
        navigate('/verify-email', { state: { email: form.email } });
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

          {/* Proposition de valeur */}
          <div className="space-y-5">
            <div>
              <h2 className="text-white text-2xl font-bold mb-2 leading-snug">
                Votre conseiller IA pour les bourses internationales
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Wekili analyse votre dossier, identifie les bourses qui correspondent à votre profil et vous guide à chaque étape de votre candidature.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                { icon: '🔍', txt: 'Recherche de bourses adaptées à votre profil' },
                { icon: '🤖', txt: 'Analyse automatique de votre dossier par IA' },
                { icon: '🎯', txt: 'Recommandations personnalisées et score d\'éligibilité' },
                { icon: '📋', txt: 'Suivi de vos candidatures en un seul endroit' },
                { icon: '🔔', txt: 'Alertes sur les nouvelles opportunités' },
              ].map((item) => (
                <li key={item.txt} className="flex items-start gap-3">
                  <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
                  <span className="text-white/80 text-sm leading-relaxed">{item.txt}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2 bg-white/10 border border-white/20 rounded-xl p-4">
              <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-white/60 text-xs leading-relaxed">
                Vos données personnelles et documents sont chiffrés et stockés de façon sécurisée. Inscription 100 % gratuite, sans carte bancaire.
              </p>
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
                  type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder="Minimum 8 caractères" required minLength={8}
                  className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  {showPwd ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <div className={`flex items-center border rounded-xl px-4 py-3.5 gap-3 transition-all focus-within:ring-2 ${
                form.confirm && form.confirm !== form.password
                  ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
                  : form.confirm && form.confirm === form.password
                  ? 'border-green-400 focus-within:border-green-500 focus-within:ring-green-100'
                  : 'border-gray-200 focus-within:border-[#1a3a6b] focus-within:ring-[#1a3a6b]/10'
              }`}>
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showConfirm ? 'text' : 'password'} name="confirm" value={form.confirm} onChange={handleChange}
                  placeholder="Répétez votre mot de passe" required
                  className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400"
                />
                {form.confirm && form.confirm === form.password && (
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
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
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cguAccepted}
                onChange={e => { setCguAccepted(e.target.checked); setError(''); }}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1a3a6b] accent-[#1a3a6b] shrink-0 cursor-pointer"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                J'accepte les{' '}
                <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-[#1a3a6b] hover:underline font-medium" onClick={e => e.stopPropagation()}>Conditions d'utilisation</a>
                {' '}et la{' '}
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-[#1a3a6b] hover:underline font-medium" onClick={e => e.stopPropagation()}>Politique de confidentialité</a>
                {' '}de Wekili.
              </span>
            </label>

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
