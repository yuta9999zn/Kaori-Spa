'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useCustomerSearch } from '@/lib/hooks';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

export default function CustomerList() {
  const t = useTranslations('customer');
  const [q, setQ] = useState('');
  const { data, loading, error } = useCustomerSearch(q, ORG_ID);
  const items = data?.items ?? [];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <button className="btn-primary">
          <Plus className="h-4 w-4" /> {t('create')}
        </button>
      </header>

      <div className="mb-5 flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md shadow-soft">
        <Search className="h-4 w-4 text-brand-textmuted" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          placeholder={t('search')}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['code', 'name', 'phone', 'segment', 'points'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.code')}
                </th>
              ))}
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
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                Chưa có dữ liệu
              </td></tr>
            )}
            {!loading && items.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">
                  <Link href={`/customer/${r.id}` as '/customer'}>
                    {r.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-textmain">{r.fullName}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.phone}</td>
                <td className="px-4 py-3">
                  <SegmentBadge segment={r.segment} label={(() => {
                    try { return t(`segments.${r.segment}` as 'segments.vip'); }
                    catch { return r.segment; }
                  })()} />
                </td>
                <td className="px-4 py-3 text-brand-textmuted">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[10px] text-brand-textmuted">
            {items.length} / {data.total}
          </div>
        )}
      </div>
    </>
  );
}

function SegmentBadge({ segment, label }: { segment: string; label: string }) {
  const map: Record<string, string> = {
    vip:     'bg-amber-50 text-amber-700',
    regular: 'bg-emerald-50 text-emerald-700',
    new:     'bg-blue-50 text-blue-700',
    dormant: 'bg-slate-50 text-slate-600'
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${map[segment] ?? ''}`}>
      {label}
    </span>
  );
}
