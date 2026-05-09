'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarDays, Download, TrendingUp, Calendar, UserPlus, Receipt, Wallet, Loader2
} from 'lucide-react';
import { useDailyRevenue, type DailyRevenueRow } from '@/lib/hooks';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }
function fmtK(n: number) { return `${Math.round(n / 1_000)}K ₫`; }

export default function ReportDailyView() {
  const t = useTranslations('reportDaily');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayKey = now.toISOString().slice(0, 10);

  const { data, loading, error } = useDailyRevenue(year, month);
  const rows: DailyRevenueRow[] = data ?? [];

  // KPI: today (or most recent day in the month) — fall back to all-month sums.
  const todayRow = rows.find(r => r.day === todayKey);
  const revenue = todayRow?.revenue ?? rows.reduce((s, r) => s + Number(r.revenue ?? 0), 0);
  const bookings = todayRow?.bookings ?? rows.reduce((s, r) => s + Number(r.bookings ?? 0), 0);
  // TODO(Phase B): backend doesn't yet return new-customer count or hourly buckets — use placeholders.
  const newCustomers = 0;
  const avgTicket = bookings > 0 ? Math.round(revenue / bookings) : 0;

  // Build a 12-bucket hourly chart placeholder (08..19) — backend exposes daily, not hourly.
  // TODO(Phase B): swap to /v1/reports/revenue/hourly when available.
  const hourly = useMemo(() => {
    const labels = ['08','09','10','11','12','13','14','15','16','17','18','19'];
    const max = Math.max(1, ...rows.map(r => Number(r.revenue ?? 0)));
    return labels.map((hour, i) => ({
      hour,
      // distribute the day's total across hours by index — purely visual until backend lands.
      value: rows.length > 0 ? Math.round((rows[i % rows.length]?.revenue ?? 0) / 1_000_000) : 0,
      max: Math.max(1, Math.round(max / 1_000_000))
    }));
  }, [rows]);
  const hourlyMax = Math.max(1, ...hourly.map(h => h.value));

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Calendar className="h-4 w-4" /> {t('datePicker')}</button>
          <button className="btn-primary"><Download className="h-4 w-4" /> {t('exportPdf')}</button>
        </div>
      </header>

      {loading && (
        <div className="rounded-2xl border border-brand-cream bg-white p-10 text-center shadow-soft">
          <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
        </div>
      )}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
            <Kpi label={t('kpi.revenue')} value={fmtM(revenue)} Icon={TrendingUp} accent="text-brand-gold" bg="bg-brand-gold/10" />
            <Kpi label={t('kpi.bookings')} value={String(bookings)} Icon={Calendar} accent="text-blue-600" bg="bg-blue-50" />
            <Kpi label={t('kpi.newCustomers')} value={String(newCustomers)} Icon={UserPlus} accent="text-emerald-600" bg="bg-emerald-50" />
            <Kpi label={t('kpi.avgTicket')} value={fmtK(avgTicket)} Icon={Receipt} accent="text-purple-600" bg="bg-purple-50" />
          </section>

          <section className="grid gap-6 lg:grid-cols-3 mb-6">
            <article className="kpi-card lg:col-span-2">
              <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.hourlyRevenue')}</h2>
              <div className="grid grid-cols-12 gap-1.5 h-40 items-end">
                {hourly.map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] text-brand-textmuted tabular-nums">{h.value}M</span>
                    <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${Math.max(2, (h.value / hourlyMax) * 100)}%` }} />
                    <span className="text-[9px] text-brand-textmuted">{h.hour}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="kpi-card">
              <h2 className="font-serif text-lg text-brand-textmain mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-gold" /> {t('sections.cashflow')}
              </h2>
              {/* TODO(Phase B): payment-method split needs a payment-history aggregation endpoint. */}
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Cash</span><span className="tabular-nums text-brand-textmain">—</span></li>
                <li className="flex justify-between"><span>Card</span><span className="tabular-nums text-brand-textmain">—</span></li>
                <li className="flex justify-between"><span>Transfer</span><span className="tabular-nums text-brand-textmain">—</span></li>
              </ul>
              <div className="mt-4 pt-3 border-t border-brand-cream/60">
                <h3 className="text-[11px] uppercase tracking-widest text-brand-textmuted mb-2">{t('sections.shiftSummary')}</h3>
                <p className="text-xs text-brand-textmuted">—</p>
              </div>
            </article>
          </section>

          <section className="kpi-card">
            <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.transactionLog')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                    <th className="text-left py-2 px-3 font-medium">{t('columns.time')}</th>
                    <th className="text-left py-2 px-3 font-medium">{t('columns.code')}</th>
                    <th className="text-right py-2 px-3 font-medium">{t('columns.amount')}</th>
                    <th className="text-right py-2 px-3 font-medium">{t('columns.method')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream/60">
                  {rows.length === 0 && (
                    <tr><td colSpan={4} className="py-10 px-3 text-center text-sm text-brand-textmuted">
                      Chưa có dữ liệu trong tháng này
                    </td></tr>
                  )}
                  {rows.map(r => (
                    <tr key={r.day}>
                      <td className="py-2.5 px-3 font-mono text-xs">{r.day.slice(8)}/{r.day.slice(5, 7)}</td>
                      <td className="py-2.5 px-3 text-brand-gold">{r.bookings} bookings</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{VND(Number(r.revenue))}</td>
                      <td className="py-2.5 px-3 text-right text-brand-textmuted text-xs">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Kpi({
  label, value, Icon, accent, bg
}: {
  label: string; value: string; accent: string; bg: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-2xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
