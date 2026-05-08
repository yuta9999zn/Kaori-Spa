// TODO(M3+): wire when ClickHouse-backed analytics-service ships platform KPI endpoints.
import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  DollarSign, CalendarCheck, Users, UserCheck, TrendingUp,
  Download, Calendar, Star, Sparkles, Waves, Flower, Droplet
} from 'lucide-react';

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('analytics');

  const kpis = [
    { key: 'revenue',   value: '$128,450', delta: '+14.5%', trend: 'up',     Icon: DollarSign },
    { key: 'bookings',  value: '1,240',    delta: '+8.2%',  trend: 'up',     Icon: CalendarCheck },
    { key: 'customers', value: '3,850',    delta: '+12.4%', trend: 'up',     Icon: Users },
    { key: 'staff',     value: '42',       delta: 'Stable', trend: 'stable', Icon: UserCheck }
  ] as const;

  const services = [
    { name: 'Signature Deep Tissue',  bookings: 145, revenue: '$23,200', Icon: Waves },
    { name: 'Lotus Hydrating Facial', bookings: 98,  revenue: '$11,760', Icon: Sparkles },
    { name: 'Aromatherapy Relax',     bookings: 75,  revenue: '$6,750',  Icon: Flower },
    { name: 'Hot Stone Therapy',      bookings: 52,  revenue: '$5,980',  Icon: Droplet }
  ];

  const staff = [
    { initials: 'AN', name: 'Anna Nguyen',     services: 42, revenue: '$6,500', rating: '4.9' },
    { initials: 'DC', name: 'David Chen',      services: 38, revenue: '$5,200', rating: '4.8' },
    { initials: 'ER', name: 'Elena Rodriguez', services: 35, revenue: '$4,950', rating: '5.0' },
    { initials: 'SM', name: 'Sarah Miller',    services: 28, revenue: '$3,800', rating: '4.9' }
  ];

  const branches = [
    { name: 'District 1', revenue: 65000, pct: 100 },
    { name: 'Westside',   revenue: 42000, pct: 65 },
    { name: 'Ocean View', revenue: 21450, pct: 33 }
  ];

  const categories = [
    { key: 'massage', pct: 45, color: '#C9A87C' },
    { key: 'facial',  pct: 30, color: '#D9B8B5' },
    { key: 'body',    pct: 15, color: '#DCD6DD' },
    { key: 'other',   pct: 10, color: '#F4EFEA' }
  ] as const;

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="btn-ghost"><Calendar className="h-4 w-4" /> {t('filters.last30')}</button>
          <button className="btn-primary"><Download className="h-4 w-4" /> {t('actions.export')}</button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map(({ key, value, delta, trend, Icon }) => (
          <article key={key} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-ivory flex items-center justify-center text-brand-gold border border-brand-cream">
                <Icon className="h-5 w-5" />
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                trend === 'up'
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-brand-textmuted bg-brand-ivory border border-brand-cream'
              }`}>
                {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {delta}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">
              {t(`kpi.${key}` as 'kpi.revenue')}
            </p>
            <h3 className="font-serif text-3xl text-brand-textmain">{value}</h3>
          </article>
        ))}
      </section>

      {/* Revenue + categories row */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl text-brand-textmain">{t('charts.revenueTitle')}</h3>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('charts.revenueSubtitle')}</p>
            </div>
            <span className="text-xs text-brand-textmuted">{t('charts.allBranches')}</span>
          </div>
          <div className="h-64 flex items-end gap-3">
            {[3200, 4100, 3800, 5200, 4900, 6100, 5800].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-brand-gold/80" style={{ height: `${(v / 6500) * 100}%` }} />
                <span className="text-[10px] text-brand-textmuted">${(v / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <h3 className="font-serif text-xl text-brand-textmain mb-2">{t('charts.categoriesTitle')}</h3>
          <p className="text-xs text-brand-textmuted mb-4">1,240 {t('charts.totalBookings')}</p>
          <div className="space-y-3">
            {categories.map(c => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2 text-brand-textmain font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {t(`categories.${c.key}` as 'categories.massage')}
                  </span>
                  <span className="text-brand-textmuted">{c.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream/60 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tables row */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
        <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
          <div className="px-6 py-4 border-b border-brand-cream/50 bg-brand-ivory/30">
            <h3 className="font-serif text-xl text-brand-textmain">{t('tables.topServices')}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('tables.serviceName')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('tables.bookings')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('tables.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {services.map(s => (
                <tr key={s.name} className="hover:bg-brand-cream/20">
                  <td className="px-4 py-3 flex items-center gap-3 font-medium">
                    <span className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                      <s.Icon className="h-4 w-4" />
                    </span>
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-textmuted">{s.bookings}</td>
                  <td className="px-4 py-3 text-right font-medium">{s.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
          <div className="px-6 py-4 border-b border-brand-cream/50 bg-brand-ivory/30">
            <h3 className="font-serif text-xl text-brand-textmain">{t('tables.topStaff')}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('tables.staffName')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('tables.services')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('tables.revenue')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('tables.rating')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {staff.map(s => (
                <tr key={s.initials} className="hover:bg-brand-cream/20">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-cream font-serif text-xs flex items-center justify-center text-brand-textmain">
                      {s.initials}
                    </span>
                    <span className="font-medium">{s.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-brand-textmuted">{s.services}</td>
                  <td className="px-4 py-3 text-right font-medium">{s.revenue}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center text-brand-gold font-medium">
                      <Star className="w-3 h-3 mr-1 fill-current" /> {s.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Branch comparison */}
      <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
        <div className="mb-4">
          <h3 className="font-serif text-xl text-brand-textmain">{t('charts.branchTitle')}</h3>
          <p className="text-xs text-brand-textmuted mt-0.5">{t('charts.branchSubtitle')}</p>
        </div>
        <div className="space-y-4">
          {branches.map(b => (
            <div key={b.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-brand-textmain">{b.name}</span>
                <span className="text-brand-textmuted font-mono">${(b.revenue / 1000).toFixed(1)}k</span>
              </div>
              <div className="h-2 rounded-full bg-brand-cream/60 overflow-hidden">
                <div className="h-full rounded-full bg-brand-gold" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
