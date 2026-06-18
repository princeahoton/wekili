import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getBoursesPublic } from '../services/api';
import 'flag-icons/css/flag-icons.min.css';

function toArr(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('[')) { try { return JSON.parse(s); } catch { /* ignore */ } }
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

const VIDEOS = ['/video1.mp4', '/video2.mp4', '/video3.mp4'];

const PAYS = [
  {
    code: 'fr', pays: 'France',
    desc: "Plus de 20 bourses disponibles. Langue française obligatoire. Nombreuses universités classées mondialement.",
    nb: '20+ bourses', delai: 'Jan–Mars',
  },
  {
    code: 'ca', pays: 'Canada',
    desc: "Bourses bilingues (français/anglais). Qualité de vie exceptionnelle. Forte communauté africaine.",
    nb: '12+ bourses', delai: 'Nov–Fév',
  },
  {
    code: 'be', pays: 'Belgique',
    desc: "Frais d'inscription parmi les plus bas d'Europe. Bourse WBI pour pays francophones. Idéal pour Master.",
    nb: '8+ bourses', delai: 'Fév–Avr',
  },
  {
    code: 'de', pays: 'Allemagne',
    desc: "Bourse DAAD très compétitive. Universités d'excellence. Nombreux programmes en anglais.",
    nb: '10+ bourses', delai: 'Oct–Déc',
  },
  {
    code: 'gb', pays: 'Royaume-Uni',
    desc: "Bourse Chevening réputée mondialement. Top universités (Oxford, Cambridge). Communauté diverse.",
    nb: '12+ bourses', delai: 'Août–Nov',
  },
  {
    code: 'us', pays: 'USA',
    desc: "Bientôt disponible. Les États-Unis seront intégrés dans la prochaine version de Wekili.",
    nb: 'Bientôt', delai: '--',
  },
];

const BOURSES = [
  {
    nom: 'Bourse Eiffel Excellence',
    pays: 'France', code: 'fr',
    montant: 'jusqu\'à 1 181 €/mois',
    niveau: 'Master • Doctorat',
    organisme: 'Campus France',
    couleur: 'bg-blue-50 border-blue-100',
  },
  {
    nom: 'DAAD — Bourse d\'excellence',
    pays: 'Allemagne', code: 'de',
    montant: 'jusqu\'à 934 €/mois',
    niveau: 'Master • Doctorat',
    organisme: 'DAAD',
    couleur: 'bg-yellow-50 border-yellow-100',
  },
  {
    nom: 'Bourse WBI',
    pays: 'Belgique', code: 'be',
    montant: 'jusqu\'à 1 500 €/mois',
    niveau: 'Master',
    organisme: 'Wallonie-Bruxelles',
    couleur: 'bg-red-50 border-red-100',
  },
  {
    nom: 'Bourse Vanier Canada',
    pays: 'Canada', code: 'ca',
    montant: '50 000 $/an',
    niveau: 'Doctorat',
    organisme: 'Gouvernement du Canada',
    couleur: 'bg-red-50 border-red-100',
  },
  {
    nom: 'Bourse Chevening',
    pays: 'Royaume-Uni', code: 'gb',
    montant: 'Couverture totale',
    niveau: 'Master',
    organisme: 'FCDO',
    couleur: 'bg-indigo-50 border-indigo-100',
  },
  {
    nom: 'Bourse du Gouvernement Français',
    pays: 'France', code: 'fr',
    montant: 'jusqu\'à 700 €/mois',
    niveau: 'Licence • Master',
    organisme: 'Institut Français',
    couleur: 'bg-blue-50 border-blue-100',
  },
];

const ETAPES_PREP = [
  {
    num: '01',
    titre: 'Obtenir des relevés officiels',
    desc: 'Faites légaliser vos relevés de notes et diplômes. Prévoyez des copies certifiées conformes.',
    icon: '📄',
    delai: '2–4 semaines',
  },
  {
    num: '02',
    titre: 'Passer une certification de langue',
    desc: 'DELF/DALF pour le français, IELTS/TOEFL pour l\'anglais. La majorité des bourses l\'exigent.',
    icon: '🗣️',
    delai: '1–3 mois',
  },
  {
    num: '03',
    titre: 'Rédiger votre lettre de motivation',
    desc: 'Personnalisée pour chaque bourse. Wekili identifie les points clés à valoriser dans votre lettre.',
    icon: '✍️',
    delai: '2–4 semaines',
  },
  {
    num: '04',
    titre: 'Obtenir des lettres de recommandation',
    desc: '2 à 3 lettres de professeurs ou employeurs. À demander 2–3 mois à l\'avance.',
    icon: '🤝',
    delai: '4–8 semaines',
  },
];

const NIVEAUX_ETUDE = [
  {
    titre: 'Licence (Bac+3)',
    desc: 'Les bourses de licence sont rares mais existent. Wekili recense les programmes accessibles aux bacheliers africains.',
    bourses: '8 bourses disponibles',
    icon: '🎒',
    bg: 'bg-orange-50',
    color: 'text-orange-600',
  },
  {
    titre: 'Master (Bac+5)',
    desc: 'La majorité des bourses internationales visent le niveau Master. C\'est le niveau le plus compétitif et le plus financé.',
    bourses: '35 bourses disponibles',
    icon: '📚',
    bg: 'bg-blue-50',
    color: 'text-blue-700',
  },
  {
    titre: 'Doctorat (Bac+8)',
    desc: 'Bourses de recherche très dotées. Disponibles dans toutes les grandes universités européennes et nord-américaines.',
    bourses: '18 bourses disponibles',
    icon: '🔬',
    bg: 'bg-green-50',
    color: 'text-green-700',
  },
];

const TEMOIGNAGES = [
  {
    nom: 'Aminata Diallo',
    pays: 'Sénégal', code: 'sn',
    bourse: 'Bourse Eiffel — France',
    texte: "Grâce à Wekili, j'ai su exactement quels documents améliorer. Mon dossier a été accepté en moins de 3 semaines après les recommandations de l'IA.",
    note: 5,
  },
  {
    nom: 'Kofi Mensah',
    pays: "Côte d'Ivoire", code: 'ci',
    bourse: 'DAAD — Allemagne',
    texte: "Je ne savais pas par où commencer. Wekili m'a donné un score, des points à corriger, et une liste de bourses adaptées à mon profil. Incroyable.",
    note: 5,
  },
  {
    nom: 'Fatou Ndiaye',
    pays: 'Bénin', code: 'bj',
    bourse: 'Bourse WBI — Belgique',
    texte: "L'analyse IA a détecté que ma lettre de motivation était trop courte. Après correction, mon score est passé de 61 à 78. J'ai eu ma bourse !",
    note: 5,
  },
];

const FAQS = [
  {
    q: "Wekili est-il vraiment gratuit ?",
    r: "Oui, l'inscription et la première analyse complète de votre dossier sont entièrement gratuites. Aucune carte bancaire requise.",
  },
  {
    q: "Quels pays de destination sont couverts ?",
    r: "Le MVP couvre la France, le Canada, la Belgique, l'Allemagne et le Royaume-Uni, avec plus de 60 bourses disponibles.",
  },
  {
    q: "Combien de temps prend l'analyse IA ?",
    r: "L'analyse complète de votre dossier prend moins de 3 minutes. Vous recevez ensuite un rapport structuré avec votre score et vos recommandations.",
  },
  {
    q: "Quels documents dois-je uploader ?",
    r: "CV, relevés de notes, diplômes, attestation de langue, lettre de motivation et lettre de recommandation. Formats PDF, DOCX, JPG et PNG acceptés.",
  },
  {
    q: "Mon dossier est-il sécurisé ?",
    r: "Oui. Vos documents sont chiffrés et stockés de façon sécurisée. Les accès sont protégés par authentification JWT.",
  },
  {
    q: "Puis-je relancer une analyse après avoir modifié mon dossier ?",
    r: "Absolument. Vous pouvez mettre à jour vos documents et relancer une nouvelle analyse à tout moment depuis votre tableau de bord.",
  },
];

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-[#F5A623]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [videoIndex, setVideoIndex] = useState(0);
  const [faqOpen, setFaqOpen] = useState(null);
  const [bourses, setBourses] = useState([]);
  const [boursesLoading, setBoursesLoading] = useState(true);
  const [selectedBourse, setSelectedBourse] = useState(null);

  const isLoggedIn = !!localStorage.getItem('token');

  const handleVideoEnd = () => setVideoIndex((prev) => (prev + 1) % VIDEOS.length);

  useEffect(() => {
    getBoursesPublic({ limit: 6 })
      .then(res => setBourses(res.bourses || []))
      .catch(() => setBourses([]))
      .finally(() => setBoursesLoading(false));
  }, []);

  const ctaLabel    = isLoggedIn ? 'Accéder à mon tableau de bord →' : 'Analyser mon dossier gratuitement →';
  const ctaPath     = isLoggedIn ? '/dashboard' : '/register';
  const ctaLabelAlt = isLoggedIn ? 'MON TABLEAU DE BORD →' : 'ANALYSER MON DOSSIER GRATUITEMENT →';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══════════════════════════════
          1. HERO — vidéo en fond
      ═══════════════════════════════ */}
      <section id="accueil" className="relative pt-[144px] min-h-[580px] flex items-end overflow-hidden">
        <video
          key={videoIndex}
          autoPlay muted playsInline
          onEnded={handleVideoEnd}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={VIDEOS[videoIndex]} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a6b]/90 via-[#1a3a6b]/60 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-16 pt-10">
          <div className="max-w-xl">
            <p className="text-[#F5A623] font-semibold text-base uppercase tracking-widest mb-3">
              Plateforme IA • Bourses internationales
            </p>
            <h1 className="text-white text-5xl md:text-6xl font-bold leading-tight mb-5">
              Votre avenir<br />
              <span className="text-[#F5A623]">commence ici</span>
            </h1>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Analysez votre dossier par IA, découvrez les meilleures bourses adaptées
              à votre profil et candidatez en toute confiance.
            </p>
            <button
              onClick={() => navigate(ctaPath)}
              className="bg-[#F5A623] hover:bg-orange-500 text-white font-bold px-8 py-4 text-base uppercase tracking-wider transition-colors"
            >
              {ctaLabel}
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {VIDEOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setVideoIndex(i)}
              className={`block w-2.5 h-2.5 rounded-full transition-colors ${i === videoIndex ? 'bg-[#F5A623]' : 'bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          2. LIENS RAPIDES
      ═══════════════════════════════ */}
      <section id="liens-rapides" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {[
              { icon: '🎓', question: 'Quelle bourse recherchez-vous ?',         href: '#bourses'  },
              { icon: '💰', question: 'Comment préparer votre candidature ?',     href: '#preparer' },
              { icon: '📍', question: 'Découvrir les pays de destination',        href: '#pays'     },
            ].map((item) => (
              <a
                key={item.question}
                href={item.href}
                className="flex items-center gap-4 px-6 py-6 bg-[#1a3a6b] text-white hover:bg-[#0f2550] transition-colors group"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-base font-semibold leading-tight flex-1">{item.question}</span>
                <svg className="w-5 h-5 text-[#F5A623] group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          3. BOURSES — données réelles
      ═══════════════════════════════ */}
      <section id="bourses" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide border-b-2 border-[#F5A623] pb-2 inline-block">
                Bourses disponibles
              </h2>
              <p className="text-gray-500 text-base mt-3">
                Plus de 60 bourses recensées pour les étudiants africains francophones
              </p>
            </div>
            <button
              onClick={() => navigate(ctaPath)}
              className="shrink-0 bg-[#F5A623] hover:bg-orange-500 text-white font-bold px-6 py-3 text-sm uppercase tracking-wider transition-colors"
            >
              Voir toutes mes bourses →
            </button>
          </div>

          {boursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="border border-gray-100 rounded-lg p-5 animate-pulse">
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bourses.map((b) => {
                const deadline = b.deadline ? new Date(b.deadline) : null;
                const jours = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
                const urgent = jours !== null && jours > 0 && jours <= 60;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBourse(b)}
                    className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md hover:border-[#1a3a6b] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`fi fi-${b.code_pays} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 24, height: 17 }} />
                        <span className="text-xs text-gray-400">{b.pays}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#1a3a6b] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {b.niveau}
                      </span>
                    </div>
                    <h3 className="text-[#1a3a6b] font-bold text-sm leading-snug mb-1 group-hover:text-[#F5A623] transition-colors">{b.nom}</h3>
                    <p className="text-gray-400 text-xs mb-3 truncate">{b.organisme}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <p className="text-[#F5A623] font-bold text-sm truncate">{b.montant}</p>
                      {deadline && (
                        <span className={`text-xs ml-2 shrink-0 ${urgent ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                          {urgent ? `⚠ ${jours}j` : deadline.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#1a3a6b] mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Voir les détails →
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '60+',  label: 'Bourses disponibles'  },
              { val: '5',    label: 'Pays de destination'  },
              { val: '3min', label: "Durée de l'analyse"   },
              { val: '100%', label: 'Gratuit'              },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                <p className="text-3xl font-bold text-[#F5A623]">{s.val}</p>
                <p className="text-sm text-gray-500 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modal détails bourse ── */}
      {selectedBourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBourse(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1a3a6b] rounded-t-2xl p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`fi fi-${selectedBourse.code_pays} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 24, height: 17 }} />
                    <span className="text-blue-200 text-sm">{selectedBourse.pays}</span>
                    <span className="bg-[#F5A623] text-white text-xs px-2 py-0.5 rounded-full font-semibold">{selectedBourse.niveau}</span>
                    {selectedBourse.type_financement && (
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{selectedBourse.type_financement}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold leading-tight">{selectedBourse.nom}</h2>
                  <p className="text-blue-200 text-sm mt-1">{selectedBourse.organisme}</p>
                </div>
                <button onClick={() => setSelectedBourse(null)} className="text-white/60 hover:text-white shrink-0 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Infos rapides */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Montant', val: selectedBourse.montant },
                  { label: 'Durée', val: selectedBourse.duree || '--' },
                  { label: 'Ouverture', val: selectedBourse.date_debut ? new Date(selectedBourse.date_debut).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '--' },
                  { label: 'Clôture', val: selectedBourse.deadline ? new Date(selectedBourse.deadline).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '--' },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-blue-200 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-semibold text-xs leading-tight">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-5">

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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {toStr(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Critères d'éligibilité */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Domaine', val: selectedBourse.domaine || '--' },
                  { label: 'Langue requise', val: selectedBourse.langue_requise ? `${selectedBourse.langue_requise} (${selectedBourse.niveau_langue_requis || 'B2'} min.)` : '--' },
                  { label: 'Âge maximum', val: selectedBourse.age_max ? `${selectedBourse.age_max} ans` : 'Pas de limite' },
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
                        <svg className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
              <div className="flex gap-3 pt-2">
                <a
                  href={selectedBourse.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#F5A623] hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm text-center transition-colors"
                >
                  Candidater sur le site officiel →
                </a>
                <button
                  onClick={() => { setSelectedBourse(null); navigate(ctaPath); }}
                  className="flex-1 border border-[#1a3a6b] text-[#1a3a6b] font-bold py-3 rounded-xl text-sm hover:bg-[#1a3a6b] hover:text-white transition-colors"
                >
                  {isLoggedIn ? 'Voir mon score d\'éligibilité' : 'Créer mon dossier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════
          4. PAYS — destinations
      ═══════════════════════════════ */}
      <section id="pays" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide">
              Pays de destination
            </h2>
            <div className="h-0.5 w-16 bg-[#F5A623] mt-3 mx-auto" />
            <p className="text-gray-500 text-base mt-3">5 pays couverts avec des informations détaillées sur chaque destination</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAYS.map((p) => (
              <div
                key={p.pays}
                className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-[#1a3a6b] transition-all group ${p.pays === 'USA' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`fi fi-${p.code} rounded-sm shadow-sm shrink-0`} style={{ display: 'inline-block', width: 40, height: 28 }} />
                  <h3 className="text-lg font-bold text-[#1a3a6b] group-hover:text-[#F5A623] transition-colors">{p.pays}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{p.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-semibold text-[#F5A623]">{p.nb}</span>
                  <span className="text-xs text-gray-400">Délai : {p.delai}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500 text-sm mb-4">Wekili identifie automatiquement les bourses disponibles dans vos pays cibles.</p>
            <button
              onClick={() => navigate(ctaPath)}
              className="bg-[#1a3a6b] hover:bg-[#0f2550] text-white font-bold px-8 py-3 text-sm uppercase tracking-wider transition-colors"
            >
              {ctaLabelAlt}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          5. PRÉPARER — guide candidature
      ═══════════════════════════════ */}
      <section id="preparer" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide">
              Préparer votre candidature
            </h2>
            <div className="h-0.5 w-16 bg-[#F5A623] mt-3 mx-auto" />
            <p className="text-gray-500 text-base mt-3">
              Les étapes clés pour constituer un dossier solide et maximiser vos chances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ETAPES_PREP.map((e) => (
              <div key={e.num} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-[#1a3a6b] transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{e.icon}</span>
                  <span className="text-[#F5A623] font-black text-3xl">{e.num}</span>
                </div>
                <h3 className="text-[#1a3a6b] font-bold text-base mb-2 group-hover:text-[#F5A623] transition-colors">{e.titre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{e.desc}</p>
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-200">
                  <svg className="w-3.5 h-3.5 text-[#F5A623] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-400 font-medium">Délai estimé : {e.delai}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-[#1a3a6b] rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-xl mb-2">Wekili analyse votre dossier automatiquement</h3>
              <p className="text-white/70 text-sm">
                Notre IA identifie les documents manquants, les faiblesses de votre profil et vous donne des recommandations concrètes pour améliorer chaque étape.
              </p>
            </div>
            <button
              onClick={() => navigate(ctaPath)}
              className="shrink-0 bg-[#F5A623] hover:bg-orange-500 text-white font-bold px-8 py-3 text-sm uppercase tracking-wider transition-colors"
            >
              Analyser mon dossier →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          6. COMMENT ÇA MARCHE
      ═══════════════════════════════ */}
      <section id="comment" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide">
              Comment fonctionne Wekili ?
            </h2>
            <div className="h-0.5 w-16 bg-[#F5A623] mt-3 mx-auto" />
            <p className="text-gray-500 text-base mt-3">4 étapes pour trouver votre bourse idéale</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200">
            {[
              { num: '01', icon: '👤', titre: 'Créez votre profil',     desc: 'Renseignez votre niveau, domaine, langues et objectifs en 2 minutes.' },
              { num: '02', icon: '📄', titre: 'Uploadez vos documents', desc: 'CV, relevés de notes, diplôme — tout en un seul endroit sécurisé.'     },
              { num: '03', icon: '🤖', titre: 'Analyse IA',             desc: 'Notre IA analyse votre dossier et génère un rapport en moins de 3 min.' },
              { num: '04', icon: '🎓', titre: 'Recevez vos bourses',    desc: 'Vos opportunités classées par éligibilité, avec deadlines et montants.' },
            ].map((etape) => (
              <div
                key={etape.num}
                className="border-l border-gray-200 first:border-l-0 p-7 hover:bg-[#1a3a6b] group transition-colors cursor-pointer"
              >
                <p className="text-[#F5A623] font-black text-4xl mb-4">{etape.num}</p>
                <div className="text-4xl mb-3">{etape.icon}</div>
                <h3 className="text-[#1a3a6b] group-hover:text-white font-bold text-base mb-2 transition-colors">
                  {etape.titre}
                </h3>
                <p className="text-gray-500 group-hover:text-white/70 text-sm leading-relaxed transition-colors">
                  {etape.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate(ctaPath)}
              className="bg-[#1a3a6b] hover:bg-[#0f2550] text-white font-bold px-10 py-4 text-base uppercase tracking-wider transition-colors"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          7. ÉTUDIER — niveaux & infos
      ═══════════════════════════════ */}
      <section id="etudier" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide">
              Étudier à l'étranger
            </h2>
            <div className="h-0.5 w-16 bg-[#F5A623] mt-3 mx-auto" />
            <p className="text-gray-500 text-base mt-3">
              Choisissez le niveau d'études qui correspond à votre projet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {NIVEAUX_ETUDE.map((n) => (
              <div key={n.titre} className={`${n.bg} rounded-lg p-7 border border-transparent hover:shadow-md transition-all`}>
                <div className="text-4xl mb-4">{n.icon}</div>
                <h3 className={`font-bold text-xl mb-3 ${n.color}`}>{n.titre}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{n.desc}</p>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <svg className="w-4 h-4 text-[#F5A623] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className={`text-sm font-semibold ${n.color}`}>{n.bourses}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Points pratiques */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <h3 className="text-[#1a3a6b] font-bold text-xl mb-6">Ce que vous devez savoir avant de partir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {[
                { titre: 'Visa étudiant', desc: 'Planifiez votre demande de visa 3 à 6 mois avant le départ. Chaque pays a ses propres exigences.' },
                { titre: 'Logement', desc: 'Réservez votre logement dès l\'acceptation. Les résidences universitaires ferment rapidement.' },
                { titre: 'Couverture sociale', desc: 'Renseignez-vous sur la couverture santé dans votre pays de destination et souscrivez une assurance.' },
                { titre: 'Équivalence de diplôme', desc: 'Faites reconnaître vos diplômes par les autorités compétentes du pays d\'accueil à l\'avance.' },
                { titre: 'Compte bancaire', desc: 'Beaucoup de pays exigent un compte local. Certains établissements permettent l\'ouverture à distance.' },
                { titre: 'Communauté africaine', desc: 'Dans chaque ville de destination, il existe des associations d\'étudiants africains francophones.' },
              ].map((p) => (
                <div key={p.titre} className="flex items-start gap-3">
                  <span className="text-[#F5A623] font-bold mt-0.5 text-lg leading-none shrink-0">›</span>
                  <div>
                    <span className="text-[#1a3a6b] font-semibold text-sm">{p.titre} — </span>
                    <span className="text-gray-500 text-sm">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          8. TÉMOIGNAGES
      ═══════════════════════════════ */}
      <section id="temoignages" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide">
              Ils ont trouvé leur bourse
            </h2>
            <div className="h-0.5 w-16 bg-[#F5A623] mt-3 mx-auto" />
            <p className="text-gray-500 text-base mt-3">
              Des étudiants africains qui ont réussi grâce à Wekili
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t) => (
              <div key={t.nom} className="bg-white border border-gray-200 p-6 rounded hover:shadow-md transition-shadow">
                <Stars n={t.note} />
                <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-5 italic">
                  "{t.texte}"
                </p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <span
                    className={`fi fi-${t.code} rounded-full shrink-0`}
                    style={{ display: 'inline-block', width: 36, height: 36, backgroundSize: 'cover' }}
                  />
                  <div>
                    <p className="text-[#1a3a6b] font-bold text-sm">{t.nom}</p>
                    <p className="text-gray-400 text-xs">{t.pays} — <span className="text-[#F5A623] font-semibold">{t.bourse}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          9. FAQ
      ═══════════════════════════════ */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[#1a3a6b] text-3xl font-bold uppercase tracking-wide">
              Questions fréquentes
            </h2>
            <div className="h-0.5 w-16 bg-[#F5A623] mt-3 mx-auto" />
          </div>

          <div className="divide-y divide-gray-200 border border-gray-200">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="text-[#1a3a6b] font-semibold text-base pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-[#F5A623] shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          10. CTA FINAL
      ═══════════════════════════════ */}
      <section className="bg-[#1a3a6b] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
            {isLoggedIn ? 'Continuez votre parcours' : 'Prêt à trouver votre bourse ?'}
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            {isLoggedIn
              ? 'Votre dossier, vos bourses matchées et vos recommandations IA vous attendent.'
              : "Rejoignez des centaines d'étudiants africains francophones qui ont trouvé leur financement grâce à l'analyse IA de Wekili."}
          </p>
          <button
            onClick={() => navigate(ctaPath)}
            className="bg-[#F5A623] hover:bg-orange-500 text-white font-bold px-10 py-4 text-base uppercase tracking-wider transition-colors"
          >
            {ctaLabel}
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════
          11. FOOTER
      ═══════════════════════════════ */}
      <footer className="bg-[#1a3a6b] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <img src="/logo.svg" alt="Wekili" className="h-12 mb-4" />
            <p className="text-white/60 text-sm leading-relaxed">
              Votre conseiller intelligent pour les études et bourses internationales.
            </p>
            <div className="flex gap-3 mt-4">
              {[
                { l: 'f', label: 'Facebook' },
                { l: 'x', label: 'Twitter'  },
                { l: 'in', label: 'LinkedIn' },
                { l: '▶', label: 'YouTube'  },
              ].map((s) => (
                <a key={s.l} href="#" aria-label={s.label} className="w-8 h-8 bg-white/10 hover:bg-[#F5A623] flex items-center justify-center transition-colors text-sm font-bold">
                  {s.l}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-base mb-4 border-b border-white/20 pb-2">Étudier</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#bourses"      className="hover:text-[#F5A623] transition-colors">Bourses disponibles</a></li>
              <li><a href="#pays"         className="hover:text-[#F5A623] transition-colors">Pays de destination</a></li>
              <li><a href="#comment"      className="hover:text-[#F5A623] transition-colors">Analyse IA</a></li>
              <li><a href="#temoignages"  className="hover:text-[#F5A623] transition-colors">Témoignages</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base mb-4 border-b border-white/20 pb-2">Ressources</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#preparer" className="hover:text-[#F5A623] transition-colors">Guide des candidatures</a></li>
              <li><a href="#etudier"  className="hover:text-[#F5A623] transition-colors">Étudier à l'étranger</a></li>
              <li><a href="#faq"      className="hover:text-[#F5A623] transition-colors">FAQ</a></li>
              <li><a href="#bourses"  className="hover:text-[#F5A623] transition-colors">Lexique des bourses</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base mb-4 border-b border-white/20 pb-2">Aide & Support</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="mailto:contact@wekili.africa" className="hover:text-[#F5A623] transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-[#F5A623] transition-colors">Presse</a></li>
              <li><a href="#" className="hover:text-[#F5A623] transition-colors">Mentions légales</a></li>
              <li><a href="#" className="hover:text-[#F5A623] transition-colors">Confidentialité</a></li>
            </ul>
            <p className="text-white/60 text-sm mt-4">📧 contact@wekili.africa</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <span>© 2026 Wekili — Tous droits réservés</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Accessibilité</a>
              <a href="#" className="hover:text-white transition-colors">Plan du site</a>
              <a href="#" className="hover:text-white transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
