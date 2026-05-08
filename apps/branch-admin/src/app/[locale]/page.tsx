import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowUp, Calendar, UserCheck, Clock, UserPlus, DollarSign } from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  const kpis = [
    { key: 'revenue', value: '12.450.000 ₫', delta: '+18%', Icon: DollarSign },
    { key: 'bookings', value: '24', delta: '+5', Icon: Calendar },
    { key: 'checkedIn', value: '18', delta: '+12%', Icon: UserCheck },
    { key: 'pending', value: '6', delta: '-2', Icon: Clock },
    { key: 'newCustomers', value: '4', delta: '+1', Icon: UserPlus }
  ] as const;

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted">{t('subtitle', { time: new Date().toLocaleTimeString(locale) })}</p>
      </header>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-8">
        {kpis.map(({ key, value, delta, Icon }) => (
          <article key={key} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                {t(`kpi.${key}` as 'kpi.revenue')}
              </span>
              <Icon className="h-4 w-4 text-brand-gold" />
            </div>
            <p className="font-serif text-2xl text-brand-textmain">{value}</p>
            <p className="mt-1 text-xs flex items-center gap-1 text-emerald-600">
              <ArrowUp className="h-3 w-3" /> {delta}
            </p>
          </article>
        ))}
      </section>

      <DashboardCharts />


      <section className="grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('todayBookings')}</h2>
          <ul className="space-y-3">
            {[
              { code: 'BK-2026-001', customer: 'Nguyễn Thị Mai', service: 'Triệt VIO Combo', time: '10:00', status: 'confirmed' },
              { code: 'BK-2026-002', customer: 'Trần Thị Lan', service: 'Combo 10 buổi VIO', time: '11:30', status: 'in_progress' },
              { code: 'BK-2026-003', customer: 'Lê Thị Hoa', service: 'Yomogi Steam', time: '14:00', status: 'pending' },
              { code: 'BK-2026-004', customer: 'Phạm Thị Yến', service: 'Set 3 dịch vụ VIP', time: '16:00', status: 'pending' }
            ].map(b => (
              <li key={b.code} className="flex items-center justify-between rounded-xl border border-brand-cream/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{b.customer}</p>
                  <p className="text-xs text-brand-textmuted">{b.service}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-brand-textmain">{b.time}</span>
                  <StatusBadge status={b.status} />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('popularServices')}</h2>
          <ul className="space-y-3">
            {[
              { name: 'Combo 10 buổi VIO (Nữ)', count: 12, revenue: '64.800.000 ₫' },
              { name: 'Triệt Toàn Thân (Nữ)', count: 8, revenue: '8.000.000 ₫' },
              { name: 'Yomogi Steam', count: 6, revenue: '3.000.000 ₫' },
              { name: 'Set Beauty VIP', count: 3, revenue: '6.300.000 ₫' }
            ].map(s => (
              <li key={s.name}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span className="text-brand-textmain truncate pr-2">{s.name}</span>
                  <span className="text-brand-gold whitespace-nowrap">{s.revenue}</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, s.count * 8)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-emerald-50 text-emerald-700',
    done: 'bg-slate-50 text-slate-700',
    cancelled: 'bg-rose-50 text-rose-700'
  };
  return <span className={`rounded-full px-2 py-0.5 ${map[status] ?? 'bg-slate-50 text-slate-700'}`}>{status}</span>;
}
