'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Loader2, ChevronRight, MoreVertical } from 'lucide-react';
import { useCustomerSearch, useCustomerVisits, type CustomerLite, type Visit } from '@/lib/hooks';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

function fmtDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} · ${hh}:${mi}`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export default function CustomerBookingHistoryView() {
  const t = useTranslations('customerBookingHistory');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<CustomerLite | null>(null);

  const { data: searchData, loading: searchLoading } = useCustomerSearch(q, ORG_ID);
  const candidates = searchData?.items ?? [];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">
            {selected ? initialsOf(selected.fullName) : '—'}
          </div>
          <div>
            <h1 className="font-serif text-3xl text-brand-textmain">
              {selected?.fullName ?? 'Chọn khách hàng'}
            </h1>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Customer picker */}
      <section className="rounded-2xl border border-brand-cream bg-white shadow-soft p-4 mb-6">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-brand-ivory/40 px-4 py-2 max-w-md">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên / SĐT…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        {q.trim() && (
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-brand-cream/60 rounded-xl border border-brand-cream/60">
            {searchLoading && (
              <div className="px-4 py-3 text-center text-xs text-brand-textmuted">
                <Loader2 className="inline h-3.5 w-3.5 animate-spin text-brand-gold" />
              </div>
            )}
            {!searchLoading && candidates.length === 0 && (
              <div className="px-4 py-3 text-center text-xs text-brand-textmuted">
                Không tìm thấy
              </div>
            )}
            {!searchLoading && candidates.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); }}
                className="w-full text-left px-4 py-2.5 hover:bg-brand-ivory/40 flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs">
                  {initialsOf(c.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-textmain truncate">{c.fullName}</p>
                  <p className="text-[10px] font-mono text-brand-textmuted">{c.phone}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-brand-textmuted" />
              </button>
            ))}
          </div>
        )}
      </section>

      {!selected && (
        <div className="rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/30 p-10 text-center text-sm text-brand-textmuted">
          Chọn khách hàng để xem lịch sử đặt lịch.
        </div>
      )}

      {selected && <CustomerVisitTable phone={selected.phone} />}
    </>
  );
}

function CustomerVisitTable({ phone }: { phone: string }) {
  const t = useTranslations('customerBookingHistory');
  const { data, loading, error } = useCustomerVisits(phone);
  const visits: Visit[] = data ?? [];

  // KPIs computed client-side from visits.
  const completed = visits.filter(v => v.status === 'done' || v.status === 'completed').length;
  const cancelled = visits.filter(v => v.status === 'cancelled').length;
  // TODO(Phase B): backend status doesn't yet expose 'no_show' distinctly.
  const noShows = visits.filter(v => v.status === 'no_show').length;
  const totalSpend = visits.reduce((s, v) => s + Number(v.total ?? 0), 0);
  const avgSpend = visits.length > 0 ? Math.round(totalSpend / visits.length) : 0;
  // TODO(Phase B): avg visit frequency requires server-side computation.

  const upcoming = useMemo(() => {
    const now = Date.now();
    return visits
      .filter(v => new Date(v.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [visits]);

  const past = useMemo(() => {
    const now = Date.now();
    return visits
      .filter(v => new Date(v.startAt).getTime() < now)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [visits]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-cream bg-white p-10 text-center shadow-soft">
        <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error.message}
      </div>
    );
  }

  return (
    <>
      {upcoming && (
        <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-4 mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-brand-gold">{t('upcoming')}</h3>
            <p className="font-serif text-xl text-brand-textmain mt-0.5">
              {upcoming.items[0]?.serviceName?.vi ?? upcoming.items[0]?.serviceCode ?? '—'} · {fmtDateTime(upcoming.startAt)}
            </p>
            <p className="text-xs text-brand-textmuted">
              {upcoming.items[0]?.staffName ?? '—'} · {t('amount')} {VND(upcoming.total)}
            </p>
          </div>
          <button className="btn-ghost text-xs">{t('viewDetail')}</button>
        </div>
      )}

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-6 mb-6">
        <KpiTile label={t('kpi.totalVisits')} value={String(visits.length)} />
        <KpiTile label={t('kpi.completed')} value={String(completed)} accent="green" />
        <KpiTile label={t('kpi.cancelled')} value={String(cancelled)} accent="rose" />
        <KpiTile label={t('kpi.noShows')} value={String(noShows)} accent="red" />
        {/* TODO(Phase B): visit cadence + avg-spend need a customer-stats endpoint */}
        <KpiTile label={t('kpi.avgFreq')} value="—" />
        <KpiTile label={t('kpi.avgSpend')} value={avgSpend > 0 ? VND(avgSpend) : '—'} />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30 flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-textmain">{t('history')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.code')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.date')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.service')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.staff')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.amount')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {past.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                  Chưa có lịch sử
                </td></tr>
              )}
              {past.map(v => {
                const head = v.items[0];
                return (
                  <tr key={v.bookingCode} className="hover:bg-brand-ivory/30">
                    <td className="px-4 py-3 font-mono text-xs">{v.bookingCode}</td>
                    <td className="px-4 py-3 text-brand-textmuted">{fmtDateTime(v.startAt)}</td>
                    <td className="px-4 py-3 font-medium text-brand-textmain">
                      {head?.serviceName?.vi ?? head?.serviceCode ?? '—'}
                      {v.items.length > 1 && (
                        <span className="ml-1 text-[10px] text-brand-textmuted">+{v.items.length - 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-textmuted">{head?.staffName ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-serif">{VND(v.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="more">
                        <MoreVertical className="h-4 w-4 text-brand-textmuted" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' | 'rose' }) {
  const cls = accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-500' : accent === 'rose' ? 'text-brand-rose' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cls}`}>{label}</p>
      <p className="font-serif text-xl text-brand-textmain">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'done' || status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
    status === 'cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' :
    status === 'no_show' ? 'bg-red-50 text-red-700 border-red-200' :
    'bg-brand-gold/10 text-brand-goldhover border-brand-gold/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}
