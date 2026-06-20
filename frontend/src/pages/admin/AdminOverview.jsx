import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetStats } from '../../services/api';

function KpiCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    rose:   'bg-rose-50 text-rose-600',
    cyan:   'bg-cyan-50 text-cyan-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function BarChart({ data, total }) {
  if (!data || !Object.keys(data).length) return <p className="text-sm text-gray-400">Aucune donnée</p>;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-2">
      {entries.map(([key, count]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-32 truncate capitalize">{key}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className="bg-[#1a3a6b] h-2 rounded-full transition-all"
              style={{ width: `${total ? Math.round((count / total) * 100) : 0}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

const STATUT_LABELS = {
  en_preparation: 'En préparation',
  dossier_soumis: 'Dossier soumis',
  en_attente:     'En attente',
  accepte:        'Accepté',
  refusee:        'Refusée',
};

const STATUT_COLORS = {
  en_preparation: 'bg-gray-200 text-gray-700',
  dossier_soumis: 'bg-blue-100 text-blue-700',
  en_attente:     'bg-amber-100 text-amber-700',
  accepte:        'bg-emerald-100 text-emerald-700',
  refusee:        'bg-red-100 text-red-700',
};

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats()
      .then(s => setStats(s))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const s = stats || {};

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tableau de bord administrateur — Wekili</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Utilisateurs"
          value={s.users?.total}
          sub={`+${s.users?.new_this_week || 0} cette semaine`}
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KpiCard
          label="Nouvelles inscriptions"
          value={s.users?.new_this_month}
          sub="ce mois-ci"
          color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
        />
        <KpiCard
          label="Analyses IA"
          value={s.analyses?.total}
          sub={`Score moyen : ${s.analyses?.avg_score || 0}/100`}
          color="purple"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
        />
        <KpiCard
          label="Documents"
          value={s.documents?.total}
          sub="uploadés"
          color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Bourses actives"
          value={s.bourses?.actives}
          sub={`/ ${s.bourses?.total || 0} total`}
          color="cyan"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard
          label="Universités"
          value={s.universities?.actives}
          sub={`/ ${s.universities?.total || 0} total`}
          color="rose"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <KpiCard
          label="Profils complétés"
          value={s.users?.with_profile}
          sub={`/ ${s.users?.total || 0} utilisateurs`}
          color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <KpiCard
          label="Candidatures"
          value={s.candidatures?.total}
          sub={`${s.candidatures?.by_status?.accepte || 0} acceptée(s)`}
          color="purple"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auth methods */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Méthodes d'inscription</h3>
          <BarChart
            data={s.users?.by_auth_method}
            total={s.users?.total}
          />
        </div>

        {/* Documents par type */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Documents par type</h3>
          <BarChart
            data={s.documents?.by_type}
            total={s.documents?.total}
          />
        </div>

        {/* Candidatures par statut */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Candidatures par statut</h3>
          {s.candidatures?.total > 0 ? (
            <div className="space-y-2">
              {Object.entries(s.candidatures?.by_status || {}).map(([st, count]) => (
                <div key={st} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[st] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUT_LABELS[st] || st}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune candidature</p>
          )}
        </div>
      </div>

      {/* CV / LM stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CV corrigés par l'IA</p>
            <p className="text-2xl font-bold text-gray-900">{s.cv_versions ?? '—'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-pink-50 rounded-lg text-pink-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lettres de motivation</p>
            <p className="text-2xl font-bold text-gray-900">{s.lm_versions ?? '—'}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
