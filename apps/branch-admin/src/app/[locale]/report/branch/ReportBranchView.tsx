'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart3, TrendingUp, Wallet, Receipt, Percent,
  FileSpreadsheet, Download, Sparkles, Users, Loader2
} from 'lucide-react';
import { useDailyRevenue, useTopServices, useStaff } from '@/lib/hooks';

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }

export default function ReportBranchView() {
  const t = useTranslations('reportBranch');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: daily, loading: loadingDaily, error: errorDaily } = useDailyRevenue(year, month);
  const { data: topServices, loading: loadingTop } = useTopServices('month', 5);
  const { data: staff, loading: loadingStaff } = useStaff();

  const loading = loadingDaily || loadingTop || loadingStaff;

  // Total revenue from daily rows.
  const totalRevenue = (daily ?? []).reduce((s, r) => s + Number(r.revenue ?? 0), 0);

  // TODO(Phase B): /v1/reports/expenses isn't composed here in this round —
  // expense breakdown remains a placeholder. Wire when /report main also passes branchId scoping.
  const totalExpense = 0;
  const profit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  // Service group ranking from top-services hook (top 5 by revenue).
  const top = topServices ?? [];
  const topMaxRevenue = Math.max(1, ...top.map(s => Number(s.revenue ?? 0)));
  const topTotal = top.reduce((s, r) => s + Number(r.revenue ?? 0), 0);

  // Top staff: backend `StaffDto` doesn't yet expose per-staff revenue/bookings,
  // so we list active staff and leave the metric empty. TODO(Phase B): wire to
  // /v1/reports/staff-performance when shipped.
  const activeStaff = (staff ?? []).filter(s => s.active).slice(0, 5);

  // Build a simple 12-month bar chart placeholder driven by current-month total.
  // TODO(Phase B): swap to /v1/reports/revenue/yearly for a real 12-month series.
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) =>
    i === month - 1 ? Math.round(totalRevenue / 1_000_000) : 0
  );
  const maxMonthly = Math.max(1, ...monthlyRevenue);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
          <p className="text-xs text-brand-gold mt-1">
            {t('monthLabel', { month, year })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><FileSpreadsheet className="h-4 w-4" /> {t('exportExcel')}</button>
          <button className="btn-primary"><Download className="h-4 w-4" /> {t('exportPdf')}</button>
        </div>
      </header>

      {loading && (
        <div className="rounded-2xl border border-brand-cream bg-white p-10 text-center shadow-soft">
          <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
        </div>
      )}
      {!loading && errorDaily && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorDaily.message}
        </div>
      )}

      {!loading && !errorDaily && (
        <>
          <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
            <Kpi label={t('kpi.revenue')}  value={fmtM(totalRevenue)} accent="text-brand-gold"   bg="bg-brand-gold/10" Icon={TrendingUp} />
            <Kpi label={t('kpi.expense')}  value={fmtM(totalExpense)} accent="text-rose-600"     bg="bg-rose-50"        Icon={Receipt} />
            <Kpi label={t('kpi.profit')}   value={fmtM(profit)}       accent="text-emerald-600"  bg="bg-emerald-50"     Icon={Wallet} />
            <Kpi label={t('kpi.margin')}   value={`${margin}%`}        accent="text-blue-600"    bg="bg-blue-50"        Icon={Percent} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2 mb-6">
            <article className="kpi-card">
              <SectionHeader Icon={Sparkles} label={t('sections.revenueByService')} />
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                    <th className="text-left pb-2 font-medium">{t('columns.category')}</th>
                    <th className="text-right pb-2 font-medium">{t('columns.amount')}</th>
                    <th className="text-right pb-2 font-medium">{t('columns.share')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream/60">
                  {top.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-xs text-brand-textmuted">—</td></tr>
                  )}
                  {top.map(r => {
                    const share = topTotal > 0 ? Math.round((Number(r.revenue) / topTotal) * 100) : 0;
                    return (
                      <tr key={r.serviceCode}>
                        <td className="py-2.5">{r.serviceCode}</td>
                        <td className="py-2.5 text-right tabular-nums">{fmtM(Number(r.revenue))}</td>
                        <td className="py-2.5 text-right text-brand-gold tabular-nums">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>

            <article className="kpi-card">
              <SectionHeader Icon={Users} label={t('sections.topStaff')} />
              <ul className="mt-3 space-y-3">
                {activeStaff.length === 0 && (
                  <li className="text-xs text-brand-textmuted">—</li>
                )}
                {activeStaff.map(s => (
                  <li key={s.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-brand-textmain font-medium">{s.fullName}</span>
                      {/* TODO(Phase B): per-staff revenue not on StaffDto */}
                      <span className="text-brand-gold tabular-nums">—</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                      <div className="h-full bg-brand-gold" style={{ width: `25%` }} />
                    </div>
                    <p className="text-[10px] text-brand-textmuted mt-0.5">{s.roleInBranch}</p>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2 mb-6">
            <article className="kpi-card">
              <SectionHeader Icon={Receipt} label={t('sections.expenseBreakdown')} />
              {/* TODO(Phase B): expense breakdown via /v1/reports/expenses */}
              <p className="text-xs text-brand-textmuted mt-4">—</p>
            </article>

            <article className="kpi-card">
              <SectionHeader Icon={BarChart3} label={t('sections.monthly')} />
              <div className="grid grid-cols-12 gap-1.5 h-44 items-end mt-4">
                {monthlyRevenue.map((v, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] text-brand-textmuted tabular-nums">{v}M</span>
                    <div
                      className="w-full rounded-t bg-brand-gold/70"
                      style={{ height: `${Math.max(2, (v / maxMonthly) * 100)}%` }}
                    />
                    <span className="text-[9px] text-brand-textmuted">{i + 1}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}

function Kpi({
  label, value, accent, bg, Icon
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
