import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetBourses, adminCreateBourse, adminUpdateBourse, adminDeleteBourse } from '../../services/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  nom: '', organisme: '', pays: '', code_pays: '', niveau: '', domaine: '',
  montant: '', type_financement: '', description: '', deadline: '',
  date_debut: '', duree: '', lien: '', langue_requise: '', niveau_langue_requis: '',
  age_max: '', nb_places: '', actif: true,
};

const NIVEAUX = ['Licence', 'Master', 'Doctorat', 'Tous niveaux'];
const PAYS_OPTIONS = ['France', 'Canada', 'Belgique', 'Allemagne', 'Royaume-Uni', 'Autre'];

function BourseModal({ bourse, onSave, onClose }) {
  const [form, setForm] = useState(bourse ? { ...bourse, deadline: bourse.deadline?.slice(0, 10) || '', date_debut: bourse.date_debut?.slice(0, 10) || '' } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.organisme.trim() || !form.pays.trim()) {
      setErr('Nom, organisme et pays sont requis.');
      return;
    }
    setSaving(true);
    const data = {
      ...form,
      age_max:   form.age_max   ? parseInt(form.age_max)   : null,
      nb_places: form.nb_places ? parseInt(form.nb_places) : null,
      deadline:  form.deadline  || null,
      date_debut: form.date_debut || null,
    };
    const r = bourse
      ? await adminUpdateBourse(bourse.id, data)
      : await adminCreateBourse(data);
    setSaving(false);
    if (r.bourse) { onSave(r.bourse); }
    else setErr(r.message || 'Erreur lors de la sauvegarde');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{bourse ? 'Modifier la bourse' : 'Nouvelle bourse'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Nom de la bourse *</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Bourse Eiffel Excellence" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Organisme *</label>
              <input value={form.organisme} onChange={e => set('organisme', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Campus France" />
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
              <label className="text-xs font-medium text-gray-500 block mb-1">Niveau</label>
              <select value={form.niveau} onChange={e => set('niveau', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Choisir...</option>
                {NIVEAUX.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Domaine</label>
              <input value={form.domaine} onChange={e => set('domaine', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Tous domaines" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Montant</label>
              <input value={form.montant} onChange={e => set('montant', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: jusqu'à 1181 €/mois" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Type de financement</label>
              <input value={form.type_financement} onChange={e => set('type_financement', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Bourse complète" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Date limite</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Date de début</label>
              <input type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Durée</label>
              <input value={form.duree} onChange={e => set('duree', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 12 à 36 mois" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Langue requise</label>
              <input value={form.langue_requise} onChange={e => set('langue_requise', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: Français" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Niveau langue requis</label>
              <select value={form.niveau_langue_requis} onChange={e => set('niveau_langue_requis', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Aucun</option>
                {['A1','A2','B1','B2','C1','C2'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Âge max</label>
              <input type="number" value={form.age_max} onChange={e => set('age_max', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 30" min={0} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Nb places</label>
              <input type="number" value={form.nb_places} onChange={e => set('nb_places', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="Ex: 70" min={0} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Lien officiel</label>
              <input value={form.lien} onChange={e => set('lien', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 resize-none"
                placeholder="Description de la bourse..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="actif-b" checked={form.actif} onChange={e => set('actif', e.target.checked)} className="rounded" />
              <label htmlFor="actif-b" className="text-sm text-gray-700">Bourse active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded-lg bg-[#1a3a6b] text-white hover:bg-[#122d56] disabled:opacity-50">
              {saving ? 'Enregistrement...' : (bourse ? 'Mettre à jour' : 'Créer')}
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

export default function AdminBourses() {
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [pays, setPays]       = useState('');
  const [modal, setModal]     = useState(null); // null | 'create' | bourse object
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminGetBourses({ search, pays });
    setBourses(r.bourses || []);
    setLoading(false);
  }, [search, pays]);

  useEffect(() => { load(); }, [load]);

  const handleSave = (b) => {
    if (modal && modal !== 'create') {
      setBourses(bs => bs.map(x => x.id === b.id ? b : x));
    } else {
      setBourses(bs => [b, ...bs]);
    }
    setModal(null);
  };

  const handleToggleActif = async (b) => {
    const r = await adminUpdateBourse(b.id, { actif: !b.actif });
    if (r.bourse) setBourses(bs => bs.map(x => x.id === b.id ? r.bourse : x));
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await adminDeleteBourse(toDelete);
    setBourses(bs => bs.filter(b => b.id !== toDelete));
    setToDelete(null);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bourses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bourses.length} bourse(s)</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white text-sm rounded-lg hover:bg-[#122d56]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouvelle bourse
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bourse</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pays</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Niveau</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Deadline</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Matches</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Chargement...</td></tr>
              ) : bourses.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Aucune bourse</td></tr>
              ) : bourses.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{b.nom}</p>
                    <p className="text-xs text-gray-400">{b.organisme}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.pays}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.niveau || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.montant || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(b.deadline)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 text-sm font-semibold">{b.nb_matches ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActif(b)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${b.actif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {b.actif ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(b)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1a3a6b]" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setToDelete(b.id)}
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
        <BourseModal
          bourse={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {toDelete && (
        <ConfirmModal
          msg="Supprimer cette bourse ? Les matches associés seront également supprimés."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </AdminLayout>
  );
}
