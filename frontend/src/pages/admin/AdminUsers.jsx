import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetUsers, adminGetUserDetail, adminUpdateUserRole, adminDeleteUser } from '../../services/api';

const ROLE_BADGE = {
  user:       'bg-gray-100 text-gray-600',
  admin:      'bg-blue-100 text-blue-700',
  superadmin: 'bg-purple-100 text-purple-700',
};

const METHOD_BADGE = {
  email:    'bg-slate-100 text-slate-600',
  google:   'bg-red-50 text-red-600',
  facebook: 'bg-blue-50 text-blue-700',
  phone:    'bg-green-50 text-green-700',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtBytes(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`;
  return `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

function Badge({ text, cls }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{text}</span>;
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

function UserDetailPanel({ userId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    setLoading(true);
    adminGetUserDetail(userId).then(d => {
      setData(d);
      setNewRole(d.user?.role || 'user');
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleSaveRole = async () => {
    setSaving(true);
    const r = await adminUpdateUserRole(userId, newRole);
    setSaving(false);
    if (r.user) setMsg('Rôle mis à jour');
    else setMsg(r.message || 'Erreur');
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
      <div className="bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Détail utilisateur</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" /></div>
        ) : !data?.user ? (
          <p className="text-center py-20 text-gray-400">Utilisateur introuvable</p>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* Infos */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1a3a6b] flex items-center justify-center text-white font-bold">
                  {data.user.prenom?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{data.user.prenom} {data.user.nom}</p>
                  <p className="text-sm text-gray-500">{data.user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Pays</p><p className="font-medium">{data.user.pays || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Méthode</p><Badge text={data.user.auth_method} cls={METHOD_BADGE[data.user.auth_method] || 'bg-gray-100 text-gray-600'} /></div>
                <div><p className="text-gray-400 text-xs">Email vérifié</p><p className="font-medium flex items-center gap-1">{data.user.email_verified ? <><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Oui</> : <><svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Non</>}</p></div>
                <div><p className="text-gray-400 text-xs">2FA</p><p className="font-medium">{data.user.two_fa_enabled ? 'Activé' : 'Désactivé'}</p></div>
                <div><p className="text-gray-400 text-xs">Inscrit le</p><p className="font-medium">{fmtDate(data.user.created_at)}</p></div>
                <div><p className="text-gray-400 text-xs">Dernière connexion</p><p className="font-medium">{fmtDate(data.user.last_login)}</p></div>
              </div>
            </div>

            {/* Rôle */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Rôle</p>
              <div className="flex items-center gap-2">
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white flex-1"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                </select>
                <button
                  onClick={handleSaveRole}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-[#1a3a6b] text-white rounded-lg hover:bg-[#122d56] disabled:opacity-50"
                >
                  {saving ? '...' : 'Sauvegarder'}
                </button>
              </div>
              {msg && <p className="text-xs text-emerald-600 mt-1">{msg}</p>}
            </div>

            {/* Profil */}
            {data.profile && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Profil académique</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-gray-400 text-xs">Nationalité</p><p className="font-medium">{data.profile.nationalite || '—'}</p></div>
                  <div><p className="text-gray-400 text-xs">Niveau études</p><p className="font-medium">{data.profile.niveau_etudes || '—'}</p></div>
                  <div><p className="text-gray-400 text-xs">Domaine</p><p className="font-medium">{data.profile.domaine || '—'}</p></div>
                  <div><p className="text-gray-400 text-xs">Moyenne</p><p className="font-medium">{data.profile.moyenne ?? '—'}/20</p></div>
                  <div><p className="text-gray-400 text-xs">Niveau visé</p><p className="font-medium">{data.profile.niveau_vise || '—'}</p></div>
                  <div><p className="text-gray-400 text-xs">Pays cibles</p><p className="font-medium">{data.profile.pays_cibles?.join(', ') || '—'}</p></div>
                </div>
              </div>
            )}

            {/* Analyses */}
            {data.analyses?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Analyses IA ({data.analyses.length})</p>
                <div className="space-y-2">
                  {data.analyses.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-500">{fmtDate(a.created_at)}</span>
                      <span className={`text-sm font-bold ${a.score_global >= 70 ? 'text-emerald-600' : a.score_global >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {a.score_global}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {data.documents?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Documents ({data.documents.length})</p>
                <div className="space-y-1">
                  {data.documents.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                      <div>
                        <span className="font-medium text-gray-700">{d.nom_fichier}</span>
                        <span className="text-gray-400 ml-2">({d.type})</span>
                      </div>
                      <span className="text-gray-400">{fmtBytes(d.taille)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidatures */}
            {data.candidatures?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Candidatures ({data.candidatures.length})</p>
                <div className="space-y-1.5">
                  {data.candidatures.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{c.uni_nom} ({c.uni_pays})</span>
                      <span className={`px-2 py-0.5 rounded-full ${c.statut === 'accepte' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{c.statut}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detail, setDetail]   = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminGetUsers({ page, limit: 25, search, role: roleFilter });
    setUsers(r.users || []);
    setTotal(r.total || 0);
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleRoleFilter = (e) => { setRoleFilter(e.target.value); setPage(1); };

  const handleDelete = async () => {
    if (!toDelete) return;
    await adminDeleteUser(toDelete);
    setToDelete(null);
    load();
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} inscrit(s)</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher par nom ou email..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
        />
        <select
          value={roleFilter}
          onChange={handleRoleFilter}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Tous les rôles</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="superadmin">superadmin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pays</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Méthode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Profil</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Docs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Inscrit le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Aucun utilisateur trouvé</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1a3a6b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.prenom?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.pays || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge text={u.auth_method} cls={METHOD_BADGE[u.auth_method] || 'bg-gray-100 text-gray-600'} />
                  </td>
                  <td className="px-4 py-3">
                    {u.has_profile
                      ? <span className="text-emerald-600 font-medium text-xs flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Oui</span>
                      : <span className="text-gray-300 text-xs">Non</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.last_score != null ? (
                      <span className={`font-bold text-sm ${u.last_score >= 70 ? 'text-emerald-600' : u.last_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {u.last_score}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 text-xs">{u.doc_count}</td>
                  <td className="px-4 py-3">
                    <Badge text={u.role || 'user'} cls={ROLE_BADGE[u.role] || ROLE_BADGE.user} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setDetail(u.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1a3a6b]"
                        title="Voir détails"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                        onClick={() => setToDelete(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{total} résultat(s)</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >Précédent</button>
              <span className="px-3 py-1.5 text-xs text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >Suivant</button>
            </div>
          </div>
        )}
      </div>

      {detail && <UserDetailPanel userId={detail} onClose={() => setDetail(null)} />}
      {toDelete && (
        <ConfirmModal
          msg="Supprimer cet utilisateur ? Toutes ses données (profil, documents, analyses) seront supprimées définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </AdminLayout>
  );
}
