import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUniversities, upsertCandidature, deleteCandidature } from '../services/api';
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
  return String(val);
}

// ── Config statuts ────────────────────────────────────────────────────
const STATUT_CONFIG = {
  en_preparation: { label: 'En préparation', color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'   },
  soumise:        { label: 'Soumise',        color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  en_attente:     { label: 'En attente',     color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  admis:          { label: 'Admis ✓',        color: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
  refuse:         { label: 'Refusé',         color: 'bg-red-100 text-red-700',     dot: 'bg-red-500'    },
  liste_attente:  { label: 'Liste d\'attente', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
};

const TYPE_CONFIG = {
  ambitieuse: { label: 'Ambitieuse', color: 'bg-purple-100 text-purple-700' },
  realiste:   { label: 'Réaliste',   color: 'bg-blue-100 text-blue-700'   },
  sure:       { label: 'Sûre',       color: 'bg-green-100 text-green-700' },
};

const PAYS_FILTRES = ['Tous', 'France', 'Canada', 'Belgique', 'Allemagne', 'Royaume-Uni'];
const NIVEAU_FILTRES = ['Tous', 'Licence', 'Master', 'Doctorat'];
const SORT_OPTIONS = [
  { val: 'score',     label: 'Mon score' },
  { val: 'classement', label: 'Classement' },
  { val: 'taux',      label: 'Taux d\'admission' },
];

// ── Skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

// ── Badge score ───────────────────────────────────────────────────────
function ScoreBadge({ score, type }) {
  if (!score) return null;
  const colors = score >= 75 ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 60 ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-orange-100 text-orange-700 border-orange-200';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors}`}>
      {score}% match
    </span>
  );
}

// ── Carte université ──────────────────────────────────────────────────
function CarteUniversite({ u, onClick, onToggleCandidature }) {
  const score = u.score_admission || 0;
  const deadline = u.date_cloture ? new Date(u.date_cloture) : null;
  const jours = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
  const urgente = jours !== null && jours > 0 && jours <= 30;
  const enCandidature = !!u.candidature_statut;
  const statut = STATUT_CONFIG[u.candidature_statut] || null;
  const type = TYPE_CONFIG[u.type_candidature] || null;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1a3a6b]/30 transition-all cursor-pointer group flex flex-col"
      onClick={() => onClick(u)}
    >
      {/* Header */}
      <div className="p-4 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`fi fi-${u.code_pays} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 22, height: 16 }} />
            <span className="text-xs text-gray-400">{u.ville}</span>
            {u.classement_mondial && (
              <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-semibold border border-yellow-100">
                #{u.classement_mondial} mondial
              </span>
            )}
          </div>
          {score > 0 && <ScoreBadge score={score} />}
        </div>

        <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1 group-hover:text-[#1a3a6b] transition-colors line-clamp-2">
          {u.nom}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{u.pays}</p>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{u.description}</p>

        {/* Infos rapides */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-gray-400 text-xs">Admission</p>
            <p className="text-sm font-bold text-gray-700">{u.taux_admission ? `${u.taux_admission}%` : '--'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-gray-400 text-xs">Frais/an</p>
            <p className="text-xs font-bold text-gray-700 leading-tight">{u.frais_scolarite || '--'}</p>
          </div>
        </div>

        {/* Niveaux */}
        <div className="flex flex-wrap gap-1 mb-3">
          {toArr(u.niveaux).map(n => (
            <span key={n} className="text-xs bg-blue-50 text-[#1a3a6b] px-2 py-0.5 rounded-full">{n}</span>
          ))}
          <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{u.plateforme}</span>
        </div>

        {/* Deadline */}
        {deadline && (
          <div className={`text-xs flex items-center gap-1.5 ${urgente ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {urgente
              ? `⚠ Clôture dans ${jours} jour(s) !`
              : `Clôture : ${deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-0 border-t border-gray-50 mt-auto">
        {enCandidature ? (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              {statut && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${statut.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statut.dot}`} />
                  {statut.label}
                </span>
              )}
              {type && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${type.color}`}>{type.label}</span>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); onToggleCandidature(u); }}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Retirer
            </button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onToggleCandidature(u); }}
            className="mt-3 w-full text-xs font-semibold text-[#1a3a6b] border border-[#1a3a6b] rounded-xl py-2 hover:bg-[#1a3a6b] hover:text-white transition-colors"
          >
            + Ajouter à mes candidatures
          </button>
        )}
      </div>
    </div>
  );
}

// ── Modal détail ──────────────────────────────────────────────────────
function UniversityModal({ u, onClose, onToggleCandidature, saving }) {
  const [showCandidatureForm, setShowCandidatureForm] = useState(false);
  const [statut, setStatut] = useState(u.candidature_statut || 'en_preparation');
  const [voeuNumero, setVoeuNumero] = useState(u.voeu_numero || '');
  const [notes, setNotes] = useState(u.notes || '');

  if (!u) return null;

  const score = u.score_admission || 0;
  const deadline = u.date_cloture ? new Date(u.date_cloture) : null;
  const jours = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
  const enCandidature = !!u.candidature_statut;

  const handleSave = () => {
    onToggleCandidature(u, { statut, voeu_numero: voeuNumero || null, notes });
    setShowCandidatureForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bleu */}
        <div className="bg-[#1a3a6b] rounded-t-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`fi fi-${u.code_pays} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 24, height: 17 }} />
                <span className="text-blue-200 text-sm">{u.ville}, {u.pays}</span>
                {u.type && (
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full capitalize">{u.type}</span>
                )}
                {u.classement_mondial && (
                  <span className="bg-[#F5A623] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    #{u.classement_mondial} mondial
                  </span>
                )}
                {score > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${score >= 75 ? 'bg-green-400' : score >= 60 ? 'bg-blue-300' : 'bg-orange-400'} text-white`}>
                    {score}% match
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold leading-tight">{u.nom}</h2>
              <p className="text-blue-200 text-sm mt-1">{u.langue} · {toArr(u.niveaux).join(', ')}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Infos rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Taux admission', val: u.taux_admission ? `${u.taux_admission}%` : '--' },
              { label: 'Frais scolarité', val: u.frais_scolarite || '--' },
              { label: 'Frais candidature', val: u.cout_plateforme || '--' },
              { label: 'Moyenne requise', val: u.moyenne_requise ? `${u.moyenne_requise}/20` : '--' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-blue-200 text-xs mb-1">{item.label}</p>
                <p className="text-white font-semibold text-xs leading-tight">{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-5">

          {/* Urgence deadline */}
          {jours !== null && jours > 0 && jours <= 60 && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 ${jours <= 30 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {jours <= 30 ? `Urgent — clôture dans ${jours} jour(s) !` : `Clôture dans ${jours} jours`}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Présentation</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{u.description}</p>
          </div>

          {/* Points forts */}
          {toArr(u.points_forts).length > 0 && (
            <div>
              <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Points forts</h3>
              <div className="flex flex-wrap gap-2">
                {toArr(u.points_forts).map((p, i) => (
                  <span key={i} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {toStr(p)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grille éligibilité */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Langue',         val: `${u.langue} — ${u.niveau_langue} min.` },
              { label: 'Plateforme',     val: u.plateforme || '--' },
              { label: 'Ouverture',      val: u.date_ouverture ? new Date(u.date_ouverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' },
              { label: 'Clôture',        val: deadline ? deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' },
              { label: 'Domaines',       val: toArr(u.domaines).join(', ') || '--' },
              { label: 'Classement nat.', val: u.classement_national ? `#${u.classement_national} ${u.pays}` : '--' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                <p className="text-gray-700 font-semibold text-sm leading-snug">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Documents requis */}
          {toArr(u.documents_requis).length > 0 && (
            <div>
              <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Documents requis</h3>
              <ul className="space-y-1.5">
                {toArr(u.documents_requis).map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {toStr(doc)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Frais d'inscription si différent */}
          {u.frais_inscription && u.frais_inscription !== u.frais_scolarite && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
              <p className="text-yellow-800 text-xs font-semibold mb-0.5">Frais annexes</p>
              <p className="text-yellow-700 text-sm">{u.frais_inscription}</p>
            </div>
          )}

          {/* Formulaire candidature */}
          {showCandidatureForm ? (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-3">
              <h3 className="text-[#1a3a6b] font-bold text-sm">Ajouter à mes candidatures</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Statut</label>
                  <select value={statut} onChange={e => setStatut(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20">
                    {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">N° de vœu (Campus France)</label>
                  <input type="number" min="1" max="7" value={voeuNumero}
                    onChange={e => setVoeuNumero(e.target.value)}
                    placeholder="1 à 7"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Notes personnelles</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="Contacts, rappels, informations supplémentaires..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-[#1a3a6b] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#0f2550] transition-colors disabled:opacity-50">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button onClick={() => setShowCandidatureForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={u.lien_candidature}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                onClick={e => e.stopPropagation()}
              >
                Candidater sur {u.plateforme}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
              {enCandidature ? (
                <button
                  onClick={() => onToggleCandidature(u)}
                  className="flex-1 border border-red-300 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors"
                >
                  Retirer des candidatures
                </button>
              ) : (
                <button
                  onClick={() => setShowCandidatureForm(true)}
                  className="flex-1 border border-[#1a3a6b] text-[#1a3a6b] font-bold py-3 rounded-xl text-sm hover:bg-[#1a3a6b] hover:text-white transition-colors"
                >
                  + Ajouter à mes candidatures
                </button>
              )}
            </div>
          )}

          {/* Statut candidature actuelle */}
          {enCandidature && !showCandidatureForm && (
            <div className={`rounded-xl p-3 flex items-center justify-between ${STATUT_CONFIG[u.candidature_statut]?.color || 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STATUT_CONFIG[u.candidature_statut]?.dot}`} />
                <span className="text-sm font-semibold">{STATUT_CONFIG[u.candidature_statut]?.label}</span>
                {u.voeu_numero && <span className="text-xs opacity-70">— Vœu #{u.voeu_numero}</span>}
              </div>
              <button onClick={() => setShowCandidatureForm(true)} className="text-xs underline opacity-70 hover:opacity-100">
                Modifier
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────
export default function Universities() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedU, setSelectedU] = useState(null);
  const [saving, setSaving] = useState(false);

  const [filterPays, setFilterPays]   = useState('Tous');
  const [filterNiveau, setFilterNiveau] = useState('Tous');
  const [filterSort, setFilterSort]   = useState('score');
  const [search, setSearch]           = useState('');

  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort: filterSort };
      if (filterPays !== 'Tous')   params.pays   = filterPays;
      if (filterNiveau !== 'Tous') params.niveau = filterNiveau;
      if (search.trim())           params.search = search.trim();

      const res = await getUniversities(params);
      setUniversities(res.universities || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterPays, filterNiveau, filterSort, search]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { navigate('/login'); return; }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(fetchUniversities, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchUniversities, search]);

  const handleToggleCandidature = async (u, data = null) => {
    setSaving(true);
    try {
      if (u.candidature_statut && !data) {
        await deleteCandidature(u.id);
      } else {
        await upsertCandidature(u.id, data || { statut: 'en_preparation' });
      }
      await fetchUniversities();
      if (selectedU && selectedU.id === u.id) {
        const fresh = universities.find(x => x.id === u.id);
        if (fresh) setSelectedU(fresh);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const nCandidatures = universities.filter(u => u.candidature_statut).length;

  const paysCounts = PAYS_FILTRES.filter(p => p !== 'Tous').reduce((acc, p) => {
    acc[p] = universities.filter(u => u.pays === p).length;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 flex flex-col hidden lg:flex">
        <div className="px-5 py-5 border-b border-gray-100">
          <a href="/dashboard">
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: 'Tableau de bord', path: '/dashboard' },
            { label: 'Mon profil',       path: '/profile' },
            { label: 'Documents',        path: '/documents' },
            { label: 'Analyse IA',       path: '/analysis' },
            { label: 'Bourses',          path: '/bourses' },
            { label: 'Universités',      path: '/universities', active: true },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active ? 'bg-[#1a3a6b] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a3a6b]'
              }`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="lg:ml-56 flex-1 pb-20 lg:pb-0">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800">Universités & Admissions</h1>
              <p className="text-xs text-gray-400">{total} universités · {nCandidatures} candidature(s) en cours</p>
            </div>
            {nCandidatures > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 text-[#1a3a6b] px-3 py-1.5 rounded-xl text-xs font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {nCandidatures} candidature{nCandidatures > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8">

          {/* ── Filtres ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">

            {/* Recherche */}
            <div className="relative mb-4">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une université, une ville…"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Pays */}
              <div className="flex flex-wrap gap-2">
                {PAYS_FILTRES.map(p => (
                  <button key={p}
                    onClick={() => setFilterPays(p)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      filterPays === p ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a3a6b]'
                    }`}
                  >
                    {p !== 'Tous' && (
                      <span className={`fi fi-${{ France: 'fr', Canada: 'ca', Belgique: 'be', Allemagne: 'de', 'Royaume-Uni': 'gb' }[p]} rounded-sm`}
                        style={{ display: 'inline-block', width: 16, height: 11 }} />
                    )}
                    {p}
                    {p !== 'Tous' && paysCounts[p] > 0 && (
                      <span className={`text-xs rounded-full px-1.5 ${filterPays === p ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {paysCounts[p]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="w-px bg-gray-100 hidden sm:block" />

              {/* Niveau */}
              <div className="flex flex-wrap gap-2">
                {NIVEAU_FILTRES.map(n => (
                  <button key={n}
                    onClick={() => setFilterNiveau(n)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      filterNiveau === n ? 'bg-[#F5A623] text-white border-[#F5A623]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#F5A623]'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>

              <div className="ml-auto">
                <select value={filterSort} onChange={e => setFilterSort(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none bg-white text-gray-600">
                  {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Grille ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                  </div>
                  <Skeleton className="h-8 rounded-xl" />
                </div>
              ))}
            </div>
          ) : universities.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-gray-500 font-medium mb-1">Aucune université trouvée</p>
              <p className="text-gray-400 text-sm mb-4">Lancez <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">npm run setup:universities</code> dans le backend</p>
              <button onClick={() => { setFilterPays('Tous'); setFilterNiveau('Tous'); setSearch(''); }}
                className="text-sm text-[#1a3a6b] font-semibold hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              {/* Section mes candidatures */}
              {nCandidatures > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7l2 2 4-4" /></svg>
                    Mes candidatures ({nCandidatures}/7)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {universities.filter(u => u.candidature_statut).map(u => (
                      <CarteUniversite key={u.id} u={u} onClick={setSelectedU} onToggleCandidature={handleToggleCandidature} />
                    ))}
                  </div>
                </div>
              )}

              {/* Toutes les universités */}
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                {filterPays === 'Tous' ? 'Toutes les universités' : `Universités en ${filterPays}`} ({universities.filter(u => !u.candidature_statut).length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {universities.filter(u => !u.candidature_statut).map(u => (
                  <CarteUniversite key={u.id} u={u} onClick={setSelectedU} onToggleCandidature={handleToggleCandidature} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 lg:hidden">
        <div className="flex">
          {[
            { label: 'Accueil', path: '/dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { label: 'Bourses', path: '/bourses', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /></svg> },
            { label: 'Universités', path: '/universities', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, active: true },
            { label: 'Profil', path: '/profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${item.active ? 'text-[#1a3a6b]' : 'text-gray-400'}`}>
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modal détail */}
      {selectedU && (
        <UniversityModal
          u={selectedU}
          onClose={() => setSelectedU(null)}
          onToggleCandidature={handleToggleCandidature}
          saving={saving}
        />
      )}
    </div>
  );
}
