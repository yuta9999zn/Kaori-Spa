import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Building, Layers, Users, DollarSign, ArrowUp } from 'lucide-react';

export default async function TenantDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  const kpis = [
    { key: 'tenants',  value: '1',     delta: '+1', Icon: Building },
    { key: 'branches', value: '2',     delta: '+0', Icon: Layers },
    { key: 'users',    value: '14',    delta: '+2', Icon: Users },
    { key: 'mrr',      value: '4.99M ₫', delta: '+0%', Icon: DollarSign }
  ] as const;

  const recent = [
    { code: 'natural-beauty', name: 'Natural Beauty', plan: 'Professional', branches: 2, status: 'active', createdAt: '2026-04-01' }
  ];

  return (
    <>
      <h1 className="font-serif text-3xl mb-6">{t('title')}</h1>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        {kpis.map(({ key, value, delta, Icon }) => (
          <article key={key} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t(`kpi.${key}` as 'kpi.tenants')}</span>
              <Icon className="h-4 w-4 text-brand-gold" />
            </div>
            <p className="font-serif text-2xl">{value}</p>
            <p className="mt-1 text-xs flex items-center gap-1 text-emerald-600"><ArrowUp className="h-3 w-3" /> {delta}</p>
          </article>
        ))}
      </section>

      <article className="kpi-card">
        <h2 className="font-serif text-lg mb-4">{t('recentTenants')}</h2>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr><th className="text-left py-2">Code</th><th className="text-left">Name</th><th className="text-left">Plan</th><th className="text-right">Branches</th><th className="text-right">Created</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {recent.map(r => (
              <tr key={r.code}>
                <td className="py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                <td className="py-3">{r.name}</td>
                <td className="py-3"><span className="rounded-full bg-brand-gold/10 text-brand-gold px-2 py-0.5 text-[10px] uppercase">{r.plan}</span></td>
                <td className="py-3 text-right">{r.branches}</td>
                <td className="py-3 text-right text-brand-textmuted">{r.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
