import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmailOTP, resendVerificationEmail } from '../services/api';
import { saveAuth } from '../utils/auth';

function VerifyEmail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || '';

  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) { navigate('/register'); return; }

    let secs = 60;
    const timer = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) { clearInterval(timer); setCanResend(true); }
    }, 1000);
    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Entrez le code à 6 chiffres reçu par email.'); return; }
    setLoading(true); setError('');
    try {
      const result = await verifyEmailOTP(email, code);
      if (result.success) {
        saveAuth(result.token, result.user, true);
        navigate('/dashboard', { replace: true, state: { toast: { type: 'success', msg: `Bienvenue sur Wekili, ${result.user?.prenom || ''} ! Votre compte est activé.` } } });
      } else {
        setError(result.message || 'Code incorrect ou expiré.');
      }
    } catch { setError('Erreur de connexion au serveur.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError(''); setResendMsg('');
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setResendMsg('Nouveau code envoyé !');
        setCountdown(60); setCanResend(false);
        let secs = 60;
        const timer = setInterval(() => {
          secs -= 1;
          setCountdown(secs);
          if (secs <= 0) { clearInterval(timer); setCanResend(true); }
        }, 1000);
      } else {
        setError(result.message || "Erreur lors de l'envoi.");
      }
    } catch { setError('Erreur de connexion au serveur.'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/">
            <img src="/logo.svg" alt="Wekili" className="h-12 mx-auto mb-6" />
          </a>

          {/* Icône email */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#1a3a6b] mb-2">Vérifiez votre email</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Un code à 6 chiffres a été envoyé à<br />
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleVerify} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code de vérification
              </label>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
                maxLength={6}
                autoFocus
                inputMode="numeric"
                className="w-full border border-gray-200 rounded-xl px-4 py-4 text-3xl text-center font-mono tracking-[0.5em] outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
              />
              <p className="text-xs text-gray-400 mt-2 text-center">Valable 10 minutes</p>
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

            {/* Succès renvoi */}
            {resendMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {resendMsg}
              </div>
            )}

            {/* Bouton valider */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-[#1a3a6b] hover:bg-[#0f2550] text-white py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Vérification...
                </>
              ) : 'Vérifier et accéder à mon compte →'}
            </button>
          </form>

          {/* Renvoi */}
          <div className="mt-5 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[#1a3a6b] font-semibold hover:text-[#F5A623] transition-colors disabled:opacity-50"
              >
                {resending ? 'Envoi en cours...' : 'Renvoyer le code'}
              </button>
            ) : (
              <p className="text-sm text-gray-400">
                Renvoyer dans <span className="font-semibold text-gray-600">{countdown}s</span>
              </p>
            )}
          </div>

          {/* Retour */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Retour à l'inscription
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vérifiez vos dossiers spam si vous ne recevez pas l'email dans 2 minutes.
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
