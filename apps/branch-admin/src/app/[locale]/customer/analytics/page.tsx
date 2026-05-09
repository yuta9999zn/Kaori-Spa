import { setRequestLocale, getTranslations } from 'next-intl/server';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

type TopCustomer = {
  initials: string;
  name: string;
  visits: number;
  ltv: string;
};

export default async function CustomerAnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customerAnalytics');

  // TODO(Phase B): wire to backend when endpoint ships
  const topCustomers: TopCustomer[] = [
    { initials: 'JD', name: 'John Doe', visits: 24, ltv: '$3,450' },
    { initials: 'ES', name: 'Emily Smith', visits: 19, ltv: '$2,820' },
    { initials: 'MC', name: 'Marcus Chen', visits: 16, ltv: '$1,950' },
    { initials: 'AV', name: 'Anna Vance', visits: 14, ltv: '$1,840' },
    { initials: 'RT', name: 'Robert Tran', visits: 12, ltv: '$1,600' }
  ];

  const sources = [
    { label: t('source.direct'), pct: '38%' },
    { label: t('source.referral'), pct: '24%' },
    { label: t('source.social'), pct: '20%' },
    { label: t('source.walkin'), pct: '12%' },
    { label: t('source.other'), pct: '6%' }
  ];

  const tiers = [
    { label: 'VIP ($1,000+)', count: 120 },
    { label: 'Regulars ($300-$1,000)', count: 450 },
    { label: 'Occasional (<$300)', count: 1830 }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
            <option>{t('range.30d')}</option>
            <option>{t('range.90d')}</option>
            <option>{t('range.year')}</option>
          </select>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-6 mb-6">
        <KpiTile label={t('kpi.totalDatabase')} value="3,240" />
        <KpiTile label={t('kpi.newCustomers')} value="120" hint="+12%" accent="gold" trend="up" />
        <KpiTile label={t('kpi.retention')} value="64%" />
        <KpiTile label={t('kpi.ltv')} value="$850.00" />
        <KpiTile label={t('kpi.avgPerVisit')} value="$145.00" />
        <KpiTile label={t('kpi.churn')} value="8%" hint="-2%" accent="rose" trend="down" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <ChartCard title={t('growth')}>
          <p className="text-xs text-brand-textmuted">{t('chartPlaceholder')}</p>
          <div className="h-32 mt-3 flex items-end gap-2">
            {[35, 50, 42, 60, 75, 68, 88, 92].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-gold/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </ChartCard>

        <ChartCard title={t('sources')}>
          <ul className="space-y-2 mt-2">
            {sources.map(s => (
              <li key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-brand-textmain">{s.label}</span>
                <span className="font-serif text-brand-gold">{s.pct}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title={t('spendingTiers')}>
          <ul className="space-y-2 mt-2">
            {tiers.map(t1 => (
              <li key={t1.label} className="flex items-center justify-between text-sm">
                <span className="text-brand-textmuted">{t1.label}</span>
                <span className="font-serif text-brand-textmain">{t1.count}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30 flex items-center justify-between">
            <h2 className="font-serif text-lg text-brand-textmain">{t('topCustomers')}</h2>
            <Users className="h-4 w-4 text-brand-textmuted" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.customer')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.visits')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.ltv')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {topCustomers.map(c => (
                <tr key={c.name} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">{c.initials}</div>
                      <span className="font-medium text-brand-textmain">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-brand-textmuted">{c.visits}</td>
                  <td className="px-4 py-3 text-right font-serif font-medium text-brand-textmain">{c.ltv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('retentionAnalysis')}</h3>
            <span className="font-serif text-5xl text-brand-textmain font-bold">64%</span>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('avgVisits')}</p>
                <p className="font-serif text-xl text-brand-textmain">3.2</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('visitFrequency')}</p>
                <p className="font-serif text-xl text-brand-textmain">{t('every45d')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('churnAnalysis')}</h3>
            <span className="font-serif text-5xl text-brand-rose font-bold">8%</span>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('inactiveCustomers')}</p>
                <p className="font-serif text-xl text-brand-textmain">260</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('atRisk')}</p>
                <p className="font-serif text-xl text-amber-600">145</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, hint, accent, trend }: { label: string; value: string; hint?: string; accent?: 'gold' | 'rose'; trend?: 'up' | 'down' }) {
  const cls = accent === 'gold' ? 'text-brand-gold' : accent === 'rose' ? 'text-brand-rose' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain flex items-end gap-1">
        {value}
        {hint && (
          <span className={`text-xs font-sans font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'} flex items-center`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {hint}
          </span>
        )}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
      <h3 className="font-serif text-lg text-brand-textmain mb-2">{title}</h3>
      {children}
    </div>
  );
}
