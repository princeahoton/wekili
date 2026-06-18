import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Section({ titre, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <h2 className="text-base font-bold text-gray-800">{titre}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Champ({ label, name, type = 'text', value, onChange, placeholder, description }) {
  return (
    <div className="flex items-start gap-6 py-4 border-b border-gray-50 last:border-0">
      <div className="w-40 shrink-0">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all placeholder-gray-400"
      />
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#1a3a6b]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [infos, setInfos] = useState({ prenom: '', nom: '', email: '', telephone: '' });
  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmer: '' });
  const [notifs, setNotifs] = useState({
    email_bourses: true,
    email_deadlines: true,
    email_analyse: true,
    email_conseils: false,
  });
  const [errMdp, setErrMdp] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const u = JSON.parse(userData);
    setUser(u);
    setInfos({ prenom: u.prenom || '', nom: u.nom || '', email: u.email || '', telephone: u.telephone || '' });
  }, [navigate]);

  const handleSaveInfos = (e) => {
    e.preventDefault();
    const updated = { ...user, ...infos };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangeMdp = (e) => {
    e.preventDefault();
    setErrMdp('');
    if (mdp.nouveau.length < 8) { setErrMdp('Le mot de passe doit faire au moins 8 caractères.'); return; }
    if (mdp.nouveau !== mdp.confirmer) { setErrMdp('Les mots de passe ne correspondent pas.'); return; }
    setMdp({ actuel: '', nouveau: '', confirmer: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <a href="/dashboard">
            <img src="/logo.svg" alt="Wekili" className="h-9 w-auto" />
          </a>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { label: 'Informations personnelles', href: '#infos' },
            { label: 'Mot de passe',              href: '#mdp'   },
            { label: 'Notifications',             href: '#notifs'},
            { label: 'Confidentialité',           href: '#rgpd'  },
            { label: 'Compte',                    href: '#compte'},
          ].map((item) => (
            <a key={item.label} href={item.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1a3a6b] transition-all font-medium">
              {item.label}
            </a>
          ))}
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
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Paramètres</h1>
            <p className="text-xs text-gray-400">Gérez votre compte et vos préférences</p>
          </div>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Modifications enregistrées
            </span>
          )}
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-2xl space-y-6">

          {/* ── Informations personnelles ── */}
          <div id="infos">
            <Section titre="Informations personnelles" description="Vos informations de base affichées sur votre compte">
              <form onSubmit={handleSaveInfos}>
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                  <div className="w-16 h-16 bg-[#1a3a6b] rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
                    {infos.prenom?.[0]}{infos.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{infos.prenom} {infos.nom}</p>
                    <p className="text-xs text-gray-400">{infos.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Candidat Wekili</p>
                  </div>
                </div>

                <div className="flex gap-4 py-4 border-b border-gray-50">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                    <input type="text" value={infos.prenom} onChange={(e) => setInfos({ ...infos, prenom: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
                    <input type="text" value={infos.nom} onChange={(e) => setInfos({ ...infos, nom: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all" />
                  </div>
                </div>

                <Champ label="Adresse e-mail" name="email" type="email" value={infos.email}
                  onChange={(e) => setInfos({ ...infos, email: e.target.value })}
                  placeholder="exemple@email.com" description="Utilisé pour la connexion" />

                <Champ label="Téléphone" name="telephone" type="tel" value={infos.telephone}
                  onChange={(e) => setInfos({ ...infos, telephone: e.target.value })}
                  placeholder="+229 97 00 00 00" description="WhatsApp de préférence" />

                <div className="flex justify-end mt-4">
                  <button type="submit" className="bg-[#1a3a6b] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#0f2550] transition-colors">
                    Enregistrer
                  </button>
                </div>
              </form>
            </Section>
          </div>

          {/* ── Mot de passe ── */}
          <div id="mdp">
            <Section titre="Mot de passe" description="Modifiez votre mot de passe de connexion">
              <form onSubmit={handleChangeMdp} className="space-y-0">
                {[
                  { label: 'Mot de passe actuel',    key: 'actuel',    placeholder: '••••••••'               },
                  { label: 'Nouveau mot de passe',   key: 'nouveau',   placeholder: 'Minimum 8 caractères'   },
                  { label: 'Confirmer le mot passe', key: 'confirmer', placeholder: 'Répétez le mot de passe' },
                ].map((f) => (
                  <div key={f.key} className="flex items-center gap-6 py-4 border-b border-gray-50 last:border-0">
                    <label className="w-40 text-sm font-semibold text-gray-700 shrink-0">{f.label}</label>
                    <input
                      type="password" value={mdp[f.key]} placeholder={f.placeholder}
                      onChange={(e) => setMdp({ ...mdp, [f.key]: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all placeholder-gray-400"
                    />
                  </div>
                ))}
                {errMdp && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5 mt-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {errMdp}
                  </p>
                )}
                <div className="flex justify-end mt-4">
                  <button type="submit" className="bg-[#1a3a6b] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#0f2550] transition-colors">
                    Changer le mot de passe
                  </button>
                </div>
              </form>
            </Section>
          </div>

          {/* ── Notifications ── */}
          <div id="notifs">
            <Section titre="Notifications" description="Choisissez les e-mails que vous souhaitez recevoir">
              <Toggle label="Nouvelles bourses" description="Alertes quand une nouvelle bourse correspond à votre profil"
                value={notifs.email_bourses} onChange={(v) => setNotifs({ ...notifs, email_bourses: v })} />
              <Toggle label="Deadlines à venir" description="Rappel 30 jours avant la clôture d'une bourse"
                value={notifs.email_deadlines} onChange={(v) => setNotifs({ ...notifs, email_deadlines: v })} />
              <Toggle label="Résultats d'analyse" description="Notification quand une analyse IA est terminée"
                value={notifs.email_analyse} onChange={(v) => setNotifs({ ...notifs, email_analyse: v })} />
              <Toggle label="Conseils et astuces" description="Newsletter mensuelle avec conseils pour améliorer votre dossier"
                value={notifs.email_conseils} onChange={(v) => setNotifs({ ...notifs, email_conseils: v })} />
              <div className="flex justify-end mt-4">
                <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
                  className="bg-[#1a3a6b] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#0f2550] transition-colors">
                  Enregistrer les préférences
                </button>
              </div>
            </Section>
          </div>

          {/* ── Confidentialité ── */}
          <div id="rgpd">
            <Section titre="Confidentialité & Données" description="Vos droits sur vos données personnelles">
              <div className="space-y-3">
                {[
                  {
                    label: 'Télécharger mes données',
                    desc: 'Recevez une copie de toutes vos données personnelles (profil, documents, analyses)',
                    btn: 'Télécharger', style: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
                  },
                  {
                    label: 'Politique de confidentialité',
                    desc: 'Consultez comment nous utilisons et protégeons vos données',
                    btn: 'Consulter', style: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shrink-0 ml-4 ${item.style}`}>
                      {item.btn}
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ── Compte ── */}
          <div id="compte">
            <Section titre="Gestion du compte">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Se déconnecter</p>
                    <p className="text-xs text-gray-400">Déconnectez-vous de votre session actuelle</p>
                  </div>
                  <button onClick={handleLogout}
                    className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                    Déconnexion
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Supprimer mon compte</p>
                    <p className="text-xs text-red-400">Action irréversible — toutes vos données seront supprimées définitivement</p>
                  </div>
                  {confirmDelete ? (
                    <div className="flex gap-2 shrink-0 ml-4">
                      <button onClick={() => setConfirmDelete(false)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-all">
                        Annuler
                      </button>
                      <button className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all">
                        Confirmer
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)}
                      className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shrink-0 ml-4">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </Section>
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
