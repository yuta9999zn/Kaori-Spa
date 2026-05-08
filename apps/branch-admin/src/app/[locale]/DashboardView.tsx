'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowUp, Calendar, UserCheck, Clock, UserPlus, DollarSign, Loader2
} from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';
import {
  useDailyRevenue, useTopServices, useStaff, useAttendance
} from '@/lib/hooks';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function DashboardView({ locale }: { locale: string }) {
  const t = useTranslations('dashboard');
  const today = new Date();
  const { data: daily, loading: dailyLoading } = useDailyRevenue(today.getFullYear(), today.getMonth() + 1);
  const { data: top, loading: topLoading } = useTopServices('month', 4);
  const { data: staff } = useStaff();
  const { data: attendance } = useAttendance();

  // Derive KPIs.
  const todayKey = today.toISOString().slice(0, 10);
  const todayRow = (daily ?? []).find(d => d.day === todayKey);
  const monthRevenue = (daily ?? []).reduce((s, d) => s + Number(d.revenue ?? 0), 0);
  const todayRevenue = todayRow ? Number(todayRow.revenue) : 0;
  const todayBookings = todayRow ? Number(todayRow.bookings) : 0;

  const checkedInCount = (attendance ?? []).filter(a => a.actualIn != null).length;
  const newCustomers = 0; // TODO(M1): /v1/customers?createdAfter=… not yet exposed.
  const pendingCount = Math.max(0, todayBookings - checkedInCount);

  const kpis = [
    { key: 'revenue',      value: VND(todayRevenue),                Icon: DollarSign, delta: VND(monthRevenue) },
    { key: 'bookings',     value: String(todayBookings),            Icon: Calendar,    delta: '' },
    { key: 'checkedIn',    value: String(checkedInCount),           Icon: UserCheck,   delta: `/${(staff ?? []).length}` },
    { key: 'pending',      value: String(pendingCount),             Icon: Clock,       delta: '' },
    { key: 'newCustomers', value: String(newCustomers),             Icon: UserPlus,    delta: '' }
  ] as const;

  const maxTopRevenue = Math.max(1, ...(top ?? []).map(t => Number(t.revenue)));

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted">
          {t('subtitle', { time: new Date().toLocaleTimeString(locale) })}
        </p>
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
            <p className="font-serif text-2xl text-brand-textmain">
              {dailyLoading && key === 'revenue' ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
            </p>
            {delta && (
              <p className="mt-1 text-xs flex items-center gap-1 text-emerald-600">
                <ArrowUp className="h-3 w-3" /> {delta}
              </p>
            )}
          </article>
        ))}
      </section>

      <DashboardCharts />

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('todayBookings')}</h2>
          <p className="text-sm text-brand-textmuted">
            {/* TODO(M1): wire today's booking list once /v1/bookings paged list is implemented. */}
            Chưa có dữ liệu — endpoint /v1/bookings list chưa sẵn sàng.
          </p>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('popularServices')}</h2>
          {topLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-brand-gold" /></div>
          ) : (top ?? []).length === 0 ? (
            <p className="text-sm text-brand-textmuted">Chưa có dữ liệu</p>
          ) : (
            <ul className="space-y-3">
              {(top ?? []).map(s => (
                <li key={s.serviceCode}>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="text-brand-textmain truncate pr-2 font-mono text-xs">{s.serviceCode}</span>
                    <span className="text-brand-gold whitespace-nowrap">{VND(Number(s.revenue))}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                    <div
                      className="h-full bg-brand-gold"
                      style={{ width: `${Math.min(100, (Number(s.revenue) / maxTopRevenue) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-brand-textmuted mt-0.5">{s.times} lượt</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}
