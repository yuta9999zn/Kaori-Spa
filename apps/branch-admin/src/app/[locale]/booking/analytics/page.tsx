import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function BookingAnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('booking');
  const t = await getTranslations('bookingAnalytics');

  // TODO(Phase B): wire to backend when endpoint ships
  const services = [
    { name: 'Massage cổ vai gáy', bookings: 412, revenue: 185_400_000, rating: 4.8 },
    { name: 'Triệt lông toàn thân nữ', bookings: 380, revenue: 456_000_000, rating: 4.9 },
    { name: 'Chăm sóc da Hydrating', bookings: 298, revenue: 178_800_000, rating: 4.7 },
    { name: 'Liệu trình đá nóng', bookings: 142, revenue: 106_500_000, rating: 4.6 }
  ];

  const staff = [
    { name: 'Anna Nguyễn', bookings: 312, utilization: 88, revenue: 187_200_000 },
    { name: 'Elena Rodriguez', bookings: 287, utilization: 81, revenue: 172_200_000 },
    { name: 'Maria Trần', bookings: 245, utilization: 70, revenue: 147_000_000 }
  ];

  const peakHours = [
    { hour: '09:00', pct: 35 },
    { hour: '10:00', pct: 60 },
    { hour: '11:00', pct: 45 },
    { hour: '14:00', pct: 70 },
    { hour: '15:00', pct: 95 },
    { hour: '16:00', pct: 88 },
    { hour: '17:00', pct: 75 },
    { hour: '18:00', pct: 92 },
    { hour: '19:00', pct: 80 },
    { hour: '20:00', pct: 55 }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-full border border-brand-cream bg-white px-3 py-2 text-xs">
            <option>{t('range.last30')}</option>
            <option>{t('range.last7')}</option>
            <option>{t('range.thisMonth')}</option>
            <option>{t('range.lastMonth')}</option>
          </select>
          <button className="btn-ghost"><Calendar className="h-4 w-4" /> {t('customRange')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')} value="1.245" trend="+12%" up />
        <KpiTile label={t('kpi.completed')} value="1.020" hint="(82%)" />
        <KpiTile label={t('kpi.cancelled')} value="180" hint="(14%)" tone="rose" />
        <KpiTile label={t('kpi.noShow')} value="3.6%" trend="-0.4%" />
        <KpiTile label={t('kpi.revenue')} value={VND(427_500_000)} tone="gold" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Volume placeholder */}
        <section className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('volume')}</h2>
          <div className="h-64 rounded-xl bg-gradient-to-b from-brand-gold/5 to-brand-cream/20 flex items-center justify-center text-xs text-brand-textmuted">
            {t('chartPlaceholder')}
          </div>
        </section>

        {/* Peak hours */}
        <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('peakHours')}</h2>
          <div className="space-y-1.5">
            {peakHours.map(p => (
              <div key={p.hour} className="flex items-center gap-3 text-xs">
                <span className="font-mono w-12 text-brand-textmuted">{p.hour}</span>
                <div className="flex-1 h-2 rounded-full bg-brand-cream/50 overflow-hidden">
                  <div className="h-full bg-brand-gold rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
                <span className="font-mono w-10 text-right">{p.pct}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service popularity */}
        <section className="bg-white rounded-2xl shadow-soft border border-brand-cream/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-cream/50">
            <h2 className="font-serif text-lg text-brand-textmain">{t('servicePopularity')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">{t('cols.service')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.bookings')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('cols.revenue')}</th>
                  <th className="text-right px-6 py-3 font-medium">{t('cols.rating')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {services.map(s => (
                  <tr key={s.name} className="hover:bg-brand-ivory/30">
                    <td className="px-6 py-3 text-brand-textmain">{s.name}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{s.bookings}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{VND(s.revenue)}</td>
                    <td className="px-6 py-3 text-right font-mono text-xs">★ {s.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Staff utilization */}
        <section className="bg-white rounded-2xl shadow-soft border border-brand-cream/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-cream/50">
            <h2 className="font-serif text-lg text-brand-textmain">{t('staffUtilization')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">{t('cols.staff')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.bookings')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.utilization')}</th>
                  <th className="text-right px-6 py-3 font-medium">{t('cols.revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {staff.map(s => (
                  <tr key={s.name} className="hover:bg-brand-ivory/30">
                    <td className="px-6 py-3 text-brand-textmain">{s.name}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{s.bookings}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-16 rounded-full bg-brand-cream/50 overflow-hidden">
                          <div className="h-full bg-brand-gold rounded-full" style={{ width: `${s.utilization}%` }} />
                        </div>
                        <span className="font-mono text-xs">{s.utilization}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-xs">{VND(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function KpiTile({ label, value, hint, trend, up, tone }: { label: string; value: string; hint?: string; trend?: string; up?: boolean; tone?: 'rose' | 'gold' }) {
  const labelCls =
    tone === 'rose' ? 'text-brand-rose' :
    tone === 'gold' ? 'text-brand-gold' :
    'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <div className="flex items-end gap-2">
        <p className="font-serif text-2xl text-brand-textmain">{value}</p>
        {hint && <span className="text-xs text-brand-textmuted mb-1">{hint}</span>}
      </div>
      {trend && (
        <p className={`text-[10px] mt-1 inline-flex items-center gap-1 ${up ? 'text-emerald-600' : 'text-red-600'}`}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </p>
      )}
    </div>
  );
}
