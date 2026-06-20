import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBourses } from '../services/api';
import { getUser } from '../utils/auth';
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

/* ─── Données de démonstration (remplacées par l'API quand le backend est prêt) ─── */
const BOURSES_DEMO = [
  {
    id: 1, nom: 'Bourse Eiffel Excellence',
    pays: 'France', code_pays: 'fr',
    organisme: 'Campus France / Ministère des Affaires Étrangères',
    niveau: 'Master', domaine: 'Tous domaines',
    montant: '1 181 €/mois', deadline: '2025-01-09',
    score_eligibilite: 87,
    criteres: ['Moins de 25 ans (Master)', 'Excellent dossier académique', 'Invitation d\'un établissement français'],
    description: 'La bourse Eiffel est l\'une des plus prestigieuses pour les étudiants étrangers souhaitant poursuivre un Master ou un Doctorat en France.',
    lien: '#',
  },
  {
    id: 2, nom: 'Bourse du Gouvernement Français (BGF)',
    pays: 'France', code_pays: 'fr',
    organisme: 'Ambassade de France',
    niveau: 'Master / Doctorat', domaine: 'Tous domaines',
    montant: '860 €/mois', deadline: '2025-03-31',
    score_eligibilite: 79,
    criteres: ['Ressortissant du pays cible', 'Niveau B2 minimum en français', 'Dossier académique solide'],
    description: 'Les BGF sont attribuées par les ambassades françaises dans les pays partenaires pour financer des études en France.',
    lien: '#',
  },
  {
    id: 3, nom: 'DAAD - Bourses de recherche',
    pays: 'Allemagne', code_pays: 'de',
    organisme: 'DAAD (Office allemand d\'échanges universitaires)',
    niveau: 'Master / Doctorat', domaine: 'Sciences, Ingénierie, Économie',
    montant: '850 €/mois', deadline: '2024-10-15',
    score_eligibilite: 74,
    criteres: ['Moyenne ≥ 14/20', 'Lettre de motivation solide', 'Niveau B2 en allemand ou C1 en anglais'],
    description: 'Le DAAD finance des études et recherches en Allemagne pour des étudiants du monde entier.',
    lien: '#',
  },
  {
    id: 4, nom: 'Bourse ARES',
    pays: 'Belgique', code_pays: 'be',
    organisme: 'Académie de Recherche et d\'Enseignement Supérieur',
    niveau: 'Master', domaine: 'Tous domaines',
    montant: '745 €/mois', deadline: '2025-02-01',
    score_eligibilite: 72,
    criteres: ['Ressortissant africain', 'Bac+3 minimum', 'Moins de 40 ans'],
    description: 'Les bourses ARES soutiennent des étudiants africains pour des Masters en Belgique francophone.',
    lien: '#',
  },
  {
    id: 5, nom: 'Bourse EduCanada',
    pays: 'Canada', code_pays: 'ca',
    organisme: 'Gouvernement du Canada',
    niveau: 'Master / Doctorat', domaine: 'Tous domaines',
    montant: '10 000 CAD', deadline: '2025-04-30',
    score_eligibilite: 68,
    criteres: ['Projet de recherche défini', 'Lettre d\'un directeur canadien', 'Niveau C1 en français ou anglais'],
    description: 'Programme de bourses du gouvernement canadien pour attirer les meilleurs talents étrangers dans les universités canadiennes.',
    lien: '#',
  },
  {
    id: 6, nom: 'Wallonie-Bruxelles International (WBI)',
    pays: 'Belgique', code_pays: 'be',
    organisme: 'WBI',
    niveau: 'Master', domaine: 'Tous domaines',
    montant: '750 €/mois', deadline: '2025-03-15',
    score_eligibilite: 65,
    criteres: ['Ressortissant pays prioritaires', 'Niveau B2 en français', 'Moins de 35 ans'],
    description: 'Bourses accordées par la Wallonie-Bruxelles International pour des études dans les universités belges francophones.',
    lien: '#',
  },
  {
    id: 7, nom: 'Friedrich Ebert Stiftung',
    pays: 'Allemagne', code_pays: 'de',
    organisme: 'Fondation Friedrich Ebert',
    niveau: 'Master / Doctorat', domaine: 'Sciences sociales, Droit, Économie',
    montant: '934 €/mois', deadline: '2024-12-31',
    score_eligibilite: 61,
    criteres: ['Engagement social ou politique', 'Excellente moyenne', 'Niveau B2 en allemand'],
    description: 'Fondation liée au SPD allemand, finançant des étudiants avec un fort engagement citoyen.',
    lien: '#',
  },
  {
    id: 8, nom: 'Erasmus+ Mobilité Internationale',
    pays: 'Europe', code_pays: 'eu',
    organisme: 'Commission Européenne',
    niveau: 'Licence / Master / Doctorat', domaine: 'Tous domaines',
    montant: '700 – 1 000 €/mois', deadline: '2025-05-31',
    score_eligibilite: 58,
    criteres: ['Accord avec une université européenne', 'Niveau B2 en langue d\'enseignement', 'Candidature via l\'université'],
    description: 'Programme phare de l\'UE pour la mobilité étudiante entre l\'Europe et les pays partenaires.',
    lien: '#',
  },
  {
    id: 9, nom: 'Bourses OIF',
    pays: 'International', code_pays: 'un',
    organisme: 'Organisation Internationale de la Francophonie',
    niveau: 'Master', domaine: 'Gouvernance, Numérique, Environnement',
    montant: 'Variable', deadline: '2025-06-30',
    score_eligibilite: 55,
    criteres: ['Ressortissant d\'un pays membre de l\'OIF', 'Projet lié aux priorités de l\'OIF', 'Niveau C1 en français'],
    description: 'Bourses pour des formations dans des domaines prioritaires de la Francophonie.',
    lien: '#',
  },
  {
    id: 10, nom: 'Bourse Québec – MEES',
    pays: 'Canada', code_pays: 'ca',
    organisme: 'Ministère de l\'Éducation du Québec',
    niveau: 'Master / Doctorat', domaine: 'Tous domaines',
    montant: '3 000 CAD par semestre', deadline: '2025-02-28',
    score_eligibilite: 52,
    criteres: ['Admission dans une université québécoise', 'Niveau B2 en français', 'Projet de recherche'],
    description: 'Programme de bourses du gouvernement québécois pour attirer des étudiants francophones.',
    lien: '#',
  },
];

const PAYS_FILTRES = ['Tous', 'France', 'Canada', 'Belgique', 'Allemagne', 'Royaume-Uni', 'Europe', 'International'];
const NIVEAUX_FILTRES = ['Tous', 'Licence', 'Master', 'Doctorat'];
const SCORES_FILTRES = [
  { label: 'Tous', min: 0 },
  { label: '> 80%', min: 80 },
  { label: '> 60%', min: 60 },
  { label: '> 40%', min: 40 },
];

const FLAG_CODES = { 'France': 'fr', 'Canada': 'ca', 'Belgique': 'be', 'Allemagne': 'de', 'Royaume-Uni': 'gb', 'Europe': 'eu', 'International': 'un' };

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200'
    : score >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${color}`}>
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {score}% éligible
    </div>
  );
}

function BarreScore({ score }) {
  const color = score >= 75 ? 'bg-green-400' : score >= 60 ? 'bg-blue-400' : score >= 40 ? 'bg-orange-400' : 'bg-gray-300';
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
    </div>
  );
}

function CarteDetailModal({ bourse, onClose }) {
  if (!bourse) return null;

  const deadline = bourse.deadline ? new Date(bourse.deadline) : null;
  const jours = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
  const score = bourse.score_eligibilite || 0;

  const avantages   = toArr(bourse.avantages);
  const documents   = toArr(bourse.documents_requis);
  const nats        = toArr(bourse.nationalites_eligibles);
  const criteres    = toArr(bourse.criteres);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-[#1a3a6b] rounded-t-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`fi fi-${bourse.code_pays} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 24, height: 17 }} />
                <span className="text-blue-200 text-sm">{bourse.pays}</span>
                <span className="bg-[#F5A623] text-white text-xs px-2 py-0.5 rounded-full font-semibold">{bourse.niveau}</span>
                {bourse.type_financement && (
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{bourse.type_financement}</span>
                )}
                {score > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    score >= 75 ? 'bg-green-400' : score >= 60 ? 'bg-blue-300' : 'bg-orange-400'
                  } text-white`}>{score}% match</span>
                )}
              </div>
              <h2 className="text-lg font-bold leading-tight">{bourse.nom}</h2>
              <p className="text-blue-200 text-sm mt-1">{bourse.organisme}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Infos rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Montant',   val: bourse.montant || '--' },
              { label: 'Durée',     val: bourse.duree   || '--' },
              { label: 'Ouverture', val: bourse.date_debut ? new Date(bourse.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' },
              { label: 'Clôture',   val: deadline ? deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-blue-200 text-xs mb-1">{item.label}</p>
                <p className="text-white font-semibold text-xs leading-tight">{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Corps ── */}
        <div className="p-5 space-y-5">

          {/* Urgence deadline */}
          {jours !== null && jours > 0 && jours <= 60 && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 ${
              jours <= 30 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {jours <= 30 ? `Urgent — il reste ${jours} jour(s) !` : `${jours} jours restants`}
            </div>
          )}

          {/* Score d'éligibilité */}
          {score > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-500">Votre score d'éligibilité</p>
                <ScoreBadge score={score} />
              </div>
              <BarreScore score={score} />
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{bourse.description}</p>
          </div>

          {/* Avantages */}
          {avantages.length > 0 && (
            <div>
              <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Ce que couvre la bourse</h3>
              <div className="flex flex-wrap gap-2">
                {avantages.map((a, i) => (
                  <span key={i} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {toStr(a)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Éligibilité */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Domaine',           val: bourse.domaine || '--' },
              { label: 'Langue requise',     val: bourse.langue_requise ? `${bourse.langue_requise} — ${bourse.niveau_langue_requis || 'B2'} min.` : '--' },
              { label: 'Âge maximum',        val: bourse.age_max ? `${bourse.age_max} ans` : 'Pas de limite' },
              { label: 'Places disponibles', val: bourse.nb_places ? `${bourse.nb_places} places` : 'Non précisé' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                <p className="text-gray-700 font-semibold text-sm">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Nationalités */}
          {nats.length > 0 && (
            <div>
              <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Nationalités éligibles</h3>
              <p className="text-gray-600 text-sm">{nats.map(toStr).join(', ')}</p>
            </div>
          )}

          {/* Documents requis */}
          {documents.length > 0 && (
            <div>
              <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Documents requis</h3>
              <ul className="space-y-1.5">
                {documents.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {toStr(doc)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critères */}
          {criteres.length > 0 && (
            <div>
              <h3 className="text-[#1a3a6b] font-bold text-sm mb-2">Critères de sélection</h3>
              <div className="space-y-2">
                {criteres.map((c, i) => {
                  const isObj = typeof c === 'object' && c !== null;
                  return (
                    <div key={i} className={isObj ? 'bg-blue-50 rounded-xl p-3 border border-blue-100' : 'flex items-start gap-2 text-xs text-gray-600'}>
                      {isObj ? (
                        <>
                          <p className="text-[#1a3a6b] font-semibold text-xs mb-0.5">{toStr(c.titre)}</p>
                          <p className="text-gray-600 text-xs leading-relaxed">{toStr(c.desc)}</p>
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
            <a
              href={bourse.lien && bourse.lien !== '#' ? bourse.lien : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
                bourse.lien && bourse.lien !== '#'
                  ? 'bg-[#F5A623] hover:bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Candidater sur le site officiel
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <button
              onClick={onClose}
              className="flex-1 border border-[#1a3a6b] text-[#1a3a6b] font-bold py-3 rounded-xl text-sm hover:bg-[#1a3a6b] hover:text-white transition-colors"
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Bourses() {
  const navigate = useNavigate();
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtrePays, setFiltrePays] = useState('Tous');
  const [filtreNiveau, setFiltreNiveau] = useState('Tous');
  const [filtreScore, setFiltreScore] = useState(0);
  const [triPar, setTriPar] = useState('score');
  const [bourseSelectionnee, setBourseSelectionnee] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!getUser()) { navigate('/login', { replace: true }); return; }
    chargerBourses();
  }, [navigate]);

  const chargerBourses = async () => {
    setLoading(true);
    try {
      const res = await getBourses();
      setBourses(res?.bourses?.length ? res.bourses : BOURSES_DEMO);
    } catch {
      setBourses(BOURSES_DEMO);
    } finally {
      setLoading(false);
    }
  };

  const boursesFiltrees = bourses
    .filter((b) => {
      if (recherche && !(b.nom?.toLowerCase().includes(recherche.toLowerCase())) && !(b.organisme?.toLowerCase().includes(recherche.toLowerCase()))) return false;
      if (filtrePays !== 'Tous' && b.pays !== filtrePays) return false;
      if (filtreNiveau !== 'Tous' && !(b.niveau?.includes(filtreNiveau))) return false;
      if (b.score_eligibilite < filtreScore) return false;
      return true;
    })
    .sort((a, b) => {
      if (triPar === 'score') return b.score_eligibilite - a.score_eligibilite;
      if (triPar === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
      if (triPar === 'montant') return b.score_eligibilite - a.score_eligibilite;
      return 0;
    });

  const stats = {
    total: bourses.length,
    top: bourses.filter((b) => b.score_eligibilite >= 75).length,
    france: bourses.filter((b) => b.pays === 'France').length,
    prochaine: bourses.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0]?.deadline,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full w-64 md:w-56 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard', { replace: true }); }}>
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Filtres rapides */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2 tracking-wider">PAYS</p>
          {PAYS_FILTRES.map((pays) => (
            <button
              key={pays}
              onClick={() => setFiltrePays(pays)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left mb-0.5 ${
                filtrePays === pays ? 'bg-[#1a3a6b] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {pays !== 'Tous' && FLAG_CODES[pays] && (
                <span className={`fi fi-${FLAG_CODES[pays]} rounded-sm shrink-0`} style={{ display: 'inline-block', width: 18, height: 13 }} />
              )}
              <span>{pays}</span>
              <span className={`ml-auto text-xs ${filtrePays === pays ? 'text-white/70' : 'text-gray-400'}`}>
                {pays === 'Tous' ? bourses.length : bourses.filter((b) => b.pays === pays).length}
              </span>
            </button>
          ))}

          <p className="text-xs font-semibold text-gray-400 px-3 mb-2 mt-4 tracking-wider">NIVEAU</p>
          {NIVEAUX_FILTRES.map((n) => (
            <button key={n} onClick={() => setFiltreNiveau(n)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                filtreNiveau === n ? 'bg-[#1a3a6b] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {n}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => navigate(-1)} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour au dashboard
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className="md:ml-56 flex-1">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-[#1a3a6b] p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Bourses disponibles</h1>
              <p className="text-xs text-gray-400">{boursesFiltrees.length} bourse(s) correspondant à votre profil</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tri — masqué sur mobile */}
            <select value={triPar} onChange={(e) => setTriPar(e.target.value)}
              className="hidden md:block border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none focus:border-[#1a3a6b] bg-white">
              <option value="score">Trier : Score éligibilité</option>
              <option value="deadline">Trier : Date limite</option>
            </select>
            {/* Recherche */}
            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 gap-2 w-40 md:w-56 focus-within:border-[#1a3a6b] transition-all">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={recherche} onChange={(e) => setRecherche(e.target.value)}
                type="text" placeholder="Rechercher..." className="flex-1 outline-none text-sm placeholder-gray-400 bg-transparent" />
            </div>
          </div>
        </div>

        {/* ── Filtres mobile (md:hidden) ── */}
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 sticky top-[65px] z-10">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {PAYS_FILTRES.map((pays) => (
              <button key={pays} onClick={() => setFiltrePays(pays)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filtrePays === pays ? 'bg-[#1a3a6b] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                {pays !== 'Tous' && FLAG_CODES[pays] && (
                  <span className={`fi fi-${FLAG_CODES[pays]}`} style={{ display: 'inline-block', width: 14, height: 10 }} />
                )}
                {pays}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto mt-2 pb-1" style={{ scrollbarWidth: 'none' }}>
            {NIVEAUX_FILTRES.map((n) => (
              <button key={n} onClick={() => setFiltreNiveau(n)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filtreNiveau === n ? 'bg-[#F5A623] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Bourses disponibles', val: stats.total,  color: 'text-[#1a3a6b]',  bg: 'bg-blue-50' },
              { label: '≥ 75% éligibilité',   val: stats.top,   color: 'text-green-600',   bg: 'bg-green-50' },
              { label: 'Pour la France',       val: stats.france,color: 'text-[#F5A623]',   bg: 'bg-orange-50' },
              { label: 'Prochaine deadline',
                val: stats.prochaine ? new Date(stats.prochaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '--',
                color: 'text-red-600', bg: 'bg-red-50' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtre score */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500 font-medium">Éligibilité min :</span>
            {SCORES_FILTRES.map((s) => (
              <button key={s.label} onClick={() => setFiltreScore(s.min)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  filtreScore === s.min ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]' : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Liste bourses */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400 mt-4">Chargement des bourses...</p>
            </div>
          ) : boursesFiltrees.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-gray-600">Aucune bourse trouvée</p>
              <p className="text-sm mt-1">Essayez d'élargir vos filtres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {boursesFiltrees.map((bourse, idx) => {
                const jours = Math.ceil((new Date(bourse.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                const urgente = jours > 0 && jours <= 30;
                return (
                  <div key={bourse.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#1a3a6b]/20 transition-all">
                    <div className="flex items-start gap-5">

                      {/* Rang */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Drapeau */}
                      <div className="shrink-0 mt-1">
                        <span className={`fi fi-${bourse.code_pays} rounded-md shadow-sm`} style={{ display: 'inline-block', width: 36, height: 26 }} />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-base font-bold text-gray-800 leading-tight">{bourse.nom}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{bourse.organisme}</p>
                          </div>
                          <ScoreBadge score={bourse.score_eligibilite} />
                        </div>

                        <BarreScore score={bourse.score_eligibilite} />

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                            {bourse.niveau}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {bourse.montant}
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-semibold ${urgente ? 'text-red-600' : 'text-gray-500'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {urgente ? `⚠ ${jours}j restants` : new Date(bourse.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setBourseSelectionnee(bourse)}
                        className="shrink-0 border border-[#1a3a6b] text-[#1a3a6b] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1a3a6b] hover:text-white transition-all"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <button key={item.path} onClick={() => navigate(item.path, { replace: true })} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${window.location.pathname === item.path ? 'text-[#1a3a6b]' : 'text-gray-400'}`}>
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Modal détail ── */}
      {bourseSelectionnee && (
        <CarteDetailModal bourse={bourseSelectionnee} onClose={() => setBourseSelectionnee(null)} />
      )}
    </div>
  );
}
