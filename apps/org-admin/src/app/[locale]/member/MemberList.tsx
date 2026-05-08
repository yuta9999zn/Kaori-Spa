'use client';

import { useTranslations } from 'next-intl';
import { Plus, Loader2 } from 'lucide-react';
import { useOrgMembers, ORG_ID } from '@/lib/hooks';

export default function MemberList() {
  const t = useTranslations('member');
  const { data, loading, error } = useOrgMembers(ORG_ID);
  const rows = data ?? [];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <button className="btn-primary" disabled>
          <Plus className="h-4 w-4" /> {t('invite')}
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['name', 'email', 'role', 'scope', 'status'] as const).map(c =>
                <th key={c} className="text-left px-4 py-3 font-medium">{t(`columns.${c}` as 'columns.name')}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-rose-600">{error.message}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                Chưa có thành viên nào trong tổ chức.
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.userId} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3">{r.fullName ?? '—'}</td>
                <td className="px-4 py-3 text-brand-textmuted font-mono text-xs">{r.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.roles.length === 0 && <span className="text-brand-textmuted text-xs">—</span>}
                    {r.roles.map(rc => (
                      <span key={rc} className="rounded-full bg-brand-cream/60 px-2 py-0.5 text-[10px] uppercase">
                        {rc}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-textmuted text-xs">
                  {r.branches.length === 0
                    ? 'Toàn tổ chức'
                    : `${r.branches.length} chi nhánh`}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    r.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    r.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-50 text-slate-600'
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
