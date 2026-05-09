import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { BarChart3, FileSpreadsheet, Calendar, CheckCircle2, XCircle, Percent, TrendingUp, Wallet } from 'lucide-react';

// TODO(Phase B): wire to backend - replace with /v1/reports/booking-analysis endpoint.
const VOLUME = [22, 28, 31, 26, 35, 42, 38, 44, 48, 52, 47, 55, 58, 62];
const PEAK_HOURS = [
  { h: '08', v: 6 }, { h: '09', v: 12 }, { h: '10', v: 18 }, { h: '11', v: 24 },
  { h: '12', v: 14 }, { h: '13', v: 16 }, { h: '14', v: 22 }, { h: '15', v: 30 },
  { h: '16', v: 28 }, { h: '17', v: 24 }, { h: '18', v: 19 }, { h: '19', v: 14 }
];
const POPULAR = [
  { name: 'Massage Thuỵ Điển 60p', count: 142, share: 22, revenue: 121_000_000 },
  { name: 'Triệt lông nách',       count: 118, share: 18, revenue: 70_800_000 },
  { name: 'Combo dưỡng da',         count: 96, share: 15, revenue: 86_400_000 },
  { name: 'Massage đá nóng 90p',    count: 78, share: 12, revenue: 85_800_000 },
  { name: 'Triệt lông toàn thân',   count: 64, share: 10, revenue: 153_600_000 }
];
const STAFF_UTIL = [
  { name: 'Minh Phương', util: 92 },
  { name: 'Thu Hà',      util: 86 },
  { name: 'Lan Hương',   util: 81 },
  { name: 'Quỳnh Anh',   util: 74 },
  { name: 'Đức Thanh',   util: 68 }
];
const FUNNEL = [
  { key: 'viewed', value: 4200 },
  { key: 'started', value: 1850 },
  { key: 'submitted', value: 980 },
  { key: 'confirmed', value: 820 },
  { key: 'completed', value: 740 }
] as const;
const SOURCES = [
  { name: 'Walk-in', revenue: 240_000_000, share: 38 },
  { name: 'App',     revenue: 200_000_000, share: 32 },
  { name: 'Web',     revenue: 120_000_000, share: 19 },
  { name: 'Phone',   revenue: 70_000_000,  share: 11 }
];

export default async function ReportBookingAnalysisPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('report');
  const t = await getTranslations('reportBookingAnalysis');

  const total = VOLUME.reduce((s, x) => s + x, 0);
  const completed = Math.round(total * 0.78);
  const cancelled = Math.round(total * 0.07);
  const conversion = Math.round((completed / total) * 100);
  const totalRev = POPULAR.reduce((s, p) => s + p.revenue, 0);
  const avg = Math.round(totalRev / total);
  const maxV = Math.max(...VOLUME);
  const maxP = Math.max(...PEAK_HOURS.map(p => p.v));
  const maxFunnel = FUNNEL[0].value;

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button className="btn-primary"><FileSpreadsheet className="h-4 w-4" /> {t('exportExcel')}</button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-6 mb-6">
        <Kpi label={t('kpi.totalBookings')} value={String(total)} Icon={Calendar} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.completed')} value={String(completed)} Icon={CheckCircle2} accent="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label={t('kpi.cancelled')} value={String(cancelled)} Icon={XCircle} accent="text-rose-600" bg="bg-rose-50" />
        <Kpi label={t('kpi.conversion')} value={`${conversion}%`} Icon={Percent} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.totalRevenue')} value={fmtM(totalRev)} Icon={TrendingUp} accent="text-purple-600" bg="bg-purple-50" />
        <Kpi label={t('kpi.avgValue')} value={fmtK(avg)} Icon={Wallet} accent="text-amber-600" bg="bg-amber-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.volume')}</h2>
          <div className="grid grid-cols-14 gap-1 h-40 items-end" style={{ gridTemplateColumns: `repeat(${VOLUME.length}, minmax(0, 1fr))` }}>
            {VOLUME.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${(v / maxV) * 100}%` }} />
                <span className="text-[9px] text-brand-textmuted">{i + 1}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.peakHours')}</h2>
          <div className="grid grid-cols-12 gap-1 h-40 items-end">
            {PEAK_HOURS.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${(p.v / maxP) * 100}%` }} />
                <span className="text-[9px] text-brand-textmuted">{p.h}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.popularServices')}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                <th className="text-left pb-2 font-medium">{t('columns.service')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.count')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.share')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {POPULAR.map(p => (
                <tr key={p.name}>
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right tabular-nums">{p.count}</td>
                  <td className="py-2 text-right text-brand-gold tabular-nums">{p.share}%</td>
                  <td className="py-2 text-right tabular-nums">{fmtM(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.staffUtilization')}</h2>
          <ul className="space-y-3">
            {STAFF_UTIL.map(s => (
              <li key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{s.name}</span><span className="text-brand-gold tabular-nums">{s.util}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${s.util}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.funnel')}</h2>
          <ul className="space-y-2">
            {FUNNEL.map(f => (
              <li key={f.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{t(`funnel.${f.key}` as 'funnel.viewed')}</span>
                  <span className="text-brand-gold tabular-nums">{f.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${(f.value / maxFunnel) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.source')}</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-brand-cream/60">
              {SOURCES.map(s => (
                <tr key={s.name}>
                  <td className="py-2.5">{s.name}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtM(s.revenue)}</td>
                  <td className="py-2.5 text-right text-brand-gold tabular-nums w-16">{s.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
