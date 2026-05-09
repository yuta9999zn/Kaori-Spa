import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Users, FileSpreadsheet, UserPlus, Repeat, Wallet, Receipt, Percent } from 'lucide-react';

// TODO(Phase B): wire to backend - replace with /v1/reports/customer-analysis endpoint.
const GROWTH = [120, 145, 168, 190, 215, 248, 275, 304, 332, 360, 392, 420];
const ACQUISITION = [
  { name: 'Walk-in', share: 32 },
  { name: 'Referral', share: 24 },
  { name: 'Social', share: 18 },
  { name: 'Search', share: 14 },
  { name: 'Other', share: 12 }
];
const TIERS = [
  { tier: 'Diamond (>20M)', count: 18 },
  { tier: 'Platinum (10-20M)', count: 42 },
  { tier: 'Gold (5-10M)', count: 96 },
  { tier: 'Silver (1-5M)', count: 184 },
  { tier: 'Bronze (<1M)', count: 80 }
];
const TOP = [
  { rank: 1, name: 'Trần Mỹ Duyên',    visits: 24, ltv: 32_400_000 },
  { rank: 2, name: 'Phạm Anh Thư',     visits: 21, ltv: 28_800_000 },
  { rank: 3, name: 'Nguyễn Văn An',    visits: 19, ltv: 24_200_000 },
  { rank: 4, name: 'Lê Quỳnh Như',     visits: 17, ltv: 22_500_000 },
  { rank: 5, name: 'Hoàng Thanh Tùng', visits: 15, ltv: 19_700_000 }
];

export default async function ReportCustomerAnalysisPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('report');
  const t = await getTranslations('reportCustomerAnalysis');

  const total = TIERS.reduce((s, x) => s + x.count, 0);
  const newC = 64;
  const returning = 268;
  const ltv = 4_200_000;
  const avgTicket = 850_000;
  const retention = 72;
  const maxG = Math.max(...GROWTH);
  const maxTier = Math.max(...TIERS.map(t => t.count));

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Users className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button className="btn-primary"><FileSpreadsheet className="h-4 w-4" /> {t('exportExcel')}</button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-6 mb-6">
        <Kpi label={t('kpi.total')} value={String(total)} Icon={Users} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.new')} value={String(newC)} Icon={UserPlus} accent="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label={t('kpi.returning')} value={String(returning)} Icon={Repeat} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.ltv')} value={fmtM(ltv)} Icon={Wallet} accent="text-purple-600" bg="bg-purple-50" />
        <Kpi label={t('kpi.avgTicket')} value={fmtK(avgTicket)} Icon={Receipt} accent="text-amber-600" bg="bg-amber-50" />
        <Kpi label={t('kpi.retention')} value={`${retention}%`} Icon={Percent} accent="text-rose-600" bg="bg-rose-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.growth')}</h2>
          <div className="grid grid-cols-12 gap-1.5 h-40 items-end">
            {GROWTH.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-brand-textmuted tabular-nums">{v}</span>
                <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${Math.max(2, (v / maxG) * 100)}%` }} />
                <span className="text-[9px] text-brand-textmuted">{i + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.acquisition')}</h2>
          <ul className="space-y-3">
            {ACQUISITION.map(a => (
              <li key={a.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{a.name}</span><span className="text-brand-gold tabular-nums">{a.share}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${a.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.spendingTiers')}</h2>
          <ul className="space-y-3">
            {TIERS.map(tt => (
              <li key={tt.tier}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{tt.tier}</span><span className="text-brand-textmuted tabular-nums">{tt.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${(tt.count / maxTier) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.topCustomers')}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                <th className="text-center pb-2 font-medium w-10">{t('columns.rank')}</th>
                <th className="text-left pb-2 font-medium">{t('columns.customer')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.visits')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.ltv')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {TOP.map(r => (
                <tr key={r.name}>
                  <td className="py-2.5 text-center">
                    {r.rank <= 3 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-white text-[11px] font-bold">{r.rank}</span>
                    ) : <span className="text-brand-textmuted">{r.rank}</span>}
                  </td>
                  <td className="py-2.5">{r.name}</td>
                  <td className="py-2.5 text-right tabular-nums">{r.visits}</td>
                  <td className="py-2.5 text-right tabular-nums text-brand-gold">{fmtM(r.ltv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.retention')}</h2>
          <p className="text-sm text-brand-textmuted">M+1: 72% · M+3: 54% · M+6: 42% · M+12: 28%</p>
        </article>
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.churn')}</h2>
          <p className="text-sm text-brand-textmuted">28 khách hàng có nguy cơ churn trong 30 ngày tới</p>
        </article>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }
function fmtK(n: number) { return `${(n / 1_000).toFixed(0)}K ₫`; }

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
          <p className={`mt-1 font-serif text-xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
