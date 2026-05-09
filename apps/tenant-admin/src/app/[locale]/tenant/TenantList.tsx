'use client';

import { Loader2, Plus } from 'lucide-react';
import { useOrgs, type OrgDto } from '@/lib/hooks';

interface Labels {
  title: string;
  create: string;
  columns: {
    code: string;
    name: string;
    plan: string;
    branches: string;
    status: string;
    createdAt: string;
  };
}

// TODO(M3+): plan / branches / status / createdAt are not yet returned by
// /v1/orgs — wire when tenant-service ships subscription + branch-count fields.
const PLAN_PLACEHOLDER = 'Professional';
const BRANCHES_PLACEHOLDER = '—';
const STATUS_PLACEHOLDER = 'active';
const CREATED_AT_PLACEHOLDER = '—';

export default function TenantList({ labels: t }: { labels: Labels }) {
  const { data, loading, error } = useOrgs();
  const rows: OrgDto[] = data?.items ?? [];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">{t.title}</h1>
        <button className="btn-primary"><Plus className="h-4 w-4" /> {t.create}</button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t.columns.code}</th>
              <th className="text-left px-4 py-3 font-medium">{t.columns.name}</th>
              <th className="text-left px-4 py-3 font-medium">{t.columns.plan}</th>
              <th className="text-left px-4 py-3 font-medium">{t.columns.branches}</th>
              <th className="text-left px-4 py-3 font-medium">{t.columns.status}</th>
              <th className="text-left px-4 py-3 font-medium">{t.columns.createdAt}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-textmuted">
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-brand-textmuted">
                  —
                </td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                <td className="px-4 py-3">{r.name?.vi ?? r.name?.en ?? r.slug}</td>
                <td className="px-4 py-3">{PLAN_PLACEHOLDER}</td>
                <td className="px-4 py-3">{BRANCHES_PLACEHOLDER}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] uppercase">
                    {STATUS_PLACEHOLDER}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-textmuted">{CREATED_AT_PLACEHOLDER}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
