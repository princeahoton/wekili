import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { launchAnalysis, getAnalysis, getBourses } from '../services/api';
import 'flag-icons/css/flag-icons.min.css';

function toArr(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('[')) { try { return JSON.parse(s); } catch { /* */ } }
    if (s.startsWith('{')) return s.slice(1, -1).split(',').map(x => x.replace(/^"|"$/g, '').trim()).filter(Boolean);
    return s ? [s] : [];
  }
  return [];
}

function toStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/* ─── Score gauge SVG ─── */
function Gauge({ score }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const dash = circ * pct;
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#F5A623' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={r} fill="none"
          stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold text-gray-800">{score}</span>
        <span className="text-xs text-gray-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

const PRIORITE_CONFIG = {
  haute:   { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Haute',   dot: 'bg-red-400'    },
  moyenne: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Moyenne', dot: 'bg-orange-400' },
  basse:   { bg: 'bg-gray-100',  text: 'text-gray-500',   label: 'Basse',   dot: 'bg-gray-400'   },
};

const CHANCE_CONFIG = {
  'Très bon':  { color: 'text-green-600',  bg: 'bg-green-50',  bar: 'bg-green-400',  val: 85 },
  'Bon':       { color: 'text-blue-600',   bg: 'bg-blue-50',   bar: 'bg-blue-400',   val: 65 },
  'Moyen':     { color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400', val: 45 },
  'Faible':    { color: 'text-red-600',    bg: 'bg-red-50',    bar: 'bg-red-400',    val: 20 },
};

const ETAPES_ANALYSE = [
  'Lecture des documents...',
  'Extraction du texte (OCR)...',
  'Analyse académique...',
  'Identification des forces et faiblesses...',
  'Calcul du score...',
  'Matching des bourses...',
  'Génération du rapport...',
];

/* ─── Écran de chargement pendant l'analyse ─── */
function LoadingAnalysis({ etapeIndex }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-4 border-gray-100 rounded-full" />
        <div className="w-24 h-24 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">Analyse en cours...</h2>
      <p className="text-gray-400 text-sm mb-8">L'IA analyse votre dossier. Cela prend moins de 3 minutes.</p>

      <div className="w-full max-w-sm space-y-2.5">
        {ETAPES_ANALYSE.map((etape, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${i === etapeIndex ? 'bg-blue-50' : i < etapeIndex ? 'opacity-50' : 'opacity-20'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              i < etapeIndex ? 'bg-green-100 text-green-600' : i === etapeIndex ? 'bg-[#1a3a6b]' : 'bg-gray-100'
            }`}>
              {i < etapeIndex
                ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : i === etapeIndex
                ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                : null}
            </div>
            <span className={`text-sm ${i === etapeIndex ? 'font-semibold text-[#1a3a6b]' : 'text-gray-500'}`}>{etape}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Rapport complet ─── */
function Rapport({ analyse, onRegenerate, regenerating, onProgrammeClick }) {
  const score = analyse.score_global || 0;
  const scoreLabel = score >= 75 ? 'Excellent' : score >= 60 ? 'Bon' : score >= 45 ? 'Moyen' : 'Faible';

  // Les champs JSONB peuvent arriver comme string ou comme objet selon le contexte
  const parseField = (val) => {
    if (!val) return [];
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
    return Array.isArray(val) ? val : [];
  };
  const parseObj = (val) => {
    if (!val) return {};
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return {}; } }
    return val;
  };

  const forces   = parseField(analyse.forces);
  const faiblesses = parseField(analyse.faiblesses);
  const recommandations = parseField(analyse.recommandations);
  const programmes = parseField(analyse.programmes_recommandes);
  const chances = parseObj(analyse.estimation_chances);

  const FLAG_CODES = { France: 'fr', Canada: 'ca', Belgique: 'be', Allemagne: 'de', 'Royaume-Uni': 'gb' };

  return (
    <div className="space-y-6">

      {/* ── Score + synthèse ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Score global du dossier</h2>
          <div className="flex gap-2">
            <button onClick={onRegenerate} disabled={regenerating}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
              <svg className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {regenerating ? 'Régénération...' : 'Régénérer'}
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#1a3a6b] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#0f2550] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter PDF
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Gauge score={score} />
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full mb-3 ${
              score >= 75 ? 'bg-green-50 text-green-700' : score >= 60 ? 'bg-blue-50 text-blue-700' :
              score >= 45 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              Dossier {scoreLabel}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{analyse.synthese}</p>
            <p className="text-xs text-gray-400 mt-3">
              Analysé le {new Date(analyse.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Forces & Faiblesses ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </span>
            Points forts ({forces.length})
          </h3>
          <div className="space-y-2.5">
            {forces.map((f, i) => (
              <div key={i} className="p-3 bg-green-50 rounded-xl">
                <p className="text-sm font-semibold text-green-800">{f.titre}</p>
                {f.description && <p className="text-xs text-green-700 mt-0.5">{f.description}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            Points à améliorer ({faiblesses.length})
          </h3>
          <div className="space-y-2.5">
            {faiblesses.map((f, i) => {
              const cfg = PRIORITE_CONFIG[f.priorite] || PRIORITE_CONFIG.basse;
              return (
                <div key={i} className="p-3 bg-orange-50 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-orange-800">{f.titre}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  {f.description && <p className="text-xs text-orange-700">{f.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recommandations ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Actions à entreprendre
        </h3>
        <div className="space-y-3">
          {recommandations.map((r, i) => {
            const cfg = PRIORITE_CONFIG[r.priorite] || PRIORITE_CONFIG.basse;
            return (
              <div key={i} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{r.action}</p>
                  {r.impact && <p className="text-xs text-gray-400 mt-0.5">{r.impact}</p>}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Programmes recommandés ── */}
      {programmes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            Programmes recommandés
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programmes.map((p, i) => (
              <div
                key={i}
                onClick={() => onProgrammeClick(p)}
                className="border border-gray-100 rounded-xl p-4 hover:border-[#1a3a6b] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  {FLAG_CODES[p.pays] && (
                    <span className={`fi fi-${FLAG_CODES[p.pays]} rounded-sm shrink-0`} style={{ display: 'inline-block', width: 20, height: 14 }} />
                  )}
                  <span className="text-xs text-gray-400 truncate">{p.organisme}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1a3a6b] leading-snug transition-colors">{p.nom}</p>
                <p className="text-xs text-[#1a3a6b] mt-1">{p.pays}</p>
                <p className="text-xs text-gray-300 mt-2 group-hover:text-[#1a3a6b] transition-colors">Voir les détails →</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Estimation des chances par pays ── */}
      {Object.keys(chances).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Estimation des chances par pays
          </h3>
          <div className="space-y-4">
            {Object.entries(chances).map(([pays, val]) => {
              const pct = typeof val === 'number' ? val : 0;
              const barColor = pct >= 70 ? 'bg-green-400' : pct >= 50 ? 'bg-blue-400' : pct >= 30 ? 'bg-orange-400' : 'bg-red-400';
              const textColor = pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-blue-600' : pct >= 30 ? 'text-orange-600' : 'text-red-600';
              const code = FLAG_CODES[pays];
              return (
                <div key={pays}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {code && <span className={`fi fi-${code} rounded-sm`} style={{ display: 'inline-block', width: 20, height: 14 }} />}
                      <span className="text-sm font-semibold text-gray-700">{pays}</span>
                    </div>
                    <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Page principale ─── */
export default function Analysis() {
  const navigate = useNavigate();
  const [etat, setEtat] = useState('idle'); // idle | loading | done | error
  const [analyse, setAnalyse] = useState(null);
  const [etapeIndex, setEtapeIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const intervalRef = useRef(null);

  const [selectedBourse, setSelectedBourse] = useState(null);
  const [loadingBourse, setLoadingBourse] = useState(false);

  const handleProgrammeClick = async (p) => {
    setLoadingBourse(true);
    try {
      const res = await getBourses({ search: p.nom, limit: 1 });
      const found = res?.bourses?.[0];
      setSelectedBourse(found || { ...p, _fromAI: true });
    } catch {
      setSelectedBourse({ ...p, _fromAI: true });
    } finally {
      setLoadingBourse(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    // Charger une analyse existante
    getAnalysis().then((res) => {
      if (res?.analyse) { setAnalyse(res.analyse); setEtat('done'); }
    }).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (etat === 'loading') {
      setEtapeIndex(0);
      intervalRef.current = setInterval(() => {
        setEtapeIndex((prev) => {
          if (prev >= ETAPES_ANALYSE.length - 1) { clearInterval(intervalRef.current); return prev; }
          return prev + 1;
        });
      }, 18000 / ETAPES_ANALYSE.length);
    }
    return () => clearInterval(intervalRef.current);
  }, [etat]);

  const lancerAnalyse = async (isRegen = false) => {
    if (isRegen) setRegenerating(true);
    else setEtat('loading');
    setErrMsg('');
    try {
      const res = await launchAnalysis();
      if (res?.analyse) { setAnalyse(res.analyse); setEtat('done'); }
      else setErrMsg(res?.message || "Erreur lors de l'analyse.");
    } catch {
      setErrMsg('Impossible de contacter le serveur. Vérifiez que le backend tourne.');
      if (!isRegen) setEtat('error');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <a href="/dashboard">
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          {[
            { label: 'Score global',         done: !!analyse },
            { label: 'Forces & faiblesses',  done: !!analyse },
            { label: 'Recommandations',      done: !!analyse },
            { label: 'Programmes',           done: !!analyse },
            { label: 'Chances admission',    done: !!analyse },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                {item.done
                  ? <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  : <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>
              <span className={`text-xs font-medium ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour au dashboard
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className="md:ml-56 flex-1">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Analyse IA du dossier</h1>
            <p className="text-xs text-gray-400">Rapport personnalisé généré par l'intelligence artificielle</p>
          </div>
          {etat === 'idle' && !analyse && (
            <button
              onClick={() => lancerAnalyse(false)}
              className="bg-[#1a3a6b] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#0f2550] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Lancer l'analyse
            </button>
          )}
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8">

          {/* État : idle (pas d'analyse) */}
          {etat === 'idle' && !analyse && (
            <div className="max-w-lg mx-auto text-center py-20">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Prêt à analyser votre dossier ?</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                L'IA va analyser votre profil et vos documents pour vous donner un score, identifier vos points forts et vous recommander les meilleures bourses.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8 text-left">
                {[
                  { icon: '⏱', label: 'Moins de 3 min', sub: "Durée de l'analyse" },
                  { icon: '🎯', label: 'Score 0–100',    sub: 'Avec interprétation' },
                  { icon: '📋', label: 'Rapport PDF',    sub: 'Exportable' },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                    <p className="text-xl mb-1">{item.icon}</p>
                    <p className="text-xs font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => lancerAnalyse(false)}
                className="bg-[#1a3a6b] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#0f2550] transition-colors"
              >
                Lancer l'analyse maintenant →
              </button>
              <p className="text-xs text-gray-400 mt-3">Vous pouvez régénérer l'analyse à tout moment après mise à jour de votre dossier.</p>
            </div>
          )}

          {/* État : loading */}
          {etat === 'loading' && <LoadingAnalysis etapeIndex={etapeIndex} />}

          {/* État : erreur */}
          {etat === 'error' && (
            <div className="max-w-lg mx-auto text-center py-20">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Analyse échouée</h2>
              <p className="text-gray-500 text-sm mb-6">{errMsg}</p>
              <button onClick={() => lancerAnalyse(false)} className="bg-[#1a3a6b] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2550] transition-colors">
                Réessayer
              </button>
            </div>
          )}

          {/* État : rapport affiché */}
          {etat === 'done' && analyse && (
            <Rapport
              analyse={analyse}
              onRegenerate={() => lancerAnalyse(true)}
              regenerating={regenerating}
              onProgrammeClick={handleProgrammeClick}
            />
          )}

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
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${window.location.pathname === item.path ? 'text-[#1a3a6b]' : 'text-gray-400 hover:text-gray-600'}`}>
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Spinner overlay pendant le chargement du détail ── */}
      {loadingBourse && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
            <div className="w-6 h-6 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Chargement du détail…</span>
          </div>
        </div>
      )}

      {/* ── Modal détail bourse ── */}
      {selectedBourse && !loadingBourse && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBourse(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1a3a6b] rounded-t-2xl p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {selectedBourse.code_pays && (
                      <span className={`fi fi-${selectedBourse.code_pays} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 24, height: 17 }} />
                    )}
                    <span className="text-blue-200 text-sm">{selectedBourse.pays}</span>
                    {selectedBourse.niveau && (
                      <span className="bg-[#F5A623] text-white text-xs px-2 py-0.5 rounded-full font-semibold">{selectedBourse.niveau}</span>
                    )}
                    {selectedBourse.type_financement && (
                      <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{selectedBourse.type_financement}</span>
                    )}
                    {selectedBourse.score_eligibilite > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        selectedBourse.score_eligibilite >= 75 ? 'bg-green-400' : selectedBourse.score_eligibilite >= 60 ? 'bg-blue-300' : 'bg-orange-400'
                      } text-white`}>{selectedBourse.score_eligibilite}% match</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold leading-tight">{selectedBourse.nom}</h2>
                  <p className="text-blue-200 text-sm mt-1">{selectedBourse.organisme}</p>
                </div>
                <button
                  onClick={() => setSelectedBourse(null)}
                  className="text-white/60 hover:text-white shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Infos rapides */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Montant',   val: selectedBourse.montant || '--' },
                  { label: 'Durée',     val: selectedBourse.duree   || '--' },
                  { label: 'Ouverture', val: selectedBourse.date_debut ? new Date(selectedBourse.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' },
                  { label: 'Clôture',   val: selectedBourse.deadline ? new Date(selectedBourse.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-blue-200 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-semibold text-xs">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corps */}
            <div className="p-5 space-y-5">

              {selectedBourse.description && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedBourse.description}</p>
                </div>
              )}

              {toArr(selectedBourse.avantages).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Ce que couvre la bourse</h3>
                  <div className="flex flex-wrap gap-2">
                    {toArr(selectedBourse.avantages).map((a, i) => (
                      <span key={i} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {toStr(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Domaine',       val: selectedBourse.domaine || '--' },
                  { label: 'Langue',        val: selectedBourse.langue_requise ? `${selectedBourse.langue_requise} — ${selectedBourse.niveau_langue_requis || 'B2'} min.` : '--' },
                  { label: 'Âge max',       val: selectedBourse.age_max ? `${selectedBourse.age_max} ans` : 'Pas de limite' },
                  { label: 'Places',        val: selectedBourse.nb_places ? `${selectedBourse.nb_places} places` : 'Non précisé' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                    <p className="text-gray-700 font-semibold text-sm">{item.val}</p>
                  </div>
                ))}
              </div>

              {toArr(selectedBourse.nationalites_eligibles).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Nationalités éligibles</h3>
                  <p className="text-gray-600 text-sm">{toArr(selectedBourse.nationalites_eligibles).map(toStr).join(', ')}</p>
                </div>
              )}

              {toArr(selectedBourse.documents_requis).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Documents requis</h3>
                  <ul className="space-y-1.5">
                    {toArr(selectedBourse.documents_requis).map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {toStr(doc)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {toArr(selectedBourse.criteres).length > 0 && (
                <div>
                  <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Critères de sélection</h3>
                  <div className="space-y-2">
                    {toArr(selectedBourse.criteres).map((c, i) => {
                      const isObj = typeof c === 'object' && c !== null;
                      return (
                        <div key={i} className={isObj ? 'bg-blue-50 rounded-xl p-3 border border-blue-100' : 'flex items-start gap-2 text-xs text-gray-600'}>
                          {isObj ? (
                            <>
                              <p className="text-[#1a3a6b] font-semibold text-xs mb-0.5">{toStr(c.titre)}</p>
                              <p className="text-gray-600 text-xs">{toStr(c.desc)}</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-[#1a3a6b] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              {toStr(c)}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {selectedBourse.lien && selectedBourse.lien !== '#' ? (
                  <a
                    href={selectedBourse.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    Candidater sur le site officiel
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400 font-bold py-3 rounded-xl text-sm">
                    Lien non disponible
                  </div>
                )}
                <button
                  onClick={() => setSelectedBourse(null)}
                  className="flex-1 border border-[#1a3a6b] text-[#1a3a6b] font-bold py-3 rounded-xl text-sm hover:bg-[#1a3a6b] hover:text-white transition-colors"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
