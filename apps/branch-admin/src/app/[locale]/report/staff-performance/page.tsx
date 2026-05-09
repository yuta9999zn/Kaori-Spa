import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Users, FileSpreadsheet, Star, Award, TrendingUp, Calendar, Wallet } from 'lucide-react';

// TODO(Phase B): wire to backend - replace with /v1/reports/staff-performance endpoint.
const STAFF = [
  { rank: 1, name: 'Minh Phương', revenue: 92_000_000, bookings: 84, rating: 4.9, commission: 9_200_000 },
  { rank: 2, name: 'Thu Hà',      revenue: 78_500_000, bookings: 71, rating: 4.8, commission: 7_850_000 },
  { rank: 3, name: 'Lan Hương',   revenue: 72_000_000, bookings: 65, rating: 4.7, commission: 7_200_000 },
  { rank: 4, name: 'Quỳnh Anh',   revenue: 64_200_000, bookings: 58, rating: 4.6, commission: 6_420_000 },
  { rank: 5, name: 'Đức Thanh',   revenue: 51_800_000, bookings: 49, rating: 4.5, commission: 5_180_000 },
  { rank: 6, name: 'Trang Lê',    revenue: 42_400_000, bookings: 41, rating: 4.4, commission: 4_240_000 }
];

const TREND = [40, 48, 52, 60, 58, 64, 70, 75, 82, 88, 92, 96];

const SERVICE_BREAKDOWN = [
  { name: 'Massage', share: 38 },
  { name: 'Triệt lông', share: 28 },
  { name: 'Chăm sóc da', share: 22 },
  { name: 'Body therapy', share: 12 }
];

export default async function ReportStaffPerformancePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reportStaffPerformance');

  const totalRevenue = STAFF.reduce((s, x) => s + x.revenue, 0);
  const totalBookings = STAFF.reduce((s, x) => s + x.bookings, 0);
  const totalCommission = STAFF.reduce((s, x) => s + x.commission, 0);
  const avgRating = (STAFF.reduce((s, x) => s + x.rating, 0) / STAFF.length).toFixed(1);
  const top = STAFF[0];
  const max = Math.max(...TREND);
  const maxRev = Math.max(...STAFF.map(s => s.revenue));

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Users className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button className="btn-primary"><FileSpreadsheet className="h-4 w-4" /> {t('exportExcel')}</button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-5 mb-6">
        <Kpi label={t('kpi.totalRevenue')} value={fmtM(totalRevenue)} Icon={TrendingUp} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.totalBookings')} value={String(totalBookings)} Icon={Calendar} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.topStaff')} value={top.name} Icon={Award} accent="text-purple-600" bg="bg-purple-50" />
        <Kpi label={t('kpi.avgRating')} value={String(avgRating)} Icon={Star} accent="text-amber-600" bg="bg-amber-50" />
        <Kpi label={t('kpi.totalCommission')} value={fmtM(totalCommission)} Icon={Wallet} accent="text-emerald-600" bg="bg-emerald-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.trend')}</h2>
          <div className="grid grid-cols-12 gap-1.5 h-40 items-end">
            {TREND.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-brand-textmuted tabular-nums">{v}M</span>
                <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
                <span className="text-[9px] text-brand-textmuted">{i + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.serviceBreakdown')}</h2>
          <ul className="space-y-3">
            {SERVICE_BREAKDOWN.map(s => (
              <li key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{s.name}</span><span className="text-brand-gold tabular-nums">{s.share}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${s.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="kpi-card">
        <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.ranking')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <th className="text-center py-2 px-3 font-medium w-12">{t('columns.rank')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.staff')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.revenue')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.bookings')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.rating')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.commission')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {STAFF.map(s => (
                <tr key={s.name}>
                  <td className="py-2.5 px-3 text-center">
                    {s.rank <= 3 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-white text-[11px] font-bold">{s.rank}</span>
                    ) : (
                      <span className="text-brand-textmuted">{s.rank}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium">{s.name}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-brand-cream overflow-hidden">
                        <div className="h-full bg-brand-gold" style={{ width: `${(s.revenue / maxRev) * 100}%` }} />
                      </div>
                      <span>{fmtM(s.revenue)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{s.bookings}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{s.rating}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{fmtM(s.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }

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
