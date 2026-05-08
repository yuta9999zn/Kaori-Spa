'use client';

import { Building, Layers, Users, Activity, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePlatformOverview } from '@/lib/hooks';

export default function AnalyticsView() {
  const t = useTranslations('analytics');
  const { data, error, loading } = usePlatformOverview();

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {t('errors.load')} ({error.message})
        </div>
      )}

      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Kpi
          label={t('kpi.tenants')}
          value={loading ? '…' : String(data?.tenantCount ?? 0)}
          Icon={Building}
        />
        <Kpi
          label={t('kpi.branches')}
          value={loading ? '…' : String(data?.branchCount ?? 0)}
          Icon={Layers}
        />
        <Kpi
          label={t('kpi.users')}
          value={loading ? '…' : String(data?.userCount ?? 0)}
          Icon={Users}
        />
        <Kpi
          label={t('kpi.active')}
          value={loading ? '…' : (data?.activeTenantsLast30d ?? 0) === 0 ? '—' : String(data!.activeTenantsLast30d)}
          hint={t('kpiActiveHint')}
          Icon={Activity}
        />
      </section>

      {/* Recent tenants */}
      <article className="kpi-card mb-8">
        <h2 className="font-serif text-xl text-brand-textmain mb-4">{t('recent.title')}</h2>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left py-2">{t('recent.code')}</th>
              <th className="text-left">{t('recent.name')}</th>
              <th className="text-right">{t('recent.orgs')}</th>
              <th className="text-right">{t('recent.branches')}</th>
              <th className="text-right">{t('recent.createdAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-brand-textmuted">
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && (data?.recentTenants?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-brand-textmuted">
                  {t('recent.empty')}
                </td>
              </tr>
            )}
            {!loading && data?.recentTenants?.map(tn => (
              <tr key={tn.id}>
                <td className="py-3 font-mono text-xs text-brand-gold">{tn.code}</td>
                <td className="py-3">{tn.name}</td>
                <td className="py-3 text-right">{tn.orgCount}</td>
                <td className="py-3 text-right">{tn.branchCount}</td>
                <td className="py-3 text-right text-brand-textmuted">
                  {tn.createdAt ? new Date(tn.createdAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {/* TODO(M3+): replace with real chart widgets when analytics-service +
          billing data ships (revenue trend, top services, top staff,
          per-branch comparison). Mock visuals removed to avoid implying that
          BE supports them today. */}
      <section className="rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/40 p-6 text-center">
        <h3 className="font-serif text-lg text-brand-textmain">{t('charts.soonTitle')}</h3>
        <p className="text-xs text-brand-textmuted mt-1">{t('charts.soonHint')}</p>
      </section>
    </>
  );
}

function Kpi({
  label,
  value,
  hint,
  Icon
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: typeof Building;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</span>
        <Icon className="h-4 w-4 text-brand-gold" />
      </div>
      <p className="font-serif text-3xl">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-brand-textmuted">{hint}</p>}
    </article>
  );
}
