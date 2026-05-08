'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, Building2, DollarSign, Loader2, UserPlus, Users } from 'lucide-react';
import {
  useBranches, useBranchReport, useLeaderboardBranches
} from '@/lib/hooks';

/**
 * Org dashboard — composes /v1/orgs/.../branches + /v1/reports/revenue/by-branch +
 * /v1/leaderboard/branches.  No single backend aggregator exists today
 * (TODO: tenant-service composite KPI endpoint), so we fan out from the
 * client.  Empty backend responses fall back to design-time demo numbers.
 */
export default function DashboardView() {
  const t = useTranslations('dashboard');

  const today = new Date();
  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  }, []);
  const todayStr = today.toISOString().slice(0, 10);

  const branchesQ = useBranches();
  const reportQ = useBranchReport({ from: monthStart, to: todayStr, topLimit: 0 });
  const leaderQ = useLeaderboardBranches('revenue', 5);

  const loading = branchesQ.loading && reportQ.loading && leaderQ.loading;

  const branchCount = branchesQ.data?.length ?? 2;
  const branches = branchesQ.data ?? [];

  const totalRevenue = (reportQ.data?.byBranch ?? []).reduce(
    (s, r) => s + Number(r.revenue || 0), 0
  );
  const totalBookings = (reportQ.data?.byBranch ?? []).reduce(
    (s, r) => s + Number(r.bookings || 0), 0
  );

  const fmtVnd = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  const branchLookup = new Map(branches.map(b => [b.id, b.name?.vi ?? b.name?.en ?? b.code]));

  // Compose per-branch summary table from leaderboard + report
  const branchPerf = (reportQ.data?.byBranch && reportQ.data.byBranch.length > 0)
    ? reportQ.data.byBranch.slice(0, 5).map(r => ({
        name: branchLookup.get(r.branchId) ?? r.branchId.slice(0, 8),
        bookings: r.bookings,
        revenue: fmtVnd(Number(r.revenue)),
        growth: '—'  // TODO: compute month-over-month delta when backend exposes
      }))
    : [
        { name: 'Kim Mã 575', bookings: 142, revenue: '198.300.000 ₫', growth: '+18%' },
        { name: 'Kim Mã 625', bookings: 98,  revenue: '150.200.000 ₫', growth: '+12%' }
      ];

  // KPIs — staff/customer counts not yet exposed at org-level (TODO: aggregator endpoint).
  const kpis = [
    { key: 'branches' as const, value: String(branchCount),                 delta: '+0',  Icon: Building2 },
    { key: 'staff'    as const, value: '14',                                delta: '+2',  Icon: Users },
    { key: 'customers' as const, value: '1.842',                            delta: '+38', Icon: UserPlus },
    { key: 'revenue'  as const, value: totalRevenue > 0 ? fmtVnd(totalRevenue) : '348.500.000 ₫',
      delta: totalBookings > 0 ? `${totalBookings} booking` : '+22%', Icon: DollarSign }
  ];

  return (
    <>
      <h1 className="font-serif text-3xl text-brand-textmain mb-6">{t('title')}</h1>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-brand-textmuted">
          <Loader2 className="h-3 w-3 animate-spin" /> Đang tải…
        </div>
      )}

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        {kpis.map(({ key, value, delta, Icon }) => (
          <article key={key} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                {t(`kpi.${key}` as 'kpi.branches')}
              </span>
              <Icon className="h-4 w-4 text-brand-gold" />
            </div>
            <p className="font-serif text-2xl">{value}</p>
            <p className="mt-1 text-xs flex items-center gap-1 text-emerald-600">
              <ArrowUp className="h-3 w-3" /> {delta}
            </p>
          </article>
        ))}
      </section>

      <article className="kpi-card">
        <h2 className="font-serif text-lg mb-4">{t('branchSummary')}</h2>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left py-2">Branch</th>
              <th className="text-right">Bookings</th>
              <th className="text-right">Revenue</th>
              <th className="text-right">Growth</th>
            </tr>
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
