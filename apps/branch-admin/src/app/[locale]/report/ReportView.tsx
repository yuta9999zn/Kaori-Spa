'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3, TrendingUp, Sparkles, ShoppingBag, Receipt, Download,
  FileSpreadsheet, Calendar, PieChart, Loader2
} from 'lucide-react';
import {
  useDailyRevenue, useTopServices, useExpenses, useYearlyRevenue
} from '@/lib/hooks';

export default function ReportView() {
  const t = useTranslations('report');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [activeMonth, setActiveMonth] = useState(now.getMonth() + 1);

  const { data: daily, loading } = useDailyRevenue(year, activeMonth);
  const { data: top } = useTopServices('month', 10);

  // Date range for the active month (ISO yyyy-mm-dd) — used by /v1/reports/expenses.
  const monthFrom = `${year}-${String(activeMonth).padStart(2, '0')}-01`;
  const monthTo   = `${year}-${String(activeMonth).padStart(2, '0')}-${String(
    new Date(year, activeMonth, 0).getDate()
  ).padStart(2, '0')}`;
  const { data: expenseSummary } = useExpenses({ from: monthFrom, to: monthTo });
  const { data: yearlyData }     = useYearlyRevenue(year);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Aggregate KPIs from daily rows.
  const total     = (daily ?? []).reduce((s, d) => s + Number(d.revenue ?? 0), 0);
  const services  = total; // backend doesn't split service vs cosmetic — use total.
  const cosmetics = 0;
  const expenses  = Number(expenseSummary?.totalAmount ?? 0);
  const expenseRows = expenseSummary?.breakdown ?? [];
  const profit    = total - expenses;
  const deltaPct  = 0;

  // Build 31-bar chart for days of the month.
  const daysInMonth = new Date(year, activeMonth, 0).getDate();
  const dayBars = Array.from({ length: daysInMonth }, (_, i) => {
    const dayKey = `${year}-${String(activeMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    const row = (daily ?? []).find(d => d.day === dayKey);
    return row ? Number(row.revenue) : 0;
  });
  const maxBar = Math.max(1, ...dayBars);

  // Daily log table.
  const dailyLog = (daily ?? []).map(d => ({
    date: d.day.slice(8) + '/' + d.day.slice(5, 7),
    dv: fmtVnd(Number(d.revenue)),
    mp: '—',
    total: fmtVnd(Number(d.revenue))
  }));

  // Yearly: 12-month rollup from /v1/reports/revenue/yearly.
  // Backend always returns 12 entries; values rendered in millions for compactness.
  const yearly = months.map(m => {
    const row = yearlyData?.months.find(r => r.month === m);
    return row ? Math.round(Number(row.revenue) / 1_000_000) : 0;
  });
  const maxYearly = Math.max(1, ...yearly);

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value, 10))}
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn-primary">
            <Download className="h-4 w-4" /> {t('export')}
          </button>
        </div>
      </header>

      {/* Month tabs */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className={`rounded-full border px-4 py-1.5 text-xs transition ${
              m === activeMonth
                ? 'bg-brand-gold/10 border-brand-gold text-brand-gold font-medium'
                : 'border-brand-cream text-brand-textmuted hover:border-brand-gold hover:text-brand-gold'
            }`}
          >
            {t('monthShort', { month: m })}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
        </div>
      )}

      {/* KPIs */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard
          label={t('kpi.total')}
          value={fmtMillions(total)}
          sub={t('kpi.totalDelta', { value: deltaPct.toString() })}
          accent="text-brand-gold"
          bg="bg-brand-gold/10"
          Icon={TrendingUp}
          deltaUp
        />
        <KpiCard
          label={t('kpi.services')}
          value={fmtMillions(services)}
          sub={t('kpi.servicesShare', { pct: total > 0 ? Math.round(services / total * 100).toString() : '0' })}
          accent="text-blue-600"
          bg="bg-blue-50"
          Icon={Sparkles}
        />
        <KpiCard
          label={t('kpi.cosmetics')}
          value={fmtMillions(cosmetics)}
          sub={t('kpi.cosmeticsShare', { pct: '0' })}
          accent="text-brand-rose"
          bg="bg-brand-rose/10"
          Icon={ShoppingBag}
        />
        <KpiCard
          label={t('kpi.expenses')}
          value={fmtMillions(expenses)}
          sub={t('kpi.expensesShare', { pct: '0' })}
          accent="text-red-500"
          bg="bg-red-50"
          Icon={Receipt}
        />
      </section>

      {/* Charts row */}
      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="lg:col-span-2 kpi-card">
          <SectionHeader Icon={BarChart3} label={t('sections.dailyRevenue', { month: activeMonth })} />
          <div className="mt-2 flex gap-1 h-40 items-end">
            {dayBars.map((v, i) => {
              const h = (v / maxBar) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-brand-gold/70 hover:bg-brand-gold transition"
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${i + 1}: ${fmtVnd(v)}`}
                />
              );
            })}
          </div>
          <p className="mt-3 text-xs text-brand-textmuted">{t('sections.chartHint')}</p>
        </article>

        <article className="kpi-card">
          <SectionHeader Icon={PieChart} label="Top dịch vụ tháng" />
          <ul className="mt-3 space-y-3">
            {(top ?? []).slice(0, 5).map(p => (
              <li key={p.serviceCode}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-brand-textmuted font-mono">{p.serviceCode}</span>
                  <span className="font-medium text-brand-textmain">{fmtMillions(Number(p.revenue))}</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{
                    width: `${Math.min(100, Number(p.revenue) / Math.max(1, Number((top ?? [])[0]?.revenue ?? 1)) * 100)}%`
                  }} />
                </div>
                <p className="text-[10px] text-brand-textmuted mt-0.5">{p.times} lượt</p>
              </li>
            ))}
            {(!top || top.length === 0) && (
              <li className="text-xs text-brand-textmuted">Chưa có dữ liệu</li>
            )}
          </ul>
        </article>
      </section>

      {/* P&L + daily log */}
      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <SectionHeader Icon={FileSpreadsheet} label={t('sections.pl')} />
          <table className="w-full text-sm mt-2">
            <tbody>
              <PlRow label={t('pl.revenue')} value={fmtMillions(total)} bold accent="text-brand-gold" />
              <PlRow label={`  ${t('pl.servicesLine')}`} value={fmtMillions(services)} muted />
              <PlRow label={`  ${t('pl.cosmeticsLine')}`} value={fmtMillions(cosmetics)} muted />
              <tr><td colSpan={2} className="py-1"><hr className="border-brand-cream" /></td></tr>
              <PlRow label={t('pl.expenses')} value={`-${fmtMillions(expenses)}`} bold accent="text-red-500" />
              {expenseRows.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-1 text-xs text-brand-textmuted text-center">
                    Chưa có chi phí
                  </td>
                </tr>
              )}
              {expenseRows.map(row => (
                <PlRow
                  key={row.category}
                  label={`  ${expenseLabel(t, row.category)} (${row.pct}%)`}
                  value={`-${fmtMillions(Number(row.amount))}`}
                  muted
                />
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-brand-cream flex justify-between items-center">
            <span className="text-sm font-medium text-brand-textmain">{t('pl.profit')}</span>
            <span className="text-base font-semibold text-emerald-600">
              {fmtMillions(profit)}
            </span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader Icon={Calendar} label={t('sections.dailyLog')} />
            <span className="text-xs text-brand-textmuted">
              {t('workingDays', { days: dailyLog.length })}
            </span>
          </div>
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-xs">
              <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{t('columns.date')}</th>
                  <th className="text-right px-3 py-2 font-medium">{t('columns.services')}</th>
                  <th className="text-right px-3 py-2 font-medium">{t('columns.cosmetics')}</th>
                  <th className="text-right px-3 py-2 font-medium">{t('columns.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {dailyLog.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-brand-textmuted">Chưa có dữ liệu</td></tr>
                )}
                {dailyLog.map(d => (
                  <tr key={d.date} className="hover:bg-brand-cream/20">
                    <td className="px-3 py-2 text-brand-textmuted">{d.date}</td>
                    <td className="px-3 py-2 text-right">{d.dv}</td>
                    <td className="px-3 py-2 text-right">{d.mp}</td>
                    <td className="px-3 py-2 text-right font-medium text-brand-gold">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* Yearly overview */}
      <section className="kpi-card">
        <SectionHeader Icon={BarChart3} label={t('sections.yearly', { year })} />
        <div className="grid grid-cols-12 gap-2 h-48 items-end mt-3">
          {yearly.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-brand-textmuted tabular-nums">{v}M</span>
              <div
                className={`w-full rounded-t transition ${
                  i + 1 === activeMonth ? 'bg-brand-gold' : 'bg-brand-gold/30'
                }`}
                style={{ height: `${Math.max(2, (v / maxYearly) * 100)}%` }}
              />
              <span className="text-[10px] text-brand-textmuted">
                {t('monthShort', { month: i + 1 })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function fmtVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}
function fmtMillions(n: number) {
  return `${(n / 1_000_000).toFixed(1)}M ₫`;
}

/**
 * Translate an expense category key. Falls back to the raw category string
 * if no `expense.<category>` translation is registered for the active
 * locale (BE may add new categories before FE catalogues them).
 */
function expenseLabel(t: ReturnType<typeof useTranslations>, category: string): string {
  const key = `expense.${category}`;
  try {
    const v = t(key as 'expense.towels');
    return v && v !== key ? v : category;
  } catch {
    return category;
  }
}

function KpiCard({
  label, value, sub, accent, bg, Icon, deltaUp
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  bg: string;
  Icon: React.ComponentType<{ className?: string }>;
  deltaUp?: boolean;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-2xl ${accent}`}>{value}</p>
          <p className={`text-[11px] mt-1 ${deltaUp ? 'text-emerald-600' : 'text-brand-textmuted'}`}>
            {sub}
          </p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}

function SectionHeader({
  Icon, label
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-brand-textmuted">
      <Icon className="h-3.5 w-3.5 text-brand-gold" />
      <span>{label}</span>
    </div>
  );
}

function PlRow({
  label, value, bold, accent, muted
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: string;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <tr className={bold ? 'border-t border-brand-cream' : ''}>
      <td className={`py-1.5 pr-2 ${bold ? 'font-medium' : muted ? 'text-brand-textmuted' : ''} ${accent ?? ''}`}>
        {label}
      </td>
      <td className={`py-1.5 text-right tabular-nums ${bold ? 'font-medium' : muted ? 'text-brand-textmuted' : ''} ${accent ?? ''}`}>
        {value}
      </td>
    </tr>
  );
}
