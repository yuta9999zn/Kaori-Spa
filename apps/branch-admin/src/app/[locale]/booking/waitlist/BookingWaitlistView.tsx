'use client';

import { useTranslations } from 'next-intl';
import { Plus, RefreshCw, MoreVertical, Loader2 } from 'lucide-react';
import { useBookings, type BookingListItem } from '@/lib/hooks';

function fmtTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mi}`;
}

function waitMinutes(iso: string): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.round((Date.now() - d) / 60000));
}

export default function BookingWaitlistView() {
  const t = useTranslations('bookingWaitlist');
  const { data, loading, error, refetch } = useBookings({
    status: 'pending',
    size: 50,
    sort: 'startAt,asc'
  });

  const rows: BookingListItem[] = data?.items ?? [];
  const waiting = rows.length;
  const avgWait = waiting === 0
    ? 0
    : Math.round(rows.reduce((s, r) => s + waitMinutes(r.startAt), 0) / waiting);

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost"><RefreshCw className="h-4 w-4" /> {t('refresh')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('add')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiTile label={t('kpi.waiting')} value={String(waiting)} />
        <KpiTile label={t('kpi.avgWait')} value={String(avgWait)} suffix={t('min')} />
        {/* TODO(Phase B): availableStaff + nextSlot need /v1/availability */}
        <KpiTile label={t('kpi.availableStaff')} value="—" hint={t('kpi.ready')} />
        <KpiTile label={t('kpi.nextSlot')} value="—" hint={t('kpi.in37')} />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 flex items-center justify-between bg-brand-ivory/30">
          <h2 className="font-serif text-lg text-brand-textmain">{t('currentQueue')}</h2>
          <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
            <option>{t('sortPosition')}</option>
            <option>{t('sortWait')}</option>
            <option>{t('sortPriority')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-center px-4 py-3 font-medium w-16">{t('cols.pos')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.customer')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.service')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.arrival')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.waitTime')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
                </td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-rose-600">
                  {error.message}
                </td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                  Hàng chờ trống.
                </td></tr>
              )}
              {!loading && rows.map((r, idx) => {
                const wait = waitMinutes(r.startAt);
                const highlight = idx === 0;
                return (
                  <tr key={r.id} className={highlight ? 'bg-brand-gold/5' : 'hover:bg-brand-ivory/30'}>
                    <td className="text-center px-4 py-3">
                      {highlight ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold text-white font-bold text-xs">
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-brand-textmuted font-bold">{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-textmain">{r.customerName}</p>
                      <p className="text-[10px] text-brand-textmuted font-mono">{r.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      {/* TODO(Phase B): service summary not on BookingListItem */}
                      <p>{r.itemCount} {t('min').replace('phút', 'mục') /* fallback label */}</p>
                      <p className="text-[10px] text-brand-textmuted font-mono">{r.code}</p>
                    </td>
                    <td className="text-center px-4 py-3 font-mono text-xs">{fmtTime(r.startAt)}</td>
                    <td className="text-center px-4 py-3 text-brand-textmuted">
                      {wait > 0 ? `${wait} ${t('min')}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={(() => {
                        try { return t('status.waiting' as 'status.waiting'); }
                        catch { return 'waiting'; }
                      })()} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button className="rounded-lg bg-brand-gold text-white px-3 py-1.5 text-xs font-medium hover:bg-brand-goldhover">
                          {t('assignSlot')}
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="more">
                          <MoreVertical className="h-4 w-4 text-brand-textmuted" />
                        </button>
                      </div>
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

function KpiTile({ label, value, suffix, hint }: { label: string; value: string; suffix?: string; hint?: string }) {
  return (
    <div className="kpi-card">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">
        {value}{suffix && <span className="text-xs ml-1 font-sans text-brand-textmuted">{suffix}</span>}
      </p>
      {hint && <p className="text-[10px] text-brand-textmuted mt-1">{hint}</p>}
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5" />
      {label}
    </span>
  );
}
