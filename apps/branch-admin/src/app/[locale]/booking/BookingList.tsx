'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useBookings } from '@/lib/hooks';

type Filter = 'filterAll' | 'filterToday' | 'filterUpcoming' | 'filterDone';
const FILTERS: Filter[] = ['filterAll', 'filterToday', 'filterUpcoming', 'filterDone'];

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '',            label: 'all' },
  { key: 'pending',     label: 'pending' },
  { key: 'confirmed',   label: 'confirmed' },
  { key: 'in_progress', label: 'in_progress' },
  { key: 'done',        label: 'done' },
  { key: 'cancelled',   label: 'cancelled' }
];

const PAGE_SIZE = 20;

function startOfDayIso(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayIso(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return x.toISOString();
}

function fmtTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

export default function BookingList() {
  const t = useTranslations('booking');
  const [phoneQ, setPhoneQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<Filter>('filterAll');
  const [page, setPage] = useState(0);

  // Map the visual "all/today/upcoming/done" tabs to from/to/status filters.
  const dateFilters = useMemo(() => {
    const now = new Date();
    if (activeFilter === 'filterToday') {
      return { from: startOfDayIso(now), to: endOfDayIso(now), tabStatus: undefined as string | undefined };
    }
    if (activeFilter === 'filterUpcoming') {
      return { from: now.toISOString(), to: undefined, tabStatus: undefined };
    }
    if (activeFilter === 'filterDone') {
      return { from: undefined, to: undefined, tabStatus: 'done' };
    }
    return { from: undefined, to: undefined, tabStatus: undefined };
  }, [activeFilter]);

  // Resolve effective status: explicit dropdown takes precedence over tab.
  const effectiveStatus = statusFilter || dateFilters.tabStatus;

  const { data, loading, error } = useBookings({
    status: effectiveStatus,
    from: dateFilters.from,
    to: dateFilters.to,
    customerPhone: phoneQ.trim().length > 0 ? phoneQ.trim() : undefined,
    page,
    size: PAGE_SIZE,
    sort: 'startAt,desc'
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = total > 0 ? Math.ceil(total / PAGE_SIZE) - 1 : 0;

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
            onClick={() => { setActiveFilter(f); setPage(0); }}
            className={`rounded-full px-4 py-1.5 text-xs border transition ${
              activeFilter === f
                ? 'bg-brand-gold border-brand-gold text-white'
                : 'border-brand-cream text-brand-textmuted hover:border-brand-gold'
            }`}
          >
            {t(f)}
          </button>
        ))}

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs text-brand-textmain focus:outline-none focus:border-brand-gold"
        >
          {STATUS_TABS.map(s => (
            <option key={s.key} value={s.key}>
              {s.key === ''
                ? t('filterAll')
                : (() => {
                    try { return t(`status.${s.key}` as 'status.pending'); }
                    catch { return s.key; }
                  })()}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={phoneQ}
            onChange={e => { setPhoneQ(e.target.value); setPage(0); }}
            placeholder="SĐT khách hàng…"
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
              <th className="text-right px-4 py-3 font-medium">
                {t('columns.amount' as 'columns.code')}
              </th>
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
                Chưa có booking nào khớp bộ lọc.
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">
                  <Link href={{ pathname: '/booking/[id]' as '/booking/new', params: { id: r.id } } as never}>
                    {r.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-textmain">
                  <div className="font-medium">{r.customerName}</div>
                  <div className="text-[11px] text-brand-textmuted font-mono">{r.customerPhone}</div>
                </td>
                <td className="px-4 py-3 text-brand-textmuted font-mono text-xs">
                  {fmtTime(r.startAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-cream/60 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {(() => {
                      try { return t(`status.${r.status}` as 'status.pending'); }
                      catch { return r.status; }
                    })()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-brand-textmain">
                  {r.totalAmount.toLocaleString('vi-VN')}₫
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[11px] text-brand-textmuted">
          <span>
            {total > 0
              ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} / ${total}`
              : '0 / 0'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-md border border-brand-cream bg-white px-2 py-1 text-brand-textmain disabled:opacity-40 hover:border-brand-gold"
              aria-label="prev"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono">{page + 1}</span>
            <button
              type="button"
              onClick={() => setPage(p => (p < lastPage ? p + 1 : p))}
              disabled={page >= lastPage || loading}
              className="rounded-md border border-brand-cream bg-white px-2 py-1 text-brand-textmain disabled:opacity-40 hover:border-brand-gold"
              aria-label="next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
