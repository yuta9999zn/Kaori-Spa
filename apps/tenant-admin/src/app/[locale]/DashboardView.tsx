'use client';

import { Building, Layers, Users, DollarSign, ArrowUp, Loader2 } from 'lucide-react';
import { useTenantOverview } from '@/lib/hooks';

interface Labels {
  title: string;
  recentTenants: string;
  kpi: {
    tenants: string;
    branches: string;
    users: string;
    mrr: string;
  };
}

// TODO(M3+): branches / users / MRR are not exposed by any platform-admin
// endpoint yet. Wire when tenant-service ships aggregate stats and a
// billing/MRR service ships.
const BRANCHES_PLACEHOLDER = '—';
const USERS_PLACEHOLDER = '—';
const MRR_PLACEHOLDER = '—';
const PLAN_PLACEHOLDER = 'Professional';

export default function DashboardView({ labels: t }: { labels: Labels }) {
  const { data, loading, error } = useTenantOverview();
  const orgs = data?.orgs ?? [];

  const tenantsValue = loading ? '…' : String(data?.orgCount ?? 0);

  return (
    <>
      <h1 className="font-serif text-3xl mb-6">{t.title}</h1>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {error.message}
        </div>
      )}

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        <Kpi label={t.kpi.tenants} value={tenantsValue} delta="+0" Icon={Building} />
        <Kpi label={t.kpi.branches} value={BRANCHES_PLACEHOLDER} delta="+0" Icon={Layers} />
        <Kpi label={t.kpi.users} value={USERS_PLACEHOLDER} delta="+0" Icon={Users} />
        <Kpi label={t.kpi.mrr} value={MRR_PLACEHOLDER} delta="+0%" Icon={DollarSign} />
      </section>

      <article className="kpi-card">
        <h2 className="font-serif text-lg mb-4">{t.recentTenants}</h2>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left py-2">Code</th>
              <th className="text-left">Name</th>
              <th className="text-left">Plan</th>
              <th className="text-right">Branches</th>
              <th className="text-right">Created</th>
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
            {!loading && orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-brand-textmuted">—</td>
              </tr>
            )}
            {orgs.slice(0, 5).map(o => (
              <tr key={o.id}>
                <td className="py-3 font-mono text-xs text-brand-gold">{o.code}</td>
                <td className="py-3">{o.name?.vi ?? o.name?.en ?? o.slug}</td>
                <td className="py-3">
                  <span className="rounded-full bg-brand-gold/10 text-brand-gold px-2 py-0.5 text-[10px] uppercase">
                    {PLAN_PLACEHOLDER}
                  </span>
                </td>
                <td className="py-3 text-right">{BRANCHES_PLACEHOLDER}</td>
                <td className="py-3 text-right text-brand-textmuted">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}

function Kpi({ label, value, delta, Icon }:
  { label: string; value: string; delta: string; Icon: typeof Building }) {
  return (
    <article className="kpi-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</span>
        <Icon className="h-4 w-4 text-brand-gold" />
      </div>
      <p className="font-serif text-2xl">{value}</p>
      <p className="mt-1 text-xs flex items-center gap-1 text-emerald-600">
        <ArrowUp className="h-3 w-3" /> {delta}
      </p>
    </article>
  );
}
