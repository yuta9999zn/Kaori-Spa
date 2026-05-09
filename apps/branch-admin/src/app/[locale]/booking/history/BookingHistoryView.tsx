'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Download, Filter, Loader2 } from 'lucide-react';
import { useBookings, type BookingListItem } from '@/lib/hooks';

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

export default function BookingHistoryView() {
  const t = useTranslations('bookingHistory');
  const { data, loading, error } = useBookings({ status: 'done', size: 50 });
  const [q, setQ] = useState('');

  const rows: BookingListItem[] = useMemo(() => {
    const all = data?.items ?? [];
    if (!q.trim()) return all;
    const needle = q.trim().toLowerCase();
    return all.filter(r =>
      r.code.toLowerCase().includes(needle)
      || r.customerName.toLowerCase().includes(needle)
      || r.customerPhone.includes(needle)
    );
  }, [data, q]);

  const total = data?.total ?? 0;

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Filter className="h-4 w-4" /> {t('filter')}</button>
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('export')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')} value={String(total)} />
        <KpiTile label={t('kpi.today')} value={String(rows.filter(r => r.startAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length)} />
        <KpiTile label={t('kpi.completed')} value={String(rows.length)} tone="emerald" />
        {/* TODO(Phase B): cancelled / no-show counts need a separate query */}
        <KpiTile label={t('kpi.cancelled')} value="—" tone="red" />
        <KpiTile label={t('kpi.noShowRate')} value="—" tone="rose" />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md w-full sm:w-auto shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.id')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.customer')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.dateTime')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.total')}</th>
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
                  Chưa có booking đã hoàn thành.
                </td></tr>
              )}
              {!loading && rows.map(r => (
                <tr key={r.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-textmain">{r.customerName}</p>
                    <p className="text-[10px] text-brand-textmuted font-mono">{r.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDateTime(r.startAt)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {(() => {
                        try { return t(`status.completed` as 'status.completed'); }
                        catch { return r.status; }
                      })()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-brand-textmain">{VND(r.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'red' | 'rose' }) {
  const labelCls =
    tone === 'emerald' ? 'text-emerald-600' :
    tone === 'red' ? 'text-red-500' :
    tone === 'rose' ? 'text-brand-rose' :
    'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}
