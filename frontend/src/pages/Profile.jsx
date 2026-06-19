import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile, getProfile } from '../services/api';

const ETAPES = [
  { num: 1, label: 'Informations personnelles' },
  { num: 2, label: 'Parcours académique'       },
  { num: 3, label: 'Compétences linguistiques' },
  { num: 4, label: "Projet d'études"           },
];

const NIVEAUX_ETUDES = ['Bac', 'Bac+1', 'Bac+2 (Licence 2)', 'Bac+3 (Licence)', 'Bac+4 (Master 1)', 'Bac+5 (Master)', 'Bac+8 (Doctorat)'];
const DOMAINES = ['Informatique / Numérique', 'Droit', 'Économie / Gestion', 'Médecine / Santé', 'Ingénierie', 'Sciences', 'Lettres / Langues', 'Sciences sociales', 'Architecture', 'Agriculture', 'Autre'];
const LANGUES = ['Français', 'Anglais', 'Allemand', 'Espagnol', 'Portugais', 'Arabe'];
const NIVEAUX_LANGUE = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Langue maternelle'];
const CERTIFICATIONS = ['Aucune', 'DELF/DALF', 'TCF', 'IELTS', 'TOEFL', 'TOEIC', 'TestDaF', 'Autre'];
const PAYS_DESTINATION = ['France', 'Canada', 'Belgique', 'Allemagne', 'Royaume-Uni', 'États-Unis'];
const NIVEAUX_VISES = ['Licence (Bac+3)', 'Master (Bac+5)', 'Doctorat (Bac+8)', 'Diplôme professionnel', 'Classe préparatoire'];
const BUDGETS = ['Moins de 5 000 €/an', '5 000 – 10 000 €/an', '10 000 – 20 000 €/an', 'Plus de 20 000 €/an', 'Bourse uniquement (pas de budget personnel)'];
const PAYS_AFRIQUE = ['Bénin', 'Burkina Faso', "Côte d'Ivoire", 'Cameroun', 'Congo', 'Gabon', 'Guinée', 'Madagascar', 'Mali', 'Mauritanie', 'Niger', 'RDC', 'Rwanda', 'Sénégal', 'Tchad', 'Togo', 'Autre'];

const INIT = {
  // Étape 1
  nationalite: '', pays_residence: '', telephone: '', date_naissance: '',
  // Étape 2
  niveau_etudes: '', domaine: '', etablissement: '', moyenne: '',
  // Étape 3
  langue_principale: '', niveau_langue: '', certification: '',
  langue2: '', niveau_langue2: '',
  // Étape 4
  pays_cibles: [], niveau_vise: '', domaine_vise: '', budget: '',
};

function calcCompletion(form) {
  const champs = [
    'nationalite', 'pays_residence',
    'niveau_etudes', 'domaine', 'etablissement', 'moyenne',
    'langue_principale', 'niveau_langue',
    'niveau_vise', 'domaine_vise', 'budget',
  ];
  const remplis = champs.filter((c) => form[c] && form[c] !== '').length;
  const paysCibles = form.pays_cibles?.length > 0 ? 1 : 0;
  return Math.round(((remplis + paysCibles) / (champs.length + 1)) * 100);
}

function ChampSelect({ label, name, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        name={name} value={value} onChange={onChange}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all appearance-none"
      >
        <option value="">— Sélectionner —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ChampInput({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all placeholder-gray-400"
      />
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    getProfile().then((res) => {
      if (res?.profile) setForm((prev) => ({ ...prev, ...res.profile }));
    }).catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const togglePays = (pays) => {
    const liste = form.pays_cibles.includes(pays)
      ? form.pays_cibles.filter((p) => p !== pays)
      : [...form.pays_cibles, pays];
    setForm({ ...form, pays_cibles: liste });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveProfile(form);
      setSaved(true);
    } catch {
      setError('Erreur de sauvegarde. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    if (etape < 4) setEtape(etape + 1);
    else navigate('/dashboard');
  };

  const completion = calcCompletion(form);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar drawer ── */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full w-64 md:w-56 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progression */}
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">Profil complété</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a3a6b] rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-sm font-bold text-[#1a3a6b]">{completion}%</span>
          </div>
        </div>

        {/* Étapes */}
        <nav className="flex-1 px-3 py-4">
          {ETAPES.map((e) => (
            <button
              key={e.num}
              onClick={() => { setEtape(e.num); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left mb-1 ${
                etape === e.num
                  ? 'bg-[#1a3a6b] text-white'
                  : completion >= (e.num * 25)
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                etape === e.num ? 'bg-white text-[#1a3a6b]' : completion >= (e.num * 25) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {completion >= (e.num * 25) && etape !== e.num
                  ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  : e.num}
              </span>
              <span className="leading-tight">{e.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour au dashboard
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="md:ml-56 flex-1 flex flex-col">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-[#1a3a6b] p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Mon profil</h1>
              <p className="text-xs text-gray-400">Étape {etape} sur 4 — {ETAPES[etape - 1].label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Sauvegardé
              </span>
            )}
            <button
              onClick={handleSave} disabled={saving}
              className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Barre de progression étapes */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
          <div className="flex items-center gap-0 max-w-2xl">
            {ETAPES.map((e, i) => (
              <React.Fragment key={e.num}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    etape > e.num ? 'bg-green-500 text-white' : etape === e.num ? 'bg-[#1a3a6b] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {etape > e.num
                      ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : e.num}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${etape === e.num ? 'text-[#1a3a6b]' : 'text-gray-400'}`}>{e.label}</span>
                </div>
                {i < ETAPES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${etape > e.num ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8 flex-1">
          <div className="max-w-2xl mx-auto">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {/* ══ ÉTAPE 1 ══ */}
            {etape === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Informations personnelles</h2>
                  <p className="text-sm text-gray-400 mt-1">Renseignez vos informations de base.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ChampSelect label="Nationalité" name="nationalite" value={form.nationalite} onChange={handleChange} options={PAYS_AFRIQUE} required />
                  <ChampSelect label="Pays de résidence" name="pays_residence" value={form.pays_residence} onChange={handleChange} options={PAYS_AFRIQUE} required />
                </div>
                <ChampInput label="Téléphone (WhatsApp de préférence)" name="telephone" value={form.telephone} onChange={handleChange} type="tel" placeholder="+229 97 00 00 00" />
                <ChampInput label="Date de naissance" name="date_naissance" value={form.date_naissance} onChange={handleChange} type="date" />
              </div>
            )}

            {/* ══ ÉTAPE 2 ══ */}
            {etape === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Parcours académique</h2>
                  <p className="text-sm text-gray-400 mt-1">Votre niveau et votre établissement actuel.</p>
                </div>
                <ChampSelect label="Niveau d'études actuel" name="niveau_etudes" value={form.niveau_etudes} onChange={handleChange} options={NIVEAUX_ETUDES} required />
                <ChampSelect label="Domaine d'études" name="domaine" value={form.domaine} onChange={handleChange} options={DOMAINES} required />
                <ChampInput label="Établissement / Université" name="etablissement" value={form.etablissement} onChange={handleChange} placeholder="ex. Université d'Abomey-Calavi" required />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Moyenne générale <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" name="moyenne" value={form.moyenne} onChange={handleChange}
                      min="0" max="20" step="0.1" placeholder="ex. 14.5"
                      className="w-36 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                    />
                    <span className="text-sm text-gray-400">/ 20</span>
                    {form.moyenne && (
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        parseFloat(form.moyenne) >= 16 ? 'bg-green-100 text-green-700' :
                        parseFloat(form.moyenne) >= 12 ? 'bg-blue-50 text-blue-700' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {parseFloat(form.moyenne) >= 16 ? 'Excellent' : parseFloat(form.moyenne) >= 14 ? 'Très bien' : parseFloat(form.moyenne) >= 12 ? 'Bien' : 'Passable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ ÉTAPE 3 ══ */}
            {etape === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Compétences linguistiques</h2>
                  <p className="text-sm text-gray-400 mt-1">Vos langues et certifications influencent fortement vos chances.</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Langue principale</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ChampSelect label="Langue" name="langue_principale" value={form.langue_principale} onChange={handleChange} options={LANGUES} required />
                    <ChampSelect label="Niveau" name="niveau_langue" value={form.niveau_langue} onChange={handleChange} options={NIVEAUX_LANGUE} required />
                  </div>
                  <ChampSelect label="Certification obtenue" name="certification" value={form.certification} onChange={handleChange} options={CERTIFICATIONS} />
                </div>

                <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Deuxième langue <span className="text-gray-400 font-normal">(optionnel)</span></p>
                  <div className="grid grid-cols-2 gap-4">
                    <ChampSelect label="Langue" name="langue2" value={form.langue2} onChange={handleChange} options={LANGUES} />
                    <ChampSelect label="Niveau" name="niveau_langue2" value={form.niveau_langue2} onChange={handleChange} options={NIVEAUX_LANGUE} />
                  </div>
                </div>
              </div>
            )}

            {/* ══ ÉTAPE 4 ══ */}
            {etape === 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Projet d'études</h2>
                  <p className="text-sm text-gray-400 mt-1">Définissez votre objectif pour que l'IA puisse vous matcher avec les meilleures bourses.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pays cibles <span className="text-red-400">*</span>
                    <span className="text-gray-400 font-normal ml-2">(plusieurs choix possibles)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAYS_DESTINATION.map((pays) => {
                      const codes = { 'France': 'fr', 'Canada': 'ca', 'Belgique': 'be', 'Allemagne': 'de', 'Royaume-Uni': 'gb', 'États-Unis': 'us' };
                      const isSelected = form.pays_cibles.includes(pays);
                      return (
                        <button
                          key={pays}
                          type="button"
                          onClick={() => togglePays(pays)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#1a3a6b] border-[#1a3a6b] text-white'
                              : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b] hover:text-[#1a3a6b]'
                          }`}
                        >
                          <span className={`fi fi-${codes[pays]} rounded-sm shrink-0`} style={{ display: 'inline-block', width: 20, height: 14 }} />
                          {pays}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <ChampSelect label="Niveau visé" name="niveau_vise" value={form.niveau_vise} onChange={handleChange} options={NIVEAUX_VISES} required />
                <ChampSelect label="Domaine souhaité" name="domaine_vise" value={form.domaine_vise} onChange={handleChange} options={DOMAINES} required />
                <ChampSelect label="Budget disponible pour les études" name="budget" value={form.budget} onChange={handleChange} options={BUDGETS} required />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => etape > 1 ? setEtape(etape - 1) : navigate('/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors px-4 py-2 rounded-xl hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {etape > 1 ? 'Étape précédente' : 'Retour'}
              </button>

              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 bg-[#1a3a6b] hover:bg-[#0f2550] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? 'Sauvegarde...' : etape < 4 ? 'Étape suivante' : 'Terminer et aller au dashboard'}
                {!saving && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
              </button>
            </div>

          </div>
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
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${window.location.pathname === item.path ? 'text-[#1a3a6b]' : 'text-gray-400'}`}>
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
