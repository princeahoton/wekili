import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLogement, upsertLogement, getGuideLogementIA } from '../services/api';
import 'flag-icons/css/flag-icons.min.css';

// ─── Données statiques ────────────────────────────────────────────────────────

const PAYS_FILTRES = ['Tous', 'France', 'Canada', 'Allemagne', 'Royaume-Uni', 'Belgique'];
const FLAG_CODES   = { France: 'fr', Canada: 'ca', Allemagne: 'de', 'Royaume-Uni': 'gb', Belgique: 'be' };

const STATUT_CONFIG = {
  en_recherche:      { label: 'En recherche',          color: 'bg-yellow-100 text-yellow-800' },
  dossier_soumis:    { label: 'Dossier soumis',        color: 'bg-blue-100 text-blue-800' },
  en_attente:        { label: 'En attente',            color: 'bg-purple-100 text-purple-800' },
  visite_planifiee:  { label: 'Visite planifiée',      color: 'bg-orange-100 text-orange-800' },
  logement_confirme: { label: 'Logement confirmé ✓',   color: 'bg-green-100 text-green-800' },
};

const PLATEFORMES = {
  France: [
    { nom: 'CROUS', sous_titre: 'trouverunlogement.lescrous.fr', type: 'Résidence universitaire', cout: '200–400 €/mois', priorite: 'haute', lien: 'https://trouverunlogement.lescrous.fr', conseil: 'Priorité absolue — le moins cher mais places très limitées. Faire la demande dès l\'admission.' },
    { nom: 'ImmoJeune', sous_titre: 'immojeune.com', type: 'Résidences jeunes', cout: '350–600 €/mois', priorite: 'haute', lien: 'https://www.immojeune.com', conseil: 'Bonne alternative au CROUS — résidences modernes et sécurisées' },
    { nom: 'La Carte des Colocs', sous_titre: 'lacartedescolocs.fr', type: 'Colocation', cout: '300–600 €/mois', priorite: 'normale', lien: 'https://www.lacartedescolocs.fr', conseil: 'Idéal pour trouver une colocation entre étudiants' },
    { nom: 'Le Bon Coin', sous_titre: 'leboncoin.fr — Immobilier', type: 'Particuliers', cout: 'Variable', priorite: 'normale', lien: 'https://www.leboncoin.fr/annonces/offres/locations/', conseil: 'Large choix — attention aux annonces frauduleuses, ne jamais payer avant de visiter' },
    { nom: 'PAP', sous_titre: 'pap.fr — Sans agence', type: 'Sans frais d\'agence', cout: 'Variable', priorite: 'normale', lien: 'https://www.pap.fr', conseil: 'Économique — pas de frais d\'agence, direct propriétaire' },
    { nom: 'SeLoger', sous_titre: 'seloger.com', type: 'Agences', cout: 'Variable', priorite: 'normale', lien: 'https://www.seloger.com', conseil: 'Grand catalogue — frais d\'agence souvent à prévoir' },
  ],
  Canada: [
    { nom: 'Résidences universitaires', sous_titre: 'Site de votre université', type: 'Campus', cout: 'CAD 600–1 000/mois', priorite: 'haute', lien: null, conseil: 'Contacter directement le bureau des logements de votre université — places limitées.' },
    { nom: 'Kijiji', sous_titre: 'kijiji.ca', type: 'Annonces locales', cout: 'Variable', priorite: 'haute', lien: 'https://www.kijiji.ca/b-location-appartement', conseil: 'La référence au Canada pour la location entre particuliers' },
    { nom: 'PadMapper', sous_titre: 'padmapper.com', type: 'Agrégateur (carte)', cout: 'Variable', priorite: 'normale', lien: 'https://www.padmapper.com', conseil: 'Toutes les annonces sur une carte — très pratique pour choisir la zone' },
    { nom: 'Facebook Marketplace', sous_titre: 'facebook.com/marketplace', type: 'Particuliers', cout: 'Variable', priorite: 'normale', lien: 'https://www.facebook.com/marketplace', conseil: 'Rejoindre aussi les groupes "Logement étudiant [ville]" sur Facebook' },
    { nom: 'Rentals.ca', sous_titre: 'rentals.ca', type: 'Professionnel', cout: 'Variable', priorite: 'normale', lien: 'https://rentals.ca', conseil: 'Annonces professionnelles vérifiées' },
  ],
  Allemagne: [
    { nom: 'Studentenwerk', sous_titre: 'studentenwerke.de', type: 'Résidence universitaire', cout: '200–400 €/mois', priorite: 'haute', lien: 'https://www.studentenwerke.de/de/wohnen', conseil: '⚠ URGENT : liste d\'attente 6–12 mois. S\'inscrire avant même d\'avoir l\'admission.' },
    { nom: 'WG-Gesucht', sous_titre: 'wg-gesucht.de', type: 'Colocation (WG)', cout: '300–600 €/mois', priorite: 'haute', lien: 'https://www.wg-gesucht.de', conseil: 'LA plateforme de référence pour la colocation en Allemagne — très utilisée' },
    { nom: 'ImmobilienScout24', sous_titre: 'immobilienscout24.de', type: 'Appartements', cout: 'Variable', priorite: 'normale', lien: 'https://www.immobilienscout24.de', conseil: 'Grand portail allemand — appartements entiers' },
    { nom: 'Housinganywhere', sous_titre: 'housinganywhere.com', type: 'International', cout: '400–700 €/mois', priorite: 'normale', lien: 'https://housinganywhere.com', conseil: 'Interface en anglais — idéal pour réserver depuis l\'étranger avant d\'arriver' },
  ],
  'Royaume-Uni': [
    { nom: 'Unite Students', sous_titre: 'unitestudents.com', type: 'Résidences étudiantes', cout: '£600–900/mois', priorite: 'haute', lien: 'https://www.unitestudents.com', conseil: 'Résidences dédiées étudiants — tout inclus, sécurisé, réservable à distance' },
    { nom: 'Student.com', sous_titre: 'student.com', type: 'Résidences internationales', cout: '£500–900/mois', priorite: 'haute', lien: 'https://www.student.com', conseil: 'Spécialisé étudiants internationaux — site en français disponible' },
    { nom: 'SpareRoom', sous_titre: 'spareroom.co.uk', type: 'Colocation', cout: '£400–700/mois', priorite: 'normale', lien: 'https://www.spareroom.co.uk', conseil: 'Colocation avec des locaux — moins cher que les résidences' },
    { nom: 'Zoopla', sous_titre: 'zoopla.co.uk', type: 'Agences + particuliers', cout: 'Variable', priorite: 'normale', lien: 'https://www.zoopla.co.uk', conseil: 'Grand portail — filtrer "student friendly"' },
  ],
  Belgique: [
    { nom: 'Kotplanet', sous_titre: 'kotplanet.be', type: 'Kots étudiants', cout: '300–600 €/mois', priorite: 'haute', lien: 'https://www.kotplanet.be', conseil: 'Référence belge pour les kots (chambres meublées chez particuliers)' },
    { nom: 'Webkot', sous_titre: 'webkot.be', type: 'Kots étudiants', cout: '300–600 €/mois', priorite: 'haute', lien: 'https://www.webkot.be', conseil: 'Autre référence belge pour les kots avec photos et avis' },
    { nom: 'Immoweb', sous_titre: 'immoweb.be', type: 'Agences + particuliers', cout: 'Variable', priorite: 'normale', lien: 'https://www.immoweb.be', conseil: 'Grand portail belge pour studios et appartements' },
  ],
};

const AIDES = {
  France: [
    { nom: 'CAF — APL / ALS', montant: 'Jusqu\'à 200 €/mois', lien: 'https://www.caf.fr', conseil: 'Faire la demande dès la signature du bail. Remboursement rétroactif possible.' },
    { nom: 'Visale (garant gratuit)', montant: 'Garantie gratuite Action Logement', lien: 'https://www.visale.fr', conseil: 'Essentiel si pas de garant physique en France — gratuit et reconnu par tous les propriétaires.' },
    { nom: 'Avance LOCA-PASS', montant: 'Avance dépôt de garantie (sans intérêts)', lien: 'https://www.actionlogement.fr', conseil: 'Couvre le dépôt de garantie si fonds insuffisants — à rembourser progressivement.' },
  ],
  Canada: [
    { nom: 'Aide financière universitaire', montant: 'Variable selon université', lien: null, conseil: 'Contacter le bureau d\'aide financière de votre université — certaines aident pour le logement.' },
  ],
  Allemagne: [
    { nom: 'Studentenwerk — logement social', montant: '200–350 €/mois', lien: 'https://www.studentenwerke.de', conseil: 'S\'inscrire très tôt — le Studentenwerk gère les résidences les moins chères.' },
  ],
  'Royaume-Uni': [
    { nom: 'Bursaries et bourses universitaires', montant: 'Variable', lien: null, conseil: 'Contacter le bureau financier de votre université pour les aides internes au logement.' },
  ],
  Belgique: [
    { nom: 'CPAS étudiant', montant: 'Variable selon commune', lien: 'https://www.cpas.be', conseil: 'Aide sociale possible pour étudiants en difficulté — contacter le CPAS de votre commune.' },
  ],
};

const BUDGET_VILLES = {
  Paris: { loyer_min: 600, loyer_max: 1100, charges: 100, vie: 500 },
  Lyon: { loyer_min: 450, loyer_max: 750, charges: 80, vie: 400 },
  Bordeaux: { loyer_min: 420, loyer_max: 700, charges: 75, vie: 380 },
  Toulouse: { loyer_min: 400, loyer_max: 680, charges: 75, vie: 380 },
  Montpellier: { loyer_min: 380, loyer_max: 650, charges: 70, vie: 370 },
  Strasbourg: { loyer_min: 390, loyer_max: 660, charges: 80, vie: 380 },
  Rennes: { loyer_min: 360, loyer_max: 600, charges: 65, vie: 350 },
  Lille: { loyer_min: 380, loyer_max: 640, charges: 75, vie: 360 },
  Berlin: { loyer_min: 600, loyer_max: 950, charges: 120, vie: 450 },
  Munich: { loyer_min: 800, loyer_max: 1300, charges: 150, vie: 550 },
  Hambourg: { loyer_min: 650, loyer_max: 1050, charges: 130, vie: 480 },
  Montréal: { loyer_min: 700, loyer_max: 1100, charges: 100, vie: 500, note: 'CAD' },
  Toronto: { loyer_min: 1000, loyer_max: 1700, charges: 150, vie: 600, note: 'CAD' },
  Londres: { loyer_min: 900, loyer_max: 1800, charges: 150, vie: 600, note: '£' },
  Manchester: { loyer_min: 600, loyer_max: 950, charges: 100, vie: 450, note: '£' },
  Bruxelles: { loyer_min: 500, loyer_max: 900, charges: 100, vie: 450 },
};

const CHECKLIST = [
  { id: 1, groupe: 'Avant de chercher',   titre: 'Définir la ville et le budget mensuel', detail: 'Loyer + charges + vie courante + transport' },
  { id: 2, groupe: 'Avant de chercher',   titre: 'Choisir le type de logement adapté', detail: 'CROUS (France), Studentenwerk (Allemagne), kots (Belgique)…' },
  { id: 3, groupe: 'Dossier de location', titre: 'Préparer les justificatifs', detail: 'Pièce d\'identité, lettre d\'admission, justificatif de ressources, garant' },
  { id: 4, groupe: 'Dossier de location', titre: 'Obtenir un garant ou Visale (France)', detail: 'Visale.fr offre un garant gratuit — essentiel pour étudiants étrangers en France' },
  { id: 5, groupe: 'Recherche active',    titre: 'S\'inscrire sur CROUS / Studentenwerk', detail: 'France : lescrous.fr — Allemagne : 6–12 mois de délai, s\'inscrire MAINTENANT' },
  { id: 6, groupe: 'Recherche active',    titre: 'Créer des profils sur les plateformes', detail: 'Utiliser les liens listés ci-dessus pour votre pays de destination' },
  { id: 7, groupe: 'Recherche active',    titre: 'Postuler à plusieurs annonces en parallèle', detail: 'Ne pas attendre une réponse — envoyer plusieurs candidatures simultanément' },
  { id: 8, groupe: 'Visite & signature',  titre: 'Visiter à distance (vidéo) ou en personne', detail: 'Demander une visite virtuelle si encore à l\'étranger — standard accepté' },
  { id: 9, groupe: 'Visite & signature',  titre: 'Signer le bail et payer la caution', detail: 'Garder une copie de tout — faire un état des lieux d\'entrée détaillé' },
  { id: 10, groupe: 'Après signature',    titre: 'Demander la CAF / aide au logement', detail: 'France : caf.fr — à faire dès le mois suivant la signature du bail' },
  { id: 11, groupe: 'Après signature',    titre: 'Souscrire à une assurance habitation', detail: 'Obligatoire en France — 8–15 €/mois (AXA, Maif, LUKO…)' },
  { id: 12, groupe: 'Après signature',    titre: 'Ouvrir les compteurs (élec, internet)', detail: 'Selon bail — souvent inclus dans les charges en colocation' },
];

// ─── Composants ────────────────────────────────────────────────────────────────

function CartePlateforme({ p, onOpen }) {
  return (
    <div
      onClick={() => p.lien && onOpen(p.lien)}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-[#1a3a6b]/20 ${p.lien ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-800 text-sm">{p.nom}</h3>
            {p.priorite === 'haute' && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Prioritaire</span>
            )}
          </div>
          <p className="text-xs text-gray-400">{p.sous_titre}</p>
          <p className="text-xs text-gray-500 mt-0.5">{p.type}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#1a3a6b]">{p.cout}</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl px-3 py-2">
        <p className="text-xs text-blue-800">{p.conseil}</p>
      </div>

      {p.lien && (
        <div className="flex justify-end">
          <span className="text-xs font-semibold text-[#1a3a6b] hover:underline">Ouvrir le site →</span>
        </div>
      )}
    </div>
  );
}

function CarteAide({ a }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 text-base">💰</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm text-gray-800">{a.nom}</p>
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">{a.montant}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{a.conseil}</p>
        {a.lien && (
          <a href={a.lien} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-[#1a3a6b] font-semibold hover:underline">
            Voir le site →
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Modal Guide IA ──────────────────────────────────────────────────────────

function GuideModal({ guide, onClose }) {
  if (!guide) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="font-bold">Guide Logement IA</h2>
              <p className="text-violet-200 text-xs mt-0.5">Recommandations personnalisées</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {guide.analyse_budget && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-semibold text-sm text-gray-800">{guide.analyse_budget.evaluation} — {guide.analyse_budget.budget}</p>
              <p className="text-xs text-gray-600 mt-1">{guide.analyse_budget.conseil}</p>
            </div>
          )}
          {guide.options?.map((opt, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-sm text-gray-900">{opt.type}</p>
                <p className="text-sm font-bold text-[#1a3a6b]">{opt.cout_mensuel}</p>
              </div>
              {opt.avantages?.map((a, j) => <p key={j} className="text-xs text-gray-600">✓ {a}</p>)}
              {opt.timing && <p className="text-xs text-orange-600 font-semibold mt-2">⏰ {opt.timing}</p>}
            </div>
          ))}
          {guide.checklist_logement?.map((item, i) => (
            <p key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-[#1a3a6b]">→</span>{item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Logement() {
  const navigate = useNavigate();

  const [logement, setLogement]       = useState(null);
  const [pays, setPays]               = useState('France');
  const [villeInput, setVilleInput]   = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [statutInput, setStatutInput] = useState('en_recherche');
  const [dirty, setDirty]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [loadingIA, setLoadingIA]     = useState(false);
  const [guideIA, setGuideIA]         = useState(null);
  const [guideModal, setGuideModal]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getLogement().then(res => {
      if (res.logement) {
        const l = res.logement;
        setLogement(l);
        if (l.pays_destination)  setPays(l.pays_destination);
        if (l.ville_destination) setVilleInput(l.ville_destination);
        if (l.budget_mensuel)    setBudgetInput(String(l.budget_mensuel));
        if (l.statut)            setStatutInput(l.statut);
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await upsertLogement({
        pays_destination: pays,
        ville_destination: villeInput,
        budget_mensuel: budgetInput ? Number(budgetInput) : null,
        statut: statutInput,
        completed_steps: logement?.completed_steps || [],
      });
      if (res.logement) { setLogement(res.logement); setDirty(false); }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStep = async (id) => {
    const current = Array.isArray(logement?.completed_steps) ? logement.completed_steps : [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    const res = await upsertLogement({ completed_steps: next, pays_destination: pays });
    if (res.logement) setLogement(res.logement);
  };

  const handleGuideIA = async () => {
    setLoadingIA(true);
    try {
      const res = await getGuideLogementIA();
      if (res.guide)   { setGuideIA(res.guide); setGuideModal(true); }
      if (res.message) alert(res.message);
    } catch { alert('Erreur de génération. Sauvegardez votre ville d\'abord.'); }
    finally { setLoadingIA(false); }
  };

  const mark = (field) => { setDirty(true); return field; };

  const plateformes = PLATEFORMES[pays] || [];
  const aides       = AIDES[pays]       || [];
  const budget      = BUDGET_VILLES[villeInput] || null;
  const completedSteps = Array.isArray(logement?.completed_steps) ? logement.completed_steps : [];
  const checkDone = completedSteps.length;

  const nbParPays = (p) => (PLATEFORMES[p] || []).length;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full w-64 md:w-56 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <a href="/dashboard">
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2 tracking-wider">DESTINATION</p>
          {PAYS_FILTRES.map(p => (
            <button
              key={p}
              onClick={() => { setPays(p === 'Tous' ? 'France' : p); setDirty(true); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left mb-0.5 ${
                (p === 'Tous' ? pays : p) === pays || (p === 'Tous' && false)
                  ? 'bg-[#1a3a6b] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p !== 'Tous' && FLAG_CODES[p] && (
                <span className={`fi fi-${FLAG_CODES[p]} rounded-sm shrink-0`} style={{ display: 'inline-block', width: 18, height: 13 }} />
              )}
              <span>{p === 'Tous' ? 'Tous les pays' : p}</span>
              {p !== 'Tous' && (
                <span className={`ml-auto text-xs ${p === pays ? 'text-white/70' : 'text-gray-400'}`}>
                  {nbParPays(p)}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour au dashboard
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <main className="md:ml-56 flex-1">

        {/* Topbar sticky */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-[#1a3a6b] p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  🏠 Logement
                  {FLAG_CODES[pays] && <span className={`fi fi-${FLAG_CODES[pays]} rounded-sm`} style={{ display: 'inline-block', width: 20, height: 15 }} />}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {plateformes.length} plateforme(s) · {aides.length} aide(s) · {CHECKLIST.length} étapes checklist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Ville */}
              <input
                type="text"
                value={villeInput}
                onChange={e => { setVilleInput(e.target.value); mark('ville'); }}
                placeholder="Votre ville"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] w-36"
              />
              {/* Budget */}
              <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 gap-1 w-32 focus-within:border-[#1a3a6b]">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={e => { setBudgetInput(e.target.value); mark('budget'); }}
                  placeholder="Budget"
                  className="flex-1 outline-none text-sm placeholder-gray-400 bg-transparent w-16"
                />
                <span className="text-xs text-gray-400">€/mois</span>
              </div>
              {/* Statut */}
              <select
                value={statutInput}
                onChange={e => { setStatutInput(e.target.value); mark('statut'); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white"
              >
                {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              {/* Sauvegarder */}
              {dirty && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1a3a6b] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              )}
              {/* Guide IA */}
              <button
                onClick={handleGuideIA}
                disabled={loadingIA}
                className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {loadingIA
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Génération…</>
                  : '✨ Guide IA'
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Contenu scrollable ─────────────────────────────────── */}
        <div className="px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-6 space-y-8">

          {/* Statut actuel (si sauvegardé) */}
          {logement?.ville_destination && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center">
                  {FLAG_CODES[logement.pays_destination] && (
                    <span className={`fi fi-${FLAG_CODES[logement.pays_destination]} rounded-sm`} style={{ display: 'inline-block', width: 20, height: 15 }} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{logement.ville_destination}, {logement.pays_destination}</p>
                  {logement.budget_mensuel && <p className="text-xs text-gray-500">Budget loyer : {logement.budget_mensuel} €/mois</p>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUT_CONFIG[logement.statut]?.color || 'bg-gray-100 text-gray-700'}`}>
                {STATUT_CONFIG[logement.statut]?.label || logement.statut}
              </span>
              {logement.date_arrivee && (
                <span className="text-xs text-gray-500">
                  Arrivée : {new Date(logement.date_arrivee).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              )}
              <div className="ml-auto text-xs text-gray-400">
                Checklist : {checkDone}/{CHECKLIST.length} étapes
              </div>
            </div>
          )}

          {/* ── Section plateformes ─────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  🔗 Plateformes recommandées
                  {FLAG_CODES[pays] && <span className={`fi fi-${FLAG_CODES[pays]} rounded-sm`} style={{ display: 'inline-block', width: 18, height: 13 }} />}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Les meilleures plateformes pour trouver un logement en {pays}</p>
              </div>
            </div>

            {plateformes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-sm text-yellow-800">
                Sélectionnez un pays dans la barre latérale pour voir les plateformes.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {plateformes.map((p, i) => (
                  <CartePlateforme
                    key={i}
                    p={p}
                    onOpen={lien => window.open(lien, '_blank', 'noopener,noreferrer')}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Section aides ──────────────────────────────────── */}
          {aides.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                💡 Aides financières disponibles en {pays}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {aides.map((a, i) => <CarteAide key={i} a={a} />)}
              </div>
            </section>
          )}

          {/* ── Section budget ─────────────────────────────────── */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 Estimation du budget mensuel
              {villeInput && <span className="text-sm font-normal text-gray-500">— {villeInput}</span>}
            </h2>

            {budget ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {[
                      { label: 'Loyer (chambre / colocation)', min: budget.loyer_min, max: budget.loyer_max, color: 'bg-[#1a3a6b]' },
                      { label: 'Charges (eau, élec, internet)', min: budget.charges, max: budget.charges, color: 'bg-blue-400' },
                      { label: 'Vie courante (nourriture, transport)', min: budget.vie, max: budget.vie, color: 'bg-cyan-400' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${row.color} flex-shrink-0`}></div>
                        <div className="flex-1 flex justify-between text-sm">
                          <span className="text-gray-600">{row.label}</span>
                          <span className="font-semibold text-gray-900">
                            {row.min === row.max ? `${row.min}` : `${row.min}–${row.max}`} {budget.note || '€'}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total / mois</span>
                      <span className="font-bold text-lg text-[#1a3a6b]">
                        {budget.loyer_min + budget.charges + budget.vie}–{budget.loyer_max + budget.charges + budget.vie} {budget.note || '€'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                    <p className="font-bold text-gray-800 mb-3">Frais à prévoir à l'arrivée</p>
                    {pays === 'France' && <>
                      <div className="flex justify-between"><span className="text-gray-600">Dépôt de garantie</span><span className="font-semibold">1 mois de loyer</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">1er mois loyer</span><span className="font-semibold">Selon annonce</span></div>
                      <div className="flex justify-between text-green-700"><span>— CAF (aide mensuelle)</span><span className="font-semibold">-50 à -200 €/mois</span></div>
                    </>}
                    {pays === 'Allemagne' && <>
                      <div className="flex justify-between"><span className="text-gray-600">Kaution (dépôt)</span><span className="font-semibold">2–3 mois de loyer</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Frais d'agence</span><span className="font-semibold text-green-700">0 € (interdit)</span></div>
                    </>}
                    {pays === 'Royaume-Uni' && <>
                      <div className="flex justify-between"><span className="text-gray-600">Caution</span><span className="font-semibold">5 semaines de loyer</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Healthcare Surcharge</span><span className="font-semibold">~776 £/an</span></div>
                    </>}
                    {pays === 'Canada' && (
                      <div className="flex justify-between"><span className="text-gray-600">Dépôt (selon province)</span><span className="font-semibold">0 à 1 mois</span></div>
                    )}
                    {pays === 'Belgique' && (
                      <div className="flex justify-between"><span className="text-gray-600">Caution kot</span><span className="font-semibold">2 mois de loyer</span></div>
                    )}
                    {budgetInput && (
                      <div className={`mt-3 p-2 rounded-lg text-xs font-semibold ${Number(budgetInput) >= budget.loyer_min ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        Votre budget ({budgetInput} €) {Number(budgetInput) >= budget.loyer_min ? 'est compatible' : `est en dessous du minimum (${budget.loyer_min} €)`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">
                {villeInput
                  ? `Données de budget non disponibles pour "${villeInput}". Essayez : Paris, Lyon, Berlin, Montréal, Londres, Bruxelles…`
                  : 'Entrez votre ville de destination dans la barre en haut pour voir l\'estimation.'}
              </div>
            )}
          </section>

          {/* ── Section checklist ─────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">✅ Ma checklist logement</h2>
              <span className="text-sm font-bold text-[#1a3a6b]">{checkDone} / {CHECKLIST.length} étapes</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gray-100">
                <div
                  className="h-full bg-[#1a3a6b] transition-all duration-500"
                  style={{ width: `${CHECKLIST.length === 0 ? 0 : Math.round((checkDone / CHECKLIST.length) * 100)}%` }}
                />
              </div>
              {['Avant de chercher', 'Dossier de location', 'Recherche active', 'Visite & signature', 'Après signature'].map(groupe => {
                const items = CHECKLIST.filter(it => it.groupe === groupe);
                return (
                  <div key={groupe}>
                    <div className="bg-gray-50 px-5 py-2 border-b border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{groupe}</p>
                    </div>
                    {items.map(item => {
                      const done = completedSteps.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleToggleStep(item.id)}
                          className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${done ? 'bg-[#1a3a6b] border-[#1a3a6b]' : 'border-gray-300'}`}>
                            {done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.titre}</p>
                            <p className={`text-xs mt-0.5 ${done ? 'text-gray-300' : 'text-gray-500'}`}>{item.detail}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* ── Bottom nav mobile ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40">
        <div className="flex justify-around max-w-lg mx-auto">
          {[
            { path: '/dashboard',    label: 'Accueil',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { path: '/bourses',      label: 'Bourses',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
            { path: '/logement',     label: 'Logement',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { path: '/analysis',     label: 'Analyse',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
            { path: '/profile',      label: 'Profil',     icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${location.pathname === item.path ? 'text-[#1a3a6b]' : 'text-gray-400 hover:text-gray-600'}`}>
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {guideModal && guideIA && <GuideModal guide={guideIA} onClose={() => setGuideModal(false)} />}
    </div>
  );
}
