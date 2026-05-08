import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Building2, Users, UserPlus, DollarSign, ArrowUp } from 'lucide-react';

export default async function OrgDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  const kpis = [
    { key: 'branches', value: '2', delta: '+0', Icon: Building2 },
    { key: 'staff', value: '14', delta: '+2', Icon: Users },
    { key: 'customers', value: '1.842', delta: '+38', Icon: UserPlus },
    { key: 'revenue', value: '348.500.000 ₫', delta: '+22%', Icon: DollarSign }
  ] as const;

  const branchPerf = [
    { name: 'Kim Mã 575', bookings: 142, revenue: '198.300.000 ₫', growth: '+18%' },
    { name: 'Kim Mã 625', bookings: 98,  revenue: '150.200.000 ₫', growth: '+12%' }
  ];

  return (
    <>
      <h1 className="font-serif text-3xl text-brand-textmain mb-6">{t('title')}</h1>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        {kpis.map(({ key, value, delta, Icon }) => (
          <article key={key} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t(`kpi.${key}` as 'kpi.branches')}</span>
              <Icon className="h-4 w-4 text-brand-gold" />
            </div>
            <p className="font-serif text-2xl">{value}</p>
            <p className="mt-1 text-xs flex items-center gap-1 text-emerald-600"><ArrowUp className="h-3 w-3" /> {delta}</p>
          </article>
        ))}
      </section>

      <article className="kpi-card">
        <h2 className="font-serif text-lg mb-4">{t('branchSummary')}</h2>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr><th className="text-left py-2">Branch</th><th className="text-right">Bookings</th><th className="text-right">Revenue</th><th className="text-right">Growth</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {branchPerf.map(b => (
              <tr key={b.name}>
                <td className="py-3">{b.name}</td>
                <td className="py-3 text-right">{b.bookings}</td>
                <td className="py-3 text-right text-brand-gold">{b.revenue}</td>
                <td className="py-3 text-right text-emerald-600">{b.growth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
