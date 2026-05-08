'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, Search } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useBookingSearch } from '@/lib/hooks';

const FILTERS = ['filterAll', 'filterToday', 'filterUpcoming', 'filterDone'] as const;

export default function BookingList() {
  const t = useTranslations('booking');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('filterAll');
  const { data: hits, loading, error } = useBookingSearch(q);

  const rows = hits ?? [];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <Link href="/booking/new" className="btn-primary">
          <Plus className="h-4 w-4" /> {t('create')}
        </Link>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs border transition ${
              activeFilter === f
                ? 'bg-brand-gold border-brand-gold text-white'
                : 'border-brand-cream text-brand-textmuted hover:border-brand-gold'
            }`}
          >
            {t(f)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Mã booking, tên KH, SĐT…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['code', 'customer', 'time', 'status'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.code')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-rose-600">
                {error.message}
              </td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                {q.trim().length < 2
                  ? 'Nhập tối thiểu 2 ký tự để tìm booking'
                  : 'Chưa có dữ liệu'}
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">
                  <Link href={{ pathname: '/booking/[id]' as '/booking/new', params: { id: r.id } } as never}>
                    {r.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-textmain">{r.customerName}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.time}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-cream/60 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {(() => {
                      try { return t(`status.${r.status}` as 'status.pending'); }
                      catch { return r.status; }
                    })()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[10px] text-brand-textmuted">
          {/* TODO(M1): replace with paged /v1/bookings once endpoint ships */}
          Đang dùng /v1/search. Endpoint /v1/bookings danh sách sẽ thay thế ở M1.
        </div>
      </div>
    </>
  );
}
