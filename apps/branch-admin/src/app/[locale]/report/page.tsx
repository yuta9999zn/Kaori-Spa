import { setRequestLocale, getTranslations } from 'next-intl/server';
import { BarChart3, TrendingUp, Sparkles, ShoppingBag, Receipt, Download, FileSpreadsheet, Calendar, PieChart } from 'lucide-react';

export default async function ReportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('report');

  // Active month for the mock view (T5 / May 2026).
  const activeMonth = 5;
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Mock KPI totals — values in VND.
  const total = 218_400_000;
  const services = 196_500_000;
  const cosmetics = 21_900_000;
  const expenses = 64_200_000;
  const profit = total - expenses;
  const deltaPct = 14.6;

  // Mock daily log (5 rows for the mini table)
  const dailyLog = [
    { date: '02/05', dv: '6.200.000 ₫', mp: '0',           total: '6.200.000 ₫' },
    { date: '03/05', dv: '7.100.000 ₫', mp: '450.000 ₫',   total: '7.550.000 ₫' },
    { date: '05/05', dv: '8.900.000 ₫', mp: '0',           total: '8.900.000 ₫' },
    { date: '06/05', dv: '5.400.000 ₫', mp: '1.200.000 ₫', total: '6.600.000 ₫' },
    { date: '07/05', dv: '12.450.000 ₫', mp: '0',          total: '12.450.000 ₫' }
  ];

  // Mock P&L breakdown
  const expenseRows = [
    { key: 'towels',   amount: '17.976.000 ₫', pct: 28 },
    { key: 'supplies', amount: '14.124.000 ₫', pct: 22 },
    { key: 'rent',     amount: '19.260.000 ₫', pct: 30 },
    { key: 'marketing',amount: '6.420.000 ₫',  pct: 10 },
    { key: 'other',    amount: '6.420.000 ₫',  pct: 10 }
  ];

  // Mock payment method distribution.
  const paymentMix = [
    { key: 'cash',     pct: 28, color: 'bg-brand-gold'    },
    { key: 'transfer', pct: 45, color: 'bg-indigo-500'    },
    { key: 'company',  pct: 26, color: 'bg-violet-500'    },
    { key: 'card',     pct: 1,  color: 'bg-brand-rose'    }
  ];

  // Mock yearly bar chart data — values in millions VND.
  const yearly = [142, 158, 170, 165, 218, 195, 210, 230, 188, 240, 220, 260];
  const maxYearly = Math.max(...yearly);

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
            defaultValue="2026"
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
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

      {/* KPIs */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard
          label={t('kpi.total')}
          value="218.4M ₫"
          sub={t('kpi.totalDelta', { value: deltaPct.toString() })}
          accent="text-brand-gold"
          bg="bg-brand-gold/10"
          Icon={TrendingUp}
          deltaUp
        />
        <KpiCard
          label={t('kpi.services')}
          value="196.5M ₫"
          sub={t('kpi.servicesShare', { pct: Math.round(services / total * 100).toString() })}
          accent="text-blue-600"
          bg="bg-blue-50"
          Icon={Sparkles}
        />
        <KpiCard
          label={t('kpi.cosmetics')}
          value="21.9M ₫"
          sub={t('kpi.cosmeticsShare', { pct: Math.round(cosmetics / total * 100).toString() })}
          accent="text-brand-rose"
          bg="bg-brand-rose/10"
          Icon={ShoppingBag}
        />
        <KpiCard
          label={t('kpi.expenses')}
          value="64.2M ₫"
          sub={t('kpi.expensesShare', { pct: Math.round(expenses / total * 100).toString() })}
          accent="text-red-500"
          bg="bg-red-50"
          Icon={Receipt}
        />
      </section>

      {/* Charts row: revenue bars + payment doughnut */}
      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="lg:col-span-2 kpi-card">
          <SectionHeader Icon={BarChart3} label={t('sections.dailyRevenue', { month: activeMonth })} />
          <div className="mt-2 flex gap-1 h-40 items-end">
            {Array.from({ length: 30 }, (_, i) => {
              const h = 25 + ((i * 13 + 17) % 75);
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-brand-gold/70 hover:bg-brand-gold transition"
                  style={{ height: `${h}%` }}
                  title={`${i + 1}: ${h}%`}
                />
              );
            })}
          </div>
          <p className="mt-3 text-xs text-brand-textmuted">{t('sections.chartHint')}</p>
        </article>

        <article className="kpi-card">
          <SectionHeader Icon={PieChart} label={t('sections.paymentMix')} />
          <ul className="mt-3 space-y-3">
            {paymentMix.map(p => (
              <li key={p.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2 text-brand-textmuted">
                    <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                    {t(`payment.${p.key}` as 'payment.cash')}
                  </span>
                  <span className="font-medium text-brand-textmain">{p.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className={`h-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* P&L + daily log */}
      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <SectionHeader Icon={FileSpreadsheet} label={t('sections.pl')} />
          <table className="w-full text-sm mt-2">
            <tbody>
              <PlRow label={t('pl.revenue')} value="218.4M ₫" bold accent="text-brand-gold" />
              <PlRow label={`  ${t('pl.servicesLine')}`} value="196.5M ₫" muted />
              <PlRow label={`  ${t('pl.cosmeticsLine')}`} value="21.9M ₫"  muted />
              <tr><td colSpan={2} className="py-1"><hr className="border-brand-cream" /></td></tr>
              <PlRow label={t('pl.expenses')} value="-64.2M ₫" bold accent="text-red-500" />
              {expenseRows.map(r => (
                <PlRow
                  key={r.key}
                  label={`  ${t(`expense.${r.key}` as 'expense.towels')} (${r.pct}%)`}
                  value={`-${r.amount}`}
                  muted
                  negative
                />
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-brand-cream flex justify-between items-center">
            <span className="text-sm font-medium text-brand-textmain">{t('pl.profit')}</span>
            <span className="text-base font-semibold text-emerald-600">
              {(profit / 1_000_000).toFixed(1)}M ₫
            </span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader Icon={Calendar} label={t('sections.dailyLog')} />
            <span className="text-xs text-brand-textmuted">
              {t('workingDays', { days: 24 })}
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
        <SectionHeader Icon={BarChart3} label={t('sections.yearly', { year: 2026 })} />
        <div className="grid grid-cols-12 gap-2 h-48 items-end mt-3">
          {yearly.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-brand-textmuted tabular-nums">{v}M</span>
              <div
                className={`w-full rounded-t transition ${
                  i + 1 === activeMonth ? 'bg-brand-gold' : 'bg-brand-gold/30'
                }`}
                style={{ height: `${(v / maxYearly) * 100}%` }}
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
  label, value, bold, accent, muted, negative
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
      <td className={`py-1.5 text-right tabular-nums ${bold ? 'font-medium' : muted ? 'text-brand-textmuted' : ''} ${negative ? 'text-red-500' : accent ?? ''}`}>
        {value}
      </td>
    </tr>
  );
}
