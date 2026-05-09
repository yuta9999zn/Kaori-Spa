'use client';

import { useTranslations } from 'next-intl';
import { Loader2, Plus } from 'lucide-react';
import { useBranches } from '@/lib/hooks';

interface SeedBranch {
  code: string;
  name: string;
  address: string;
  manager: string;
  status: 'active' | 'inactive';
}

const SEED: SeedBranch[] = [
  { code: 'nb-kim-ma-575', name: 'Natural Beauty 575 Kim Mã', address: '575 Kim Mã, Ba Đình, Hà Nội', manager: 'Nguyễn Khánh Linh (miko)', status: 'active' },
  { code: 'nb-kim-ma-625', name: 'Natural Beauty 625 Kim Mã', address: '625 Kim Mã, Ba Đình, Hà Nội', manager: 'Nguyễn Lan Hương (hương)',  status: 'active' }
];

function pickName(name: Record<string, string>) {
  return name?.vi ?? name?.en ?? Object.values(name ?? {})[0] ?? '';
}

export default function BranchList() {
  const t = useTranslations('branch');
  const { data, error, loading } = useBranches();
  const items = data?.items ?? [];

  const rows = items.length > 0
    ? items.map(b => ({
        code: b.code,
        name: pickName(b.name) || b.code,
        address: pickName(b.address),
        manager: '—',
        status: b.active ? 'active' : 'inactive'
      }))
    : SEED;

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          API offline — demo data.
        </div>
      )}

      {loading && !data ? (
        <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>{(['code', 'name', 'address', 'manager', 'status'] as const).map(c =>
                <th key={c} className="text-left px-4 py-3 font-medium">{t(`columns.${c}` as 'columns.code')}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.code} className="hover:bg-brand-cream/20">
                  <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                  <td className="px-4 py-3 text-brand-textmain">{r.name}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{r.address}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{r.manager}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                      r.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
