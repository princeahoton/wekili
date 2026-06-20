import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetUniversities, adminCreateUniversity, adminUpdateUniversity, adminDeleteUniversity } from '../../services/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  nom: '', pays: '', code_pays: '', ville: '', type: '', langue: '',
  niveau_langue: '', classement_mondial: '', taux_admission: '',
  frais_scolarite: '', frais_inscription: '', moyenne_requise: '',
  programme_phare: '', campus_france_requis: false, uni_assist_requis: false,
  plateforme: '', cout_plateforme: '', lien_candidature: '', lien_officiel: '',
  date_ouverture: '', date_cloture: '', description: '', actif: true,
};

const PAYS_OPTIONS = ['France', 'Canada', 'Belgique', 'Allemagne', 'Royaume-Uni', 'Autre'];
const TYPES = ['Université publique', 'Université privée', 'Grande école', 'École d\'ingénieurs', 'École de commerce'];

function UniModal({ uni, onSave, onClose }) {
  const [form, setForm] = useState(uni ? {
    ...uni,
    date_ouverture: uni.date_ouverture?.slice(0, 10) || '',
    date_cloture:   uni.date_cloture?.slice(0, 10)   || '',
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.pays.trim() || !form.ville.trim()) {
      setErr('Nom, pays et ville sont requis.');
      return;
    }
    setSaving(true);
    const data = {
      ...form,
      classement_mondial: form.classement_mondial ? parseInt(form.classement_mondial) : null,
      taux_admission:     form.taux_admission     ? parseInt(form.taux_admission)     : null,
      moyenne_requise:    form.moyenne_requise     ? parseFloat(form.moyenne_requise)  : null,
      date_ouverture: form.date_ouverture || null,
      date_cloture:   form.date_cloture   || null,
    };
    const r = uni
      ? await adminUpdateUniversity(uni.id, data)
      : await adminCreateUniversity(data);
    setSaving(false);
    if (r.university) onSave(r.university);
    else setErr(r.message || 'Erreur lors de la sauvegarde');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{uni ? 'Modifier l\'université' : 'Nouvelle université'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Nom de l'université *</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Université Paris-Saclay" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Pays *</label>
              <select value={form.pays} onChange={e => set('pays', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Choisir...</option>
                {PAYS_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Ville *</label>
              <input value={form.ville} onChange={e => set('ville', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Paris" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Type d'établissement</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Choisir...</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Langue d'enseignement</label>
              <input value={form.langue} onChange={e => set('langue', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Français" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Niveau langue requis</label>
              <select value={form.niveau_langue} onChange={e => set('niveau_langue', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Aucun</option>
                {['A1','A2','B1','B2','C1','C2'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Classement mondial</label>
              <input type="number" value={form.classement_mondial} onChange={e => set('classement_mondial', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 100" min={1} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Taux d'admission (%)</label>
              <input type="number" value={form.taux_admission} onChange={e => set('taux_admission', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 20" min={0} max={100} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Frais de scolarité</label>
              <input value={form.frais_scolarite} onChange={e => set('frais_scolarite', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 243 € / an" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Frais d'inscription</label>
              <input value={form.frais_inscription} onChange={e => set('frais_inscription', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 92 €" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Moyenne requise (/20)</label>
              <input type="number" value={form.moyenne_requise} onChange={e => set('moyenne_requise', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 14" step="0.5" min={0} max={20} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Programme phare</label>
              <input value={form.programme_phare} onChange={e => set('programme_phare', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Master IA" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Plateforme</label>
              <input value={form.plateforme} onChange={e => set('plateforme', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Campus France" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Coût plateforme</label>
              <input value={form.cout_plateforme} onChange={e => set('cout_plateforme', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Gratuit" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Date d'ouverture</label>
              <input type="date" value={form.date_ouverture} onChange={e => set('date_ouverture', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Date de clôture</label>
              <input type="date" value={form.date_cloture} onChange={e => set('date_cloture', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Lien de candidature</label>
              <input value={form.lien_candidature} onChange={e => set('lien_candidature', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 resize-none"
                placeholder="Description de l'université..." />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.campus_france_requis} onChange={e => set('campus_france_requis', e.target.checked)} className="rounded" />
                Campus France requis
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.uni_assist_requis} onChange={e => set('uni_assist_requis', e.target.checked)} className="rounded" />
                Uni-assist requis
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} className="rounded" />
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded-lg bg-[#1a3a6b] text-white hover:bg-[#122d56] disabled:opacity-50">
              {saving ? 'Enregistrement...' : (uni ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel, msg }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <p className="text-gray-800 font-medium mb-4">{msg}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUniversites() {
  const [unis, setUnis]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [pays, setPays]       = useState('');
  const [modal, setModal]     = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminGetUniversities({ search, pays });
    setUnis(r.universities || []);
    setLoading(false);
  }, [search, pays]);

  useEffect(() => { load(); }, [load]);

  const handleSave = (u) => {
    if (modal && modal !== 'create') setUnis(us => us.map(x => x.id === u.id ? u : x));
    else setUnis(us => [u, ...us]);
    setModal(null);
  };

  const handleToggleActif = async (u) => {
    const r = await adminUpdateUniversity(u.id, { actif: !u.actif });
    if (r.university) setUnis(us => us.map(x => x.id === u.id ? r.university : x));
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await adminDeleteUniversity(toDelete);
    setUnis(us => us.filter(u => u.id !== toDelete));
    setToDelete(null);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Universités</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unis.length} université(s)</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white text-sm rounded-lg hover:bg-[#122d56]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouvelle université
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="search" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
        />
        <select value={pays} onChange={e => setPays(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="">Tous les pays</option>
          {['France','Canada','Belgique','Allemagne','Royaume-Uni'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Université</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pays / Ville</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Classement</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Admission</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Candidatures</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clôture</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Chargement...</td></tr>
              ) : unis.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Aucune université</td></tr>
              ) : unis.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">{u.nom}</p>
                    <p className="text-xs text-gray-400">{u.langue || '—'} {u.niveau_langue ? `· ${u.niveau_langue}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{u.pays}</p>
                    <p className="text-gray-400">{u.ville}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[120px]">{u.type || '—'}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">{u.classement_mondial ? `#${u.classement_mondial}` : '—'}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">{u.taux_admission != null ? `${u.taux_admission}%` : '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">{u.nb_candidatures ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(u.date_cloture)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActif(u)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${u.actif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {u.actif ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(u)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1a3a6b]" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setToDelete(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500" title="Supprimer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <UniModal
          uni={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {toDelete && (
        <ConfirmModal
          msg="Supprimer cette université ? Les candidatures associées seront également supprimées."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </AdminLayout>
  );
}
