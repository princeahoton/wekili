import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]           = useState('email'); // 'email' | 'reset'
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [newPwd, setNewPwd]       = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Compte à rebours pour renvoi du code
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Étape 1 : demander l'envoi du code ──────────────────────────────
  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { setError('Entrez votre adresse email.'); return; }
    setLoading(true); setError('');
    try {
      const result = await forgotPassword(email.trim().toLowerCase());
      if (result.success) {
        setStep('reset');
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(result.message || 'Erreur lors de l\'envoi.');
      }
    } catch {
      setError('Erreur de connexion au serveur. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 2 : valider le code et changer le mot de passe ────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Entrez le code à 6 chiffres reçu par email.'); return; }
    if (newPwd.length < 8) { setError('Mot de passe trop court (8 caractères min.)'); return; }
    if (newPwd !== confirmPwd) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true); setError('');
    try {
      const result = await resetPassword(email, code, newPwd);
      if (result.success) {
        navigate('/login', { replace: true, state: { toast: { type: 'success', msg: 'Mot de passe réinitialisé ! Connectez-vous avec votre nouveau mot de passe.' } } });
      } else {
        setError(result.message || 'Code incorrect ou expiré.');
      }
    } catch {
      setError('Erreur de connexion au serveur. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/">
            <img src="/logo.svg" alt="Wekili" className="h-12 mx-auto mb-6" />
          </a>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a3a6b] mb-2">
            {step === 'email' ? 'Mot de passe oublié' : 'Réinitialiser le mot de passe'}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {step === 'email'
              ? 'Entrez votre adresse email pour recevoir un code de réinitialisation.'
              : <>Un code a été envoyé à<br /><span className="font-semibold text-gray-700">{email}</span></>}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* ── Étape 1 : saisie de l'email ── */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse e-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="exemple@email.com"
                  required
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                />
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a3a6b] hover:bg-[#0f2550] text-white py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : 'Envoyer le code →'}
              </button>
            </form>
          )}

          {/* ── Étape 2 : code + nouveau mot de passe ── */}
          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code de vérification</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 text-3xl text-center font-mono tracking-[0.5em] outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">Valable 10 minutes — vérifiez vos spams</p>
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => { setNewPwd(e.target.value); setError(''); }}
                    placeholder="Au moins 8 caractères, 1 majuscule, 1 chiffre"
                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                    {showPwd
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => { setConfirmPwd(e.target.value); setError(''); }}
                  placeholder="Répétez le mot de passe"
                  className={`w-full border rounded-xl px-4 py-3.5 text-sm text-gray-700 outline-none focus:ring-2 transition-all ${
                    confirmPwd && confirmPwd !== newPwd
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-[#1a3a6b] focus:ring-[#1a3a6b]/10'
                  }`}
                />
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading || code.length !== 6 || !newPwd || newPwd !== confirmPwd}
                className="w-full bg-[#1a3a6b] hover:bg-[#0f2550] text-white py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : 'Réinitialiser le mot de passe →'}
              </button>

              {/* Renvoi du code */}
              <div className="text-center mt-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-sm text-[#1a3a6b] font-semibold hover:text-[#F5A623] transition-colors disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">
                    Renvoyer dans <span className="font-semibold text-gray-600">{countdown}s</span>
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Retour connexion */}
          <div className="mt-6 text-center">
            <button
              onClick={() => step === 'reset' ? setStep('email') : navigate('/login')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {step === 'reset' ? '← Changer d\'adresse email' : '← Retour à la connexion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <>
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      En cours…
    </>
  );
}
