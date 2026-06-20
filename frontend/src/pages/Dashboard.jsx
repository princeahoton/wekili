import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfile, getDocuments, getAnalysis, getAllAnalyses, getBourses } from '../services/api';
import { getUser, clearAuth } from '../utils/auth';
import Toast from '../components/Toast';
import 'flag-icons/css/flag-icons.min.css';

const DOC_TYPES = ['cv', 'releves', 'diplome', 'langue', 'motivation', 'recommandation'];

const PAYS_INFO = {
  France:        { code: 'fr' },
  Canada:        { code: 'ca' },
  Belgique:      { code: 'be' },
  Allemagne:     { code: 'de' },
  'Royaume-Uni': { code: 'gb' },
};

const menuItems = [
  {
    categorie: 'PRINCIPAL',
    items: [
      { label: 'Tableau de bord', path: '/dashboard',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
      { label: 'Mon profil', path: '/profile',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    ]
  },
  {
    categorie: 'DOSSIER',
    items: [
      { label: 'Documents', path: '/documents',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      { label: 'Analyse IA', path: '/analysis',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
      { label: 'Bourses', path: '/bourses',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
      { label: 'Universités', path: '/universities',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
      { label: 'Logement', path: '/logement',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    ]
  },
  {
    categorie: 'COMPTE',
    items: [
      { label: 'Paramètres', path: '/settings',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ]
  },
];

// Bottom nav items for mobile
const bottomNavItems = [
  { label: 'Accueil',   path: '/dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: 'Bourses',   path: '/bourses',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
  { label: 'Universités', path: '/universities',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { label: 'Logement',  path: '/logement',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: 'Analyse',   path: '/analysis',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
  { label: 'Profil',    path: '/profile',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

// Convertit n'importe quelle valeur en tableau sûr
function toArr(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('[')) { try { return JSON.parse(s); } catch { /* ignore */ } }
    // Format PostgreSQL brut : {elem1,elem2}
    if (s.startsWith('{')) return s.slice(1, -1).split(',').map(x => x.replace(/^"|"$/g, '').trim()).filter(Boolean);
    return s ? [s] : [];
  }
  return [];
}

// Convertit n'importe quelle valeur en chaîne sûre
function toStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function calcProfileCompletion(profile) {
  if (!profile) return 0;
  const fields = ['nationalite','pays_residence','telephone','date_naissance','niveau_etudes','domaine','etablissement','moyenne','langue_principale','niveau_langue','pays_cibles','niveau_vise'];
  const filled = fields.filter(f => { const v = profile[f]; return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ''; }).length;
  return Math.round((filled / fields.length) * 100);
}

function Gauge({ score, size = 130 }) {
  const r = size === 130 ? 52 : 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(score || 0, 0), 100) / 100;
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#F5A623' : score > 0 ? '#ef4444' : '#e5e7eb';
  const cx = size / 2;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        {score > 0
          ? <><span className="text-2xl font-extrabold text-gray-800">{score}</span><span className="text-xs text-gray-400">/100</span></>
          : <span className="text-xl font-bold text-gray-300">--</span>}
      </div>
    </div>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

// ── Sidebar desktop ──────────────────────────────────────────────────────────
function Sidebar({ user, onLogout, open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => { navigate(path, { replace: true }); onClose(); };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-64 lg:w-56 bg-white border-r border-gray-100 flex flex-col z-40
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/', { replace: true }); }} className="flex items-center gap-2">
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {menuItems.map((groupe) => (
            <div key={groupe.categorie}>
              <p className="text-xs text-gray-400 font-semibold px-3 mb-2 tracking-wider">{groupe.categorie}</p>
              <div className="space-y-0.5">
                {groupe.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button key={item.path} onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive ? 'bg-[#1a3a6b] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a3a6b]'
                      }`}>
                      <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-[#1a3a6b] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-gray-400">Candidat</p>
            </div>
            <button onClick={onLogout} title="Déconnexion" className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Bottom nav mobile ────────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 lg:hidden">
      <div className="flex">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path, { replace: true })}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-[#1a3a6b]' : 'text-gray-400'
              }`}>
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <span className="absolute bottom-0 w-8 h-0.5 bg-[#1a3a6b] rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.toast || null);

  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [analyse, setAnalyse] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [topBourses, setTopBourses] = useState([]);
  const [totalBourses, setTotalBourses] = useState(0);
  const [totalBoursesDB, setTotalBoursesDB] = useState(0);
  const [selectedBourse, setSelectedBourse] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { navigate('/login', { replace: true }); return; }
    setUser(u);
  }, [navigate]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, docsRes, analyseRes, historiquesRes, boursesRes] = await Promise.all([
        getProfile(), getDocuments(), getAnalysis(), getAllAnalyses(), getBourses({ sort: 'score', limit: 20 }),
      ]);
      setProfile(profileRes.profile || null);
      setDocs(docsRes.documents || []);
      setAnalyse(analyseRes.analyse || null);
      setHistorique(historiquesRes.analyses || []);
      const all = boursesRes.bourses || [];
      setTotalBoursesDB(boursesRes.total || all.length);
      const scored = all.filter(b => b.score_eligibilite > 0);
      setTotalBourses(scored.length);
      // Si analyse faite → top matchées par score, sinon → 5 prochaines deadlines
      setTopBourses((analyseRes.analyse ? scored : all).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const profilePct = calcProfileCompletion(profile);
  const docCount   = docs.length;
  const docPct     = Math.round((docCount / DOC_TYPES.length) * 100);
  const analysePct = analyse ? 100 : 0;
  const score      = analyse?.score_global || 0;
  const scoreLabel = score >= 70 ? 'Bon dossier' : score >= 50 ? 'Dossier moyen' : score > 0 ? 'Dossier faible' : 'Non analysé';
  const scoreColor = score >= 70 ? 'text-green-600 bg-green-50' : score >= 50 ? 'text-orange-600 bg-orange-50' : score > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50';

  const paysCibles = profile?.pays_cibles || [];
  const paysAvecBourses = paysCibles.map(pays => ({
    pays, code: (PAYS_INFO[pays] || { code: 'fr' }).code,
    nb: topBourses.filter(b => b.pays === pays).length,
  }));

  const rawAction = analyse?.recommandations?.[0]?.action;
  const conseilTexte = (typeof rawAction === 'string' ? rawAction : null) ||
    'Complétez votre profil et uploadez vos documents pour obtenir votre analyse IA personnalisée.';

  const etapesParcours = [
    { num: '1', titre: 'Créer ton compte',       fait: true },
    { num: '2', titre: 'Compléter ton profil',   fait: profilePct >= 50, action: () => navigate('/profile') },
    { num: '3', titre: 'Uploader tes documents', fait: docCount >= 1,    action: () => navigate('/documents') },
    { num: '4', titre: 'Obtenir ton analyse IA', fait: !!analyse,        action: () => navigate('/analysis') },
  ];

  const derniereAnalyse = analyse
    ? new Date(analyse.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type || 'success'}
          onDismiss={() => setToast(null)}
        />
      )}
      <Sidebar user={user} onLogout={handleLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main — pousse à droite sur lg, plein écran sur mobile */}
      <main className="flex-1 lg:ml-56 pb-20 lg:pb-0">

        {/* ── Topbar ── */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger mobile */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-[#1a3a6b] rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-800">Tableau de bord</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Statistiques et état de ton dossier</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <p className="text-xs text-gray-400 hidden md:block">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a3a6b] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-700">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-gray-400">Candidat</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">

          {/* ── Cards stats (2 cols mobile → 4 cols desktop) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <Skeleton className="h-8 w-8 mb-3" />
                  <Skeleton className="h-7 w-16 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                </div>
              ))
            ) : ([
              { label: 'Score', valeur: score > 0 ? `${score}` : '--', sub: scoreLabel, color: 'text-[#1a3a6b]', bg: 'bg-blue-50',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
              { label: 'Bourses', valeur: `${totalBoursesDB}`, sub: analyse ? `${totalBourses} avec score` : 'Analysez votre dossier', color: 'text-[#F5A623]', bg: 'bg-orange-50',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
              { label: 'Documents', valeur: `${docCount}/6`, sub: docCount === 6 ? 'Complet ✓' : `${6 - docCount} manquant(s)`, color: 'text-[#1a3a6b]', bg: 'bg-blue-50',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
              { label: 'Profil', valeur: `${profilePct}%`, sub: profilePct === 100 ? 'Complet' : profilePct >= 50 ? 'Presque complet' : 'À compléter', color: 'text-green-600', bg: 'bg-green-50',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</span>
                </div>
                <p className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.valeur}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
            )))}
          </div>

          {/* ── Layout principal ── */}
          {/* Sur mobile : 1 colonne. Sur desktop : 2/3 + 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">

              {/* Score + Parcours : côte à côte sur md, empilés sur mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">

                {/* Jauge */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col items-center justify-center">
                  <p className="text-sm font-bold text-gray-700 mb-4">Score global du dossier</p>
                  {loading
                    ? <Skeleton className="w-32 h-32 rounded-full" />
                    : <Gauge score={score} size={120} />
                  }
                  <div className="mt-4 text-center">
                    {loading ? <Skeleton className="h-6 w-28 mx-auto" /> : (
                      <>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${scoreColor}`}>
                          <span className="w-2 h-2 rounded-full bg-current opacity-60" />{scoreLabel}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">
                          {derniereAnalyse ? `Analysé le ${derniereAnalyse}` : 'Aucune analyse'}
                        </p>
                      </>
                    )}
                  </div>
                  <button onClick={() => navigate(analyse ? '/analysis' : '/analysis')}
                    className="mt-4 w-full text-center text-xs font-semibold text-[#1a3a6b] border border-[#1a3a6b] rounded-xl py-2 hover:bg-[#1a3a6b] hover:text-white transition-colors">
                    {analyse ? 'Voir le rapport complet' : 'Lancer mon analyse IA'}
                  </button>
                </div>

                {/* Parcours */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    Ton parcours
                  </h2>
                  <div className="space-y-2.5">
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3"><Skeleton className="w-7 h-7 rounded-full" /><Skeleton className="h-4 flex-1" /></div>
                        ))
                      : etapesParcours.map((etape) => (
                          <div key={etape.num} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${etape.fait ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-[#1a3a6b]'}`}>
                              {etape.fait
                                ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                : etape.num}
                            </div>
                            <p className={`text-xs flex-1 ${etape.fait ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>{etape.titre}</p>
                            {!etape.fait && etape.action && (
                              <button onClick={etape.action} className="text-xs text-[#1a3a6b] font-semibold hover:underline shrink-0">Faire →</button>
                            )}
                          </div>
                        ))}
                  </div>
                </div>
              </div>

              {/* Top 5 bourses */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                    <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                    {analyse ? 'Top 5 bourses matchées' : 'Prochaines bourses disponibles'}
                  </h2>
                  <button onClick={() => navigate('/bourses')} className="text-xs font-semibold text-[#1a3a6b] hover:underline whitespace-nowrap">
                    {totalBoursesDB > 0 ? `Voir les ${totalBoursesDB} →` : 'Voir toutes →'}
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-5 h-4 rounded" />
                        <Skeleton className="flex-1 h-4" />
                        <Skeleton className="w-16 h-6 rounded-lg" />
                      </div>
                    ))}
                  </div>

                ) : topBourses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">Aucune bourse trouvée</p>
                    <p className="text-xs text-gray-300">Complétez votre profil et lancez une analyse pour voir vos bourses.</p>
                  </div>

                ) : (
                  <>
                    <div className="space-y-1.5 md:space-y-2">
                      {topBourses.map((b, idx) => {
                        const deadline = b.deadline ? new Date(b.deadline) : null;
                        const jours = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
                        const urgente = jours !== null && jours > 0 && jours <= 30;
                        const s = b.score_eligibilite || 0;
                        const scoreColor = s >= 75 ? 'text-green-600 bg-green-50 border-green-100'
                          : s >= 60 ? 'text-blue-700 bg-blue-50 border-blue-100'
                          : s > 0  ? 'text-orange-700 bg-orange-50 border-orange-100'
                          : '';

                        return (
                          <div
                            key={b.id}
                            className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedBourse(b)}
                          >
                            {/* Rang */}
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
                            }`}>{idx + 1}</span>

                            {/* Drapeau */}
                            <span className={`fi fi-${b.code_pays} rounded-sm shrink-0`} style={{ display: 'inline-block', width: 20, height: 14 }} />

                            {/* Nom + organisme */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-medium text-gray-700 truncate group-hover:text-[#1a3a6b] transition-colors">{b.nom}</p>
                              <p className="text-xs text-gray-400 truncate hidden sm:block">{b.organisme}</p>
                            </div>

                            {/* Score OU montant selon si analyse faite */}
                            {s > 0 ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg border shrink-0 ${scoreColor}`}>{s}%</span>
                            ) : (
                              <span className="text-xs text-gray-500 font-medium shrink-0 hidden md:block truncate max-w-[90px]">{b.montant}</span>
                            )}

                            {/* Deadline */}
                            <span className={`text-xs shrink-0 ${urgente ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                              {urgente
                                ? `⚠ ${jours}j`
                                : deadline
                                  ? deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                                  : '--'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA analyse si pas encore fait */}
                    {!analyse && (
                      <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-orange-700">
                          <span className="font-semibold">Lancez votre analyse IA</span> pour voir votre score d'éligibilité sur chaque bourse.
                        </p>
                        <button
                          onClick={() => navigate('/analysis')}
                          className="shrink-0 bg-[#F5A623] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-orange-500 transition-colors"
                        >
                          Analyser →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Historique */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                <h2 className="font-semibold text-gray-800 mb-4 md:mb-5 flex items-center gap-2 text-sm md:text-base">
                  <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Historique des analyses
                </h2>
                {loading ? (
                  <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : historique.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">Aucune analyse pour l'instant</p>
                    <button onClick={() => navigate('/analysis')} className="mt-2 text-xs text-[#1a3a6b] font-semibold hover:underline">Lancer ma première analyse →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historique.map((h, idx) => {
                      const isLast = idx === historique.length - 1;
                      const sc = h.score_global >= 70 ? 'text-green-600' : h.score_global >= 50 ? 'text-orange-600' : 'text-red-600';
                      const bar = h.score_global >= 70 ? 'bg-green-400' : h.score_global >= 50 ? 'bg-orange-400' : 'bg-red-400';
                      return (
                        <div key={h.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 border-white ${isLast ? 'bg-[#1a3a6b] text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                            {isLast
                              ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" /></svg>}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-gray-700">Analyse #{idx + 1}</p>
                              <span className={`text-base font-extrabold ${sc}`}>{h.score_global}</span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                            <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                              <div className={`h-full rounded-full ${bar}`} style={{ width: `${h.score_global}%`, transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite — sur mobile elle s'empile sous le contenu principal */}
            <div className="space-y-4 md:space-y-6">

              {/* État du dossier */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm md:text-base">État du dossier</h3>
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Profil complété', val: profilePct, color: 'bg-[#1a3a6b]' },
                      { label: 'Documents',        val: docPct,    color: 'bg-[#F5A623]' },
                      { label: 'Analyse IA',       val: analysePct,color: 'bg-green-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-semibold text-gray-800">{item.val}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pays cibles */}
              {!loading && paysAvecBourses.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 text-sm md:text-base">Pays cibles</h3>
                  <div className="space-y-2">
                    {paysAvecBourses.map((p) => (
                      <div key={p.pays} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <span className={`fi fi-${p.code} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 22, height: 16 }} />
                          <span className="text-sm text-gray-700">{p.pays}</span>
                        </div>
                        <span className="text-xs text-[#1a3a6b] font-medium bg-blue-50 px-2 py-0.5 rounded-lg">
                          {p.nb > 0 ? `${p.nb} matchées` : 'À analyser'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conseil IA */}
              <div className="bg-[#1a3a6b] rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#F5A623] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a7 7 0 017 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 01-1 1h-5a1 1 0 01-1-1v-1.8A7 7 0 0112 2zm-2 18h4v1a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1z" />
                  </svg>
                  <p className="text-sm font-semibold">Conseil Wekili</p>
                </div>
                {loading
                  ? <div className="space-y-1"><Skeleton className="h-3 w-full bg-blue-800" /><Skeleton className="h-3 w-4/5 bg-blue-800" /></div>
                  : <p className="text-xs text-blue-200 leading-relaxed">{conseilTexte}</p>
                }
                <button onClick={() => navigate(analyse ? '/analysis' : '/documents')}
                  className="mt-3 bg-white text-[#1a3a6b] text-xs px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full">
                  {analyse ? 'Voir mon analyse' : 'Compléter mes documents'}
                </button>
              </div>

              {/* Actions rapides mobile uniquement */}
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                {[
                  { label: 'Mon profil', path: '/profile', color: 'bg-blue-50 text-[#1a3a6b]' },
                  { label: 'Documents',  path: '/documents', color: 'bg-orange-50 text-orange-600' },
                ].map(item => (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className={`${item.color} rounded-2xl p-4 text-sm font-semibold text-left`}>
                    {item.label} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav mobile */}
      <BottomNav />

      {/* ── Modal détail bourse ── */}
      {selectedBourse && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBourse(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header bleu ── */}
            <div className="bg-[#1a3a6b] rounded-t-2xl p-5 md:p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`fi fi-${selectedBourse.code_pays} rounded-sm shadow-sm shrink-0`}
                      style={{ display: 'inline-block', width: 24, height: 17 }}
                    />
                    <span className="text-blue-200 text-sm">{selectedBourse.pays}</span>
                    <span className="bg-[#F5A623] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      {selectedBourse.niveau}
                    </span>
                    {selectedBourse.type_financement && (
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                        {selectedBourse.type_financement}
                      </span>
                    )}
                    {selectedBourse.score_eligibilite > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        selectedBourse.score_eligibilite >= 75 ? 'bg-green-400 text-white'
                        : selectedBourse.score_eligibilite >= 60 ? 'bg-blue-300 text-white'
                        : 'bg-orange-400 text-white'
                      }`}>
                        {selectedBourse.score_eligibilite}% match
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold leading-tight">{selectedBourse.nom}</h2>
                  <p className="text-blue-200 text-sm mt-1">{selectedBourse.organisme}</p>
                </div>
                <button
                  onClick={() => setSelectedBourse(null)}
                  className="text-white/60 hover:text-white shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Infos rapides */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Montant',   val: selectedBourse.montant },
                  { label: 'Durée',     val: selectedBourse.duree || '--' },
                  { label: 'Ouverture', val: selectedBourse.date_debut
                      ? new Date(selectedBourse.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '--' },
                  { label: 'Clôture',   val: selectedBourse.deadline
                      ? new Date(selectedBourse.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '--' },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-blue-200 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-semibold text-xs leading-tight">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Corps ── */}
            <div className="p-5 md:p-6 space-y-5">

              {/* Description */}
              <div>
                <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedBourse.description}</p>
              </div>

              {/* Avantages */}
              {toArr(selectedBourse.avantages).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Ce que couvre la bourse</h3>
                  <div className="flex flex-wrap gap-2">
                    {toArr(selectedBourse.avantages).map((a, i) => (
                      <span key={i} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {toStr(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Éligibilité */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Domaine',           val: selectedBourse.domaine || '--' },
                  { label: 'Langue requise',     val: selectedBourse.langue_requise
                      ? `${selectedBourse.langue_requise} — ${selectedBourse.niveau_langue_requis || 'B2'} min.`
                      : '--' },
                  { label: 'Âge maximum',        val: selectedBourse.age_max ? `${selectedBourse.age_max} ans` : 'Pas de limite' },
                  { label: 'Places disponibles', val: selectedBourse.nb_places ? `${selectedBourse.nb_places} places` : 'Non précisé' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                    <p className="text-gray-700 font-semibold text-sm">{item.val}</p>
                  </div>
                ))}
              </div>

              {/* Nationalités éligibles */}
              {toArr(selectedBourse.nationalites_eligibles).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Nationalités éligibles</h3>
                  <p className="text-gray-600 text-sm">{toArr(selectedBourse.nationalites_eligibles).map(toStr).join(', ')}</p>
                </div>
              )}

              {/* Documents requis */}
              {toArr(selectedBourse.documents_requis).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Documents requis</h3>
                  <ul className="space-y-1.5">
                    {toArr(selectedBourse.documents_requis).map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {toStr(doc)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critères de sélection */}
              {toArr(selectedBourse.criteres).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Critères de sélection</h3>
                  <div className="space-y-2">
                    {toArr(selectedBourse.criteres).map((c, i) => {
                      const critere = typeof c === 'object' && c !== null ? c : {};
                      return (
                        <div key={i} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                          <p className="text-[#1a3a6b] font-semibold text-xs mb-0.5">{toStr(critere.titre)}</p>
                          <p className="text-gray-600 text-xs leading-relaxed">{toStr(critere.desc)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Boutons action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={selectedBourse.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#F5A623] hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm text-center transition-colors"
                >
                  Candidater sur le site officiel →
                </a>
                <button
                  onClick={() => { setSelectedBourse(null); navigate('/analysis'); }}
                  className="flex-1 border border-[#1a3a6b] text-[#1a3a6b] font-bold py-3 rounded-xl text-sm hover:bg-[#1a3a6b] hover:text-white transition-colors"
                >
                  {analyse ? 'Voir mon analyse complète' : 'Analyser mon éligibilité'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
