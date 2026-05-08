'use client';

import { useTranslations } from 'next-intl';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useRoles } from '@/lib/hooks';

export default function RoleList() {
  const t = useTranslations('role');
  const { data, loading, error } = useRoles();
  const rows = data ?? [];

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-brand-gold" />
          {t('title')}
        </h1>
        <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-center px-4 py-3 font-medium">Scope</th>
              <th className="text-center px-4 py-3 font-medium">System</th>
              <th className="text-right px-4 py-3 font-medium">Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-rose-600">
                {error.message}
              </td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                Chưa có vai trò nào.
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                <td className="px-4 py-3 text-brand-textmain">
                  {r.name?.vi ?? r.name?.en ?? r.code}
                </td>
                <td className="px-4 py-3 text-center text-brand-textmuted">
                  <span className="rounded-full border border-brand-cream bg-brand-ivory px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {r.scope}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs">
                  {r.isSystem
                    ? <span className="rounded bg-brand-gold/10 px-2 py-0.5 text-brand-gold">SYSTEM</span>
                    : <span className="text-brand-textmuted">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-brand-textmuted">
                  {r.permissionCodes.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
