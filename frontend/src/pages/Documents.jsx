import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, getDocuments, deleteDocument, requestDocAccess, verifyDocAccess } from '../services/api';
import { getUser } from '../utils/auth';

const DOCS_REQUIS = [
  {
    type: 'cv',
    label: 'Curriculum Vitae',
    description: 'Votre CV académique et professionnel',
    formats: ['PDF', 'DOCX'],
    maxMo: 5,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    type: 'releves',
    label: 'Relevés de notes',
    description: 'Bulletins des 2-3 dernières années',
    formats: ['PDF', 'JPG', 'PNG'],
    maxMo: 10,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    type: 'diplome',
    label: 'Diplômes et attestations',
    description: 'Diplôme du Bac et diplômes supérieurs',
    formats: ['PDF', 'JPG', 'PNG'],
    maxMo: 10,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    type: 'langue',
    label: 'Attestation de langue',
    description: 'DELF, DALF, IELTS, TOEFL, TestDaF...',
    formats: ['PDF'],
    maxMo: 5,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    type: 'motivation',
    label: 'Lettre de motivation',
    description: 'Votre lettre de motivation principale',
    formats: ['PDF', 'DOCX'],
    maxMo: 5,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    type: 'recommandation',
    label: 'Lettre de recommandation',
    description: "D'un professeur ou employeur",
    formats: ['PDF'],
    maxMo: 5,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const STATUT_CONFIG = {
  'en_attente':  { label: 'En attente',         bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
  'uploading':   { label: 'Envoi en cours...',   bg: 'bg-blue-50',    text: 'text-blue-600',   dot: 'bg-blue-400'   },
  'en_cours':    { label: "En cours d'analyse",  bg: 'bg-orange-50',  text: 'text-orange-600', dot: 'bg-orange-400' },
  'analyse':     { label: 'Analysé',             bg: 'bg-green-50',   text: 'text-green-600',  dot: 'bg-green-400'  },
  'erreur':      { label: 'Erreur',              bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-400'    },
};

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function ZoneUpload({ doc, fichier, onUpload, onDelete, uploading }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(doc.type, file);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(doc.type, file);
    e.target.value = '';
  };

  const statut = uploading ? 'uploading' : fichier?.statut || 'en_attente';
  const cfg = STATUT_CONFIG[statut];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${fichier ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#1a3a6b]'}`}>
              {fichier
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                : doc.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{doc.label}</p>
              <p className="text-xs text-gray-400">{doc.description}</p>
            </div>
          </div>

          {/* Badge statut */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${statut === 'uploading' || statut === 'en_cours' ? 'animate-pulse' : ''}`} />
            {cfg.label}
          </span>
        </div>

        {/* Fichier uploadé */}
        {fichier && statut !== 'uploading' ? (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-[#1a3a6b]/10 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{fichier.nom_fichier || 'Document'}</p>
                <p className="text-xs text-gray-400">{formatSize(fichier.taille)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="text-xs text-[#1a3a6b] hover:underline font-medium"
              >
                Remplacer
              </button>
              <button
                onClick={() => onDelete(fichier.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Zone drag-and-drop */
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              uploading ? 'opacity-50 cursor-not-allowed' :
              drag ? 'border-[#1a3a6b] bg-blue-50' : 'border-gray-200 hover:border-[#1a3a6b] hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500">Envoi en cours...</p>
              </div>
            ) : (
              <>
                <svg className={`w-7 h-7 mx-auto mb-2 ${drag ? 'text-[#1a3a6b]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-[#1a3a6b]">Cliquez</span> ou glissez votre fichier ici
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {doc.formats.join(', ')} — max {doc.maxMo} Mo
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" className="hidden" onChange={handleFile}
        accept={doc.formats.map(f => f === 'PDF' ? '.pdf' : f === 'DOCX' ? '.docx' : f === 'JPG' ? '.jpg,.jpeg' : '.png').join(',')}
      />
    </div>
  );
}

export default function Documents() {
  const navigate = useNavigate();
  const [docs, setDocs]           = useState({});
  const [uploading, setUploading] = useState({});
  const [erreurs, setErreurs]     = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Portail d'accès sécurisé ──────────────────────────────────────────
  const [accessGranted, setAccessGranted] = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('doc_access') || 'null');
      return s && Date.now() < s.expiresAt;
    } catch { return false; }
  });
  const [gateStep, setGateStep]   = useState('idle'); // idle|sending|sent|verifying
  const [gateCode, setGateCode]   = useState('');
  const [gateError, setGateError] = useState('');

  const grantAccess = () => {
    sessionStorage.setItem('doc_access', JSON.stringify({ expiresAt: Date.now() + 30 * 60 * 1000 }));
    setAccessGranted(true);
  };

  const handleRequestCode = async () => {
    setGateStep('sending'); setGateError('');
    try {
      const res = await requestDocAccess();
      if (res.success) setGateStep('sent');
      else { setGateError(res.message || 'Erreur lors de l\'envoi.'); setGateStep('idle'); }
    } catch { setGateError('Erreur de connexion.'); setGateStep('idle'); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setGateStep('verifying'); setGateError('');
    try {
      const res = await verifyDocAccess(gateCode);
      if (res.success) grantAccess();
      else { setGateError(res.message || 'Code incorrect ou expiré.'); setGateStep('sent'); }
    } catch { setGateError('Erreur de connexion.'); setGateStep('sent'); }
  };

  useEffect(() => {
    const u = getUser();
    if (!u) { navigate('/login'); return; }
    setCurrentUser(u);
    if (accessGranted) chargerDocs();
  }, [navigate, accessGranted]);

  const chargerDocs = async () => {
    try {
      const res = await getDocuments();
      if (res?.documents) {
        const map = {};
        res.documents.forEach((d) => { map[d.type] = d; });
        setDocs(map);
      }
    } catch {}
  };

  const handleUpload = async (type, file) => {
    const doc = DOCS_REQUIS.find((d) => d.type === type);
    if (file.size > doc.maxMo * 1024 * 1024) {
      setErreurs((prev) => ({ ...prev, [type]: `Fichier trop lourd (max ${doc.maxMo} Mo)` }));
      return;
    }
    setErreurs((prev) => ({ ...prev, [type]: null }));
    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const res = await uploadDocument(type, file);
      if (res?.document) {
        setDocs((prev) => ({ ...prev, [type]: res.document }));
      } else if (res?.message) {
        await chargerDocs();
      }
    } catch {
      setErreurs((prev) => ({ ...prev, [type]: "Erreur d'upload. Réessayez." }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      await chargerDocs();
    } catch {}
  };

  const nbUploades = Object.keys(docs).length;
  const nbTotal = DOCS_REQUIS.length;
  const pct = Math.round((nbUploades / nbTotal) * 100);

  // ── Portail de vérification ───────────────────────────────────────────
  if (currentUser && !accessGranted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">

        {/* Shield icon */}
        <div className="w-14 h-14 bg-[#1a3a6b]/10 rounded-2xl flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-1">Espace Documents sécurisé</h2>
        <p className="text-sm text-gray-500 mb-6">Pour accéder à vos documents sensibles (diplômes, passeport, CV…), une vérification supplémentaire est requise.</p>

        {/* Engagements sécurité */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 space-y-2">
          {[
            'Vos documents sont chiffrés et stockés sur des serveurs sécurisés',
            'Accès limité à votre seul compte et aux services Wekili',
            'Aucune donnée ne sera partagée sans votre consentement',
          ].map(t => (
            <div key={t} className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <p className="text-xs text-blue-700">{t}</p>
            </div>
          ))}
        </div>

        {gateStep === 'idle' && (
          <button onClick={handleRequestCode}
            className="w-full bg-[#1a3a6b] hover:bg-[#0f2550] text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Envoyer un code par email
          </button>
        )}

        {gateStep === 'sending' && (
          <div className="w-full bg-[#1a3a6b]/60 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Envoi en cours…
          </div>
        )}

        {(gateStep === 'sent' || gateStep === 'verifying') && (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Code envoyé à <strong>{currentUser.email}</strong>
            </p>
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
              value={gateCode} onChange={e => setGateCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Code à 6 chiffres" required autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-widest outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
            />
            <button type="submit" disabled={gateCode.length !== 6 || gateStep === 'verifying'}
              className="w-full bg-[#1a3a6b] hover:bg-[#0f2550] text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {gateStep === 'verifying' ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Vérification…</>
              ) : 'Accéder à mes documents →'}
            </button>
            <button type="button" onClick={() => { setGateStep('idle'); setGateCode(''); setGateError(''); }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1">
              Renvoyer un code
            </button>
          </form>
        )}

        {gateError && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {gateError}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
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

        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">Documents uploadés</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#F5A623] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-[#F5A623]">{nbUploades}/{nbTotal}</span>
          </div>
          <p className="text-xs text-gray-400">{nbUploades === nbTotal ? 'Tous les documents sont prêts ✓' : `${nbTotal - nbUploades} document(s) manquant(s)`}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {DOCS_REQUIS.map((doc) => {
            const uploaded = !!docs[doc.type];
            return (
              <div key={doc.type} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${uploaded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {uploaded
                    ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  }
                </span>
                <span className={`text-xs font-medium leading-tight ${uploaded ? 'text-gray-700' : 'text-gray-400'}`}>{doc.label}</span>
              </div>
            );
          })}
        </nav>

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
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-[#1a3a6b] p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Mes documents</h1>
              <p className="text-xs text-gray-400">Déposez vos fichiers — ils seront analysés par l'IA</p>
            </div>
          </div>
          {nbUploades === nbTotal && (
            <button
              onClick={() => navigate('/analysis')}
              className="bg-[#1a3a6b] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0f2550] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Lancer l'analyse IA →
            </button>
          )}
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8">

          {/* Bannière info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3 mb-8">
            <svg className="w-5 h-5 text-[#1a3a6b] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#1a3a6b]">Comment ça marche ?</p>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Déposez vos documents ci-dessous. L'IA les analyse automatiquement pour calculer votre score et identifier les bourses auxquelles vous êtes éligible. Plus votre dossier est complet, plus l'analyse sera précise.
              </p>
            </div>
          </div>

          {/* Grille documents */}
          <div className="grid grid-cols-2 gap-5">
            {DOCS_REQUIS.map((doc) => (
              <div key={doc.type}>
                <ZoneUpload
                  doc={doc}
                  fichier={docs[doc.type]}
                  onUpload={handleUpload}
                  onDelete={handleDelete}
                  uploading={!!uploading[doc.type]}
                />
                {erreurs[doc.type] && (
                  <p className="text-xs text-red-500 mt-1.5 px-1">{erreurs[doc.type]}</p>
                )}
              </div>
            ))}
          </div>

          {/* CTA bas de page */}
          {nbUploades > 0 && nbUploades < nbTotal && (
            <div className="mt-8 bg-[#1a3a6b] rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Vous pouvez déjà lancer une analyse partielle</p>
                <p className="text-blue-200 text-sm mt-0.5">{nbUploades} document(s) déposé(s) — l'analyse sera plus précise avec tous les documents</p>
              </div>
              <button
                onClick={() => navigate('/analysis')}
                className="bg-white text-[#1a3a6b] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shrink-0 ml-6"
              >
                Analyser quand même →
              </button>
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
