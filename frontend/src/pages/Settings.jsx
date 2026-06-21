import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateUser, changePassword, deleteAccount, getSessions, enable2FA, confirm2FA, disable2FA } from '../services/api';
import { getUser, clearAuth, updateStoredUser } from '../utils/auth';

// ── Utilitaires ───────────────────────────────────────────────────────────────

const capitalize = (s) =>
  (s || '').split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');

function calcForce(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[a-z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const FORCE_LABELS = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
const FORCE_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'];
const FORCE_TEXT   = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-blue-600', 'text-green-600'];

// ── Composants réutilisables ──────────────────────────────────────────────────

function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  const isErr = msg.type === 'error';
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold transition-all ${
      isErr ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
    }`}>
      {isErr
        ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      }
      {msg.text}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

function Card({ id, titre, description, children }) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-20">
      <div className="px-6 py-5 border-b border-gray-50">
        <h2 className="text-base font-bold text-gray-800">{titre}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function EyeBtn({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
      {show ? (
        <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

function VerifiedBadge({ verified, label }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
      {label || 'Vérifié'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      Non vérifié
    </span>
  );
}

function BtnPrimary({ children, loading, disabled, onClick, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled}
      className="inline-flex items-center gap-2 bg-[#1a3a6b] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0f2550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'infos',    label: 'Informations personnelles' },
  { id: 'mdp',      label: 'Mot de passe'              },
  { id: 'notifs',   label: 'Notifications'             },
  { id: 'securite', label: 'Sécurité'                  },
  { id: 'rgpd',     label: 'Confidentialité'           },
  { id: 'compte',   label: 'Compte'                    },
];

function fmtDate(d) {
  return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
function fmtUA(ua) {
  if (!ua) return 'Navigateur inconnu';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Google Chrome';
  if (/Firefox/i.test(ua)) return 'Mozilla Firefox';
  if (/Edg/i.test(ua)) return 'Microsoft Edge';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Apple Safari';
  return ua.slice(0, 50);
}

const NOTIF_TYPES = [
  { key: 'bourses',   label: 'Nouvelles bourses',    desc: 'Alertes quand une bourse correspond à votre profil' },
  { key: 'deadlines', label: 'Deadlines à venir',    desc: 'Rappel 30 jours avant la clôture d\'une bourse'    },
  { key: 'analyse',   label: 'Résultats d\'analyse', desc: 'Notification quand une analyse IA est terminée'    },
  { key: 'conseils',  label: 'Conseils & astuces',   desc: 'Newsletter mensuelle pour améliorer votre dossier' },
];

const INIT_NOTIFS = Object.fromEntries(
  NOTIF_TYPES.map(t => [t.key, { email: t.key !== 'conseils', whatsapp: false, sms: false }])
);

export default function Settings() {
  const navigate = useNavigate();
  const avatarRef = useRef(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [activeSection, setActiveSection] = useState('infos');
  const [toast, setToast]               = useState(null);

  // User & profil
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Section: informations
  const [infos, setInfos]         = useState({ prenom: '', nom: '', email: '', telephone: '' });
  const [savingInfos, setSavingInfos] = useState(false);

  // Section: mot de passe
  const [mdp, setMdp]           = useState({ actuel: '', nouveau: '', confirmer: '' });
  const [showMdp, setShowMdp]   = useState({ actuel: false, nouveau: false, confirmer: false });
  const [savingMdp, setSavingMdp] = useState(false);
  const force = calcForce(mdp.nouveau);

  // Section: notifications
  const [notifs, setNotifs]         = useState(INIT_NOTIFS);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Section: suppression
  const [deleteStep, setDeleteStep]   = useState(0);
  const [deleteMdp, setDeleteMdp]     = useState('');
  const [showDeleteMdp, setShowDeleteMdp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Section: sécurité — 2FA
  const [twoFaEnabled, setTwoFaEnabled]   = useState(false);
  const [enabling2FA, setEnabling2FA]     = useState(false);  // false | 'pending' | 'confirming'
  const [setupPwd, setSetupPwd]           = useState('');
  const [setupCode, setSetupCode]         = useState('');
  const [setupError, setSetupError]       = useState('');
  const [setupLoading, setSetupLoading]   = useState(false);
  const [disabling2FA, setDisabling2FA]   = useState(false);
  const [disablePwd, setDisablePwd]       = useState('');
  const [disableError, setDisableError]   = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Section: sécurité — sessions
  const [sessions, setSessions]             = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // ── Chargement ────────────────────────────────────────────────────────
  useEffect(() => {
    const u = getUser();
    if (!u) { navigate('/login', { replace: true }); return; }
    setUser(u);
    setTwoFaEnabled(u.two_fa_enabled || false);
    setInfos({ prenom: capitalize(u.prenom || ''), nom: capitalize(u.nom || ''), email: u.email || '', telephone: '' });

    setLoadingSessions(true);
    getSessions().then(r => { if (r?.sessions) setSessions(r.sessions); }).catch(() => {}).finally(() => setLoadingSessions(false));

    getProfile().then(res => {
      if (res?.profile) {
        setProfile(res.profile);
        setInfos(prev => ({ ...prev, telephone: res.profile.telephone || '' }));
      }
    }).catch(() => {});
  }, [navigate]);

  const showToast = (type, text) => setToast({ type, text });

  // ── Navigation sidebar ────────────────────────────────────────────────
  const scrollTo = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Avatar ────────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    showToast('success', 'Photo modifiée (non enregistrée — fonctionnalité à venir).');
  };

  // ── Enregistrer infos ─────────────────────────────────────────────────
  const handleSaveInfos = async (e) => {
    e.preventDefault();
    if (!infos.prenom.trim() || !infos.nom.trim()) { showToast('error', 'Prénom et nom requis.'); return; }
    setSavingInfos(true);
    try {
      const res = await updateUser({ prenom: infos.prenom, nom: infos.nom });
      if (res.success) {
        const updated = { ...user, ...res.user };
        updateStoredUser(updated);
        setUser(updated);
        showToast('success', 'Informations personnelles mises à jour.');
      } else {
        showToast('error', res.message || 'Erreur lors de la sauvegarde.');
      }
    } catch { showToast('error', 'Erreur de connexion au serveur.'); }
    finally { setSavingInfos(false); }
  };

  // ── Changer mot de passe ──────────────────────────────────────────────
  const handleChangeMdp = async (e) => {
    e.preventDefault();
    if (mdp.nouveau !== mdp.confirmer) { showToast('error', 'Les mots de passe ne correspondent pas.'); return; }
    if (force < 3) { showToast('error', 'Mot de passe trop faible. Renforcez-le.'); return; }
    setSavingMdp(true);
    try {
      const res = await changePassword({ actuel: mdp.actuel, nouveau: mdp.nouveau });
      if (res.success) {
        setMdp({ actuel: '', nouveau: '', confirmer: '' });
        showToast('success', 'Mot de passe modifié avec succès. Reconnectez-vous si nécessaire.');
      } else {
        showToast('error', res.message || 'Erreur.');
      }
    } catch { showToast('error', 'Erreur de connexion au serveur.'); }
    finally { setSavingMdp(false); }
  };

  // ── Enregistrer notifs ────────────────────────────────────────────────
  const handleSaveNotifs = () => {
    setSavingNotifs(true);
    setTimeout(() => { setSavingNotifs(false); showToast('success', 'Préférences de notifications enregistrées.'); }, 600);
  };

  const toutActiver   = () => setNotifs(Object.fromEntries(NOTIF_TYPES.map(t => [t.key, { email: true,  whatsapp: true,  sms: true  }])));
  const toutDesactiver = () => setNotifs(Object.fromEntries(NOTIF_TYPES.map(t => [t.key, { email: false, whatsapp: false, sms: false }])));

  // ── 2FA ───────────────────────────────────────────────────────────────
  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setSetupLoading(true); setSetupError('');
    try {
      const res = await enable2FA(setupPwd);
      if (res.success) { setEnabling2FA('confirming'); setSetupPwd(''); }
      else setSetupError(res.message || 'Erreur.');
    } catch { setSetupError('Erreur de connexion.'); }
    finally { setSetupLoading(false); }
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    setSetupLoading(true); setSetupError('');
    try {
      const res = await confirm2FA(setupCode);
      if (res.success) {
        setTwoFaEnabled(true); setEnabling2FA(false); setSetupCode('');
        updateStoredUser({ ...user, two_fa_enabled: true });
        showToast('success', 'Double authentification activée avec succès.');
      } else setSetupError(res.message || 'Erreur.');
    } catch { setSetupError('Erreur de connexion.'); }
    finally { setSetupLoading(false); }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setDisableLoading(true); setDisableError('');
    try {
      const res = await disable2FA(disablePwd);
      if (res.success) {
        setTwoFaEnabled(false); setDisabling2FA(false); setDisablePwd('');
        updateStoredUser({ ...user, two_fa_enabled: false });
        showToast('success', 'Double authentification désactivée.');
      } else setDisableError(res.message || 'Erreur.');
    } catch { setDisableError('Erreur de connexion.'); }
    finally { setDisableLoading(false); }
  };

  // ── Supprimer compte ──────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (user?.auth_method === 'email' && !deleteMdp.trim()) {
      showToast('error', 'Entrez votre mot de passe pour confirmer.');
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await deleteAccount({ password: deleteMdp });
      if (res.success) {
        clearAuth();
        navigate('/login', { replace: true, state: { deleted: true } });
      } else {
        showToast('error', res.message || 'Erreur.');
        setDeleteStep(2);
      }
    } catch { showToast('error', 'Erreur de connexion au serveur.'); }
    finally { setDeletingAccount(false); }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const isEmailVerified = user.auth_method === 'google' || user.auth_method === 'facebook';
  const isPhoneVerified = profile?.phone_verified === true;
  const initiales = `${capitalize(infos.prenom)?.[0] || ''}${capitalize(infos.nom)?.[0] || ''}`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toast msg={toast} onClose={() => setToast(null)} />

      {/* ── Sidebar ── */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full w-64 md:w-56 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard', { replace: window.location.pathname === '/dashboard' }); }}><img src="/logo.svg" alt="Wekili" className="h-9 w-auto" /></a>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === item.id
                  ? 'bg-[#1a3a6b] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a3a6b]'
              }`}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => navigate(-1)} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className="md:ml-56 flex-1">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-[#1a3a6b] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Paramètres</h1>
            <p className="text-xs text-gray-400">Gérez votre compte et vos préférences</p>
          </div>
        </div>

        <div className="p-4 md:p-8 pb-28 md:pb-12 max-w-2xl space-y-6">

          {/* ════════════════════════════════
              1. INFORMATIONS PERSONNELLES
          ════════════════════════════════ */}
          <Card id="infos" titre="Informations personnelles" description="Vos informations de base affichées sur votre compte">
            <form onSubmit={handleSaveInfos}>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                <div className="relative group cursor-pointer shrink-0" onClick={() => avatarRef.current?.click()}>
                  <div className="w-16 h-16 bg-[#1a3a6b] rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      : (user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span>{initiales}</span>
                        )
                    }
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div>
                  <p className="text-sm font-bold text-gray-800">{capitalize(infos.prenom)} {capitalize(infos.nom)}</p>
                  <p className="text-xs text-gray-500">{infos.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Candidat Wekili · {user.pays || '—'}</p>
                </div>
              </div>

              {/* Prénom + Nom */}
              <div className="flex gap-4 pb-5 border-b border-gray-50 mb-5">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Prénom</label>
                  <input
                    type="text" value={infos.prenom} required
                    onChange={e => setInfos({ ...infos, prenom: e.target.value })}
                    onBlur={e => setInfos({ ...infos, prenom: capitalize(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nom</label>
                  <input
                    type="text" value={infos.nom} required
                    onChange={e => setInfos({ ...infos, nom: e.target.value })}
                    onBlur={e => setInfos({ ...infos, nom: capitalize(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 pb-5 border-b border-gray-50 mb-5">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Adresse e-mail</label>
                  <input type="email" value={infos.email} readOnly
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">La modification d'email nécessite une vérification — bientôt disponible.</p>
                </div>
                <div className="mt-7">
                  <VerifiedBadge verified={isEmailVerified} label={isEmailVerified ? 'Vérifié via ' + (user.auth_method === 'google' ? 'Google' : user.auth_method) : undefined} />
                </div>
              </div>

              {/* Téléphone */}
              <div className="flex items-start gap-3 pb-5 border-b border-gray-50 mb-5">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Téléphone</label>
                  <input type="tel" value={infos.telephone} readOnly
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed outline-none"
                    placeholder="Non renseigné"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Modifiez votre téléphone depuis{' '}
                    <button type="button" onClick={() => navigate('/profile')} className="text-[#1a3a6b] hover:underline font-medium">votre profil</button>.
                  </p>
                </div>
                <div className="mt-7">
                  <VerifiedBadge verified={isPhoneVerified} />
                </div>
              </div>

              <div className="flex justify-end">
                <BtnPrimary type="submit" loading={savingInfos}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Enregistrer
                </BtnPrimary>
              </div>
            </form>
          </Card>

          {/* ════════════════════════════════
              2. MOT DE PASSE
          ════════════════════════════════ */}
          <Card id="mdp" titre="Mot de passe" description="Modifiez votre mot de passe de connexion">
            {user.auth_method !== 'email' ? (
              <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                Votre compte utilise la connexion via <span className="font-semibold capitalize">{user.auth_method}</span>. Aucun mot de passe n'est associé.
              </div>
            ) : (
              <form onSubmit={handleChangeMdp}>
                {/* Champs mot de passe */}
                {[
                  { key: 'actuel',    label: 'Mot de passe actuel',    ph: '••••••••'               },
                  { key: 'nouveau',   label: 'Nouveau mot de passe',   ph: 'Minimum 8 caractères'   },
                  { key: 'confirmer', label: 'Confirmer le nouveau',   ph: 'Répétez le mot de passe' },
                ].map(f => (
                  <div key={f.key} className="flex items-center gap-6 py-4 border-b border-gray-50 last:border-0">
                    <label className="w-44 text-sm font-semibold text-gray-700 shrink-0">{f.label}</label>
                    <div className="flex flex-1 items-center border border-gray-200 rounded-xl px-3 py-2.5 gap-2 focus-within:border-[#1a3a6b] focus-within:ring-2 focus-within:ring-[#1a3a6b]/10 transition-all">
                      <input
                        type={showMdp[f.key] ? 'text' : 'password'}
                        value={mdp[f.key]} placeholder={f.ph} required
                        onChange={e => setMdp({ ...mdp, [f.key]: e.target.value })}
                        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                      />
                      <EyeBtn show={showMdp[f.key]} onToggle={() => setShowMdp(s => ({ ...s, [f.key]: !s[f.key] }))} />
                    </div>
                  </div>
                ))}

                {/* Barre de force */}
                {mdp.nouveau && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= force ? FORCE_COLORS[force] : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-semibold ${FORCE_TEXT[force]}`}>{FORCE_LABELS[force]}</span>
                    </div>
                    {/* Exigences */}
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                      {[
                        { ok: mdp.nouveau.length >= 8,           txt: '8 caractères minimum'   },
                        { ok: /[A-Z]/.test(mdp.nouveau),         txt: '1 majuscule'             },
                        { ok: /[0-9]/.test(mdp.nouveau),         txt: '1 chiffre'               },
                        { ok: /[^A-Za-z0-9]/.test(mdp.nouveau), txt: '1 caractère spécial'     },
                      ].map(r => (
                        <span key={r.txt} className={`flex items-center gap-1 ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                          {r.ok
                            ? <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2}/></svg>
                          }
                          {r.txt}
                        </span>
                      ))}
                    </div>
                    {/* Match confirmer */}
                    {mdp.confirmer && (
                      <p className={`text-xs flex items-center gap-1 ${mdp.nouveau === mdp.confirmer ? 'text-green-600' : 'text-red-500'}`}>
                        {mdp.nouveau === mdp.confirmer
                          ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Les mots de passe correspondent</>
                          : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Les mots de passe ne correspondent pas</>
                        }
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-5">
                  <BtnPrimary type="submit" loading={savingMdp}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Changer le mot de passe
                  </BtnPrimary>
                </div>
              </form>
            )}
          </Card>

          {/* ════════════════════════════════
              3. NOTIFICATIONS
          ════════════════════════════════ */}
          <Card id="notifs" titre="Notifications" description="Choisissez comment et quand être alerté">
            {/* Canaux de notification */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-4">
              <span className="text-xs font-semibold text-gray-500 w-36 shrink-0">Canaux actifs</span>
              {[
                { key: 'email',     label: 'Email'    },
                { key: 'whatsapp',  label: 'WhatsApp' },
                { key: 'sms',       label: 'SMS'      },
              ].map(ch => {
                const allOn = NOTIF_TYPES.every(t => notifs[t.key]?.[ch.key]);
                return (
                  <button key={ch.key} type="button"
                    onClick={() => {
                      const val = !allOn;
                      setNotifs(n => Object.fromEntries(NOTIF_TYPES.map(t => [t.key, { ...n[t.key], [ch.key]: val }])));
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      allOn ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={toutActiver}    className="text-xs text-[#1a3a6b] hover:underline font-medium">Tout activer</button>
                <span className="text-gray-200">|</span>
                <button type="button" onClick={toutDesactiver} className="text-xs text-gray-400 hover:underline font-medium">Tout désactiver</button>
              </div>
            </div>

            {/* Types de notifications */}
            {NOTIF_TYPES.map(t => (
              <div key={t.key} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-semibold text-gray-700">{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {['email', 'whatsapp', 'sms'].map(ch => (
                    <button key={ch} type="button"
                      onClick={() => setNotifs(n => ({ ...n, [t.key]: { ...n[t.key], [ch]: !n[t.key][ch] } }))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${notifs[t.key][ch] ? 'bg-[#1a3a6b]' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[t.key][ch] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  ))}
                  <span className="text-xs text-gray-300 w-20 hidden sm:flex gap-2 justify-end">
                    {['E','W','S'].map((l, i) => <span key={l} className={['text-gray-400','text-green-600','text-blue-600'][i] + ' w-4 text-center'}>{l}</span>)}
                  </span>
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-5">
              <BtnPrimary loading={savingNotifs} onClick={handleSaveNotifs}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Enregistrer les préférences
              </BtnPrimary>
            </div>
          </Card>

          {/* ════════════════════════════════
              4. SÉCURITÉ DU COMPTE
          ════════════════════════════════ */}
          <Card id="securite" titre="Sécurité du compte" description="Double authentification et historique des connexions">

            {/* ── 2FA ── */}
            <div className="mb-6 pb-6 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-700 mb-1">Double authentification (2FA)</h3>
              <p className="text-xs text-gray-400 mb-4">Un code par email sera exigé à chaque connexion pour protéger votre compte.</p>

              {twoFaEnabled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-green-100 bg-green-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-700">2FA activée</p>
                        <p className="text-xs text-green-500">Votre compte est protégé par une vérification supplémentaire</p>
                      </div>
                    </div>
                    {!disabling2FA && (
                      <button onClick={() => { setDisabling2FA(true); setDisableError(''); }}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all shrink-0 ml-4">
                        Désactiver
                      </button>
                    )}
                  </div>

                  {disabling2FA && (
                    <form onSubmit={handleDisable2FA} className="border border-red-100 rounded-xl p-4 bg-red-50 space-y-3">
                      <p className="text-xs text-red-600 font-semibold">Confirmez la désactivation de la 2FA</p>
                      {user?.auth_method === 'email' && (
                        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 gap-2 bg-white">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          <input type="password" value={disablePwd} onChange={e => setDisablePwd(e.target.value)}
                            placeholder="Votre mot de passe actuel" className="flex-1 outline-none text-sm bg-transparent" />
                        </div>
                      )}
                      {disableError && <p className="text-xs text-red-600">{disableError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setDisabling2FA(false); setDisablePwd(''); setDisableError(''); }}
                          className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700">
                          Annuler
                        </button>
                        <button type="submit" disabled={disableLoading}
                          className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                          {disableLoading && <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                          Désactiver la 2FA
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 bg-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-orange-700">2FA non activée</p>
                        <p className="text-xs text-orange-500">Renforcez la sécurité de votre compte</p>
                      </div>
                    </div>
                    {!enabling2FA && (
                      <button onClick={() => { setEnabling2FA('pending'); setSetupError(''); }}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-[#1a3a6b] text-[#1a3a6b] hover:bg-[#1a3a6b]/5 transition-all shrink-0 ml-4">
                        Activer
                      </button>
                    )}
                  </div>

                  {enabling2FA === 'pending' && (
                    <form onSubmit={handleEnable2FA} className="border border-blue-100 rounded-xl p-4 bg-blue-50 space-y-3">
                      <p className="text-xs text-blue-700 font-semibold">Activation de la double authentification</p>
                      {user?.auth_method === 'email' && (
                        <>
                          <p className="text-xs text-blue-600">Entrez votre mot de passe actuel pour confirmer.</p>
                          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 gap-2 bg-white">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <input type="password" value={setupPwd} onChange={e => setSetupPwd(e.target.value)}
                              placeholder="Votre mot de passe actuel" className="flex-1 outline-none text-sm bg-transparent" />
                          </div>
                        </>
                      )}
                      {setupError && <p className="text-xs text-red-600">{setupError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setEnabling2FA(false); setSetupPwd(''); setSetupError(''); }}
                          className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700">
                          Annuler
                        </button>
                        <BtnPrimary type="submit" loading={setupLoading}>
                          Envoyer le code →
                        </BtnPrimary>
                      </div>
                    </form>
                  )}

                  {enabling2FA === 'confirming' && (
                    <form onSubmit={handleConfirm2FA} className="border border-blue-100 rounded-xl p-4 bg-blue-50 space-y-3">
                      <p className="text-xs text-blue-700 font-semibold">Un code a été envoyé à {user?.email}</p>
                      <input
                        type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                        value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Code à 6 chiffres" autoFocus
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-center text-lg font-bold tracking-widest outline-none focus:border-[#1a3a6b] bg-white"
                      />
                      {setupError && <p className="text-xs text-red-600">{setupError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setEnabling2FA(false); setSetupCode(''); setSetupError(''); }}
                          className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700">
                          Annuler
                        </button>
                        <BtnPrimary type="submit" loading={setupLoading} disabled={setupCode.length !== 6}>
                          Confirmer
                        </BtnPrimary>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ── Historique des connexions ── */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">Connexions récentes</h3>
              <p className="text-xs text-gray-400 mb-4">Les 10 dernières connexions à votre compte. Si vous repérez une activité suspecte, changez votre mot de passe immédiatement.</p>

              {loadingSessions ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Chargement…
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Aucune session enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <div key={i} className="flex items-start justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{fmtDate(s.created_at)}</p>
                          <p className="text-xs text-gray-400">{fmtUA(s.user_agent)} · {s.ip || 'IP inconnue'}</p>
                        </div>
                      </div>
                      {i === 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          Actuelle
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* ════════════════════════════════
              5. CONFIDENTIALITÉ & DONNÉES
          ════════════════════════════════ */}
          <Card id="rgpd" titre="Confidentialité & Données" description="Vos droits sur vos données personnelles">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Télécharger mes données</p>
                  <p className="text-xs text-gray-400 mt-0.5">Recevez une copie de votre profil, documents et analyses</p>
                </div>
                <button onClick={() => showToast('success', 'Export de données — fonctionnalité bientôt disponible.')}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all shrink-0 ml-4 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Télécharger
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Politique de confidentialité</p>
                  <p className="text-xs text-gray-400 mt-0.5">Comment nous utilisons et protégeons vos données</p>
                </div>
                <a href="/privacy" className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all shrink-0 ml-4">
                  Consulter
                </a>
              </div>
            </div>
          </Card>

          {/* ════════════════════════════════
              5. GESTION DU COMPTE
          ════════════════════════════════ */}
          <Card id="compte" titre="Gestion du compte">
            <div className="space-y-3">

              {/* Guide utilisateur */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Guide d'utilisation</p>
                    <p className="text-xs text-gray-400">Comment utiliser Wekili — PDF</p>
                  </div>
                </div>
                <a
                  href="/guide-utilisateur.pdf"
                  download="Wekili-Guide-Utilisateur.pdf"
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#1a3a6b] text-[#1a3a6b] hover:bg-[#1a3a6b] hover:text-white transition-all"
                >
                  Télécharger
                </a>
              </div>

              {/* Déconnexion */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Se déconnecter</p>
                  <p className="text-xs text-gray-400">Fermez votre session actuelle</p>
                </div>
                <button onClick={handleLogout}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                  Déconnexion
                </button>
              </div>

              {/* Suppression — étape 0 : bouton */}
              {deleteStep === 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Supprimer mon compte</p>
                    <p className="text-xs text-red-400">Action irréversible — toutes vos données seront perdues</p>
                  </div>
                  <button onClick={() => setDeleteStep(1)}
                    className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shrink-0 ml-4">
                    Supprimer
                  </button>
                </div>
              )}

              {/* Étape 1 : conséquences */}
              {deleteStep === 1 && (
                <div className="border border-red-200 rounded-xl p-5 bg-red-50 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-700 mb-2">Avant de continuer, sachez que :</p>
                      <ul className="text-xs text-red-600 space-y-1.5">
                        {[
                          'Votre profil complet et toutes vos données personnelles seront supprimés',
                          'Vos analyses IA, lettres de motivation et CV seront effacés définitivement',
                          'Vos candidatures et favoris ne seront plus accessibles',
                          'Cette action est irréversible — impossible de récupérer votre compte',
                        ].map(c => (
                          <li key={c} className="flex items-start gap-1.5">
                            <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setDeleteStep(0)} className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all">
                      Annuler
                    </button>
                    <button onClick={() => setDeleteStep(2)} className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all">
                      Je comprends, continuer →
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 2 : confirmation mot de passe */}
              {deleteStep === 2 && (
                <div className="border border-red-200 rounded-xl p-5 bg-red-50 space-y-4">
                  <p className="text-sm font-bold text-red-700">Confirmez votre identité</p>
                  {user.auth_method === 'email' ? (
                    <>
                      <p className="text-xs text-red-500">Entrez votre mot de passe actuel pour confirmer la suppression.</p>
                      <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 gap-2 bg-white focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <input
                          type={showDeleteMdp ? 'text' : 'password'}
                          value={deleteMdp} onChange={e => setDeleteMdp(e.target.value)}
                          placeholder="Votre mot de passe actuel"
                          className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                        />
                        <EyeBtn show={showDeleteMdp} onToggle={() => setShowDeleteMdp(v => !v)} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-red-500">Votre compte sera supprimé définitivement.</p>
                  )}
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => { setDeleteStep(0); setDeleteMdp(''); }}
                      className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all">
                      Annuler
                    </button>
                    <button onClick={handleDeleteAccount} disabled={deletingAccount}
                      className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2">
                      {deletingAccount && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

        </div>
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40">
        <div className="flex justify-around max-w-lg mx-auto">
          {[
            { path: '/dashboard', label: 'Accueil',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { path: '/bourses',   label: 'Bourses',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
            { path: '/logement',  label: 'Logement', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { path: '/analysis',  label: 'Analyse',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
            { path: '/profile',   label: 'Profil',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path, { replace: window.location.pathname === item.path })}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${window.location.pathname === item.path ? 'text-[#1a3a6b]' : 'text-gray-400'}`}>
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
