'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Plus, Search, Users, Building2, Loader2 } from 'lucide-react';
import { useUserRoles, revokeUserRole, ORG_ID } from '@/lib/hooks';
import { ApiError } from '@/lib/api';

export default function RoleAssignView() {
  const t = useTranslations('roleAssign');
  const { data, loading, error, refetch } = useUserRoles({ orgId: ORG_ID });
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const rows = data?.items ?? [];

  const distinctRoles = useMemo(
    () => Array.from(new Set(rows.map(r => r.roleCode))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (roleFilter !== 'all' && r.roleCode !== roleFilter) return false;
      if (!needle) return true;
      return (
        (r.userFullName ?? '').toLowerCase().includes(needle) ||
        r.userEmail.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, roleFilter]);

  const handleRevoke = async (userId: string, roleId: string, scopeOrgId: string | null, scopeBranchId: string | null) => {
    setBusy(`${userId}:${roleId}`);
    setRevokeError(null);
    try {
      await revokeUserRole(userId, roleId, scopeOrgId ?? undefined, scopeBranchId ?? undefined);
      await refetch();
    } catch (e) {
      const err = e as ApiError;
      setRevokeError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const usersCount = new Set(rows.map(r => r.userId)).size;
  const branchesCount = new Set(rows.map(r => r.scopeBranchId).filter(Boolean) as string[]).size;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
        <button className="btn-primary" disabled>
          <Plus className="h-4 w-4" /> {t('create')}
        </button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard label={t('kpi.users')}    value={String(usersCount)}    Icon={Users}     accent="text-brand-gold"  bg="bg-brand-gold/10" />
        <KpiCard label={t('kpi.branches')} value={String(branchesCount)} Icon={Building2} accent="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard label="Tổng gán"          value={String(rows.length)}   Icon={ShieldCheck} accent="text-blue-600"  bg="bg-blue-50" />
        <KpiCard label="Vai trò"           value={String(distinctRoles.length)} Icon={Users} accent="text-brand-rose" bg="bg-brand-rose/10" />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[260px] items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('filter.search')}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold"
        >
          <option value="all">{t('filter.all')}</option>
          {distinctRoles.map(rc => <option key={rc} value={rc}>{rc}</option>)}
        </select>
      </div>

      {revokeError && (
        <p className="mb-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-600">
          {revokeError}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['user', 'role', 'scope', 'assignedAt', 'actions'] as const).map(c => (
                <th key={c} className={`px-4 py-3 font-medium ${c === 'actions' ? 'text-center' : 'text-left'}`}>
                  {t(`columns.${c}` as 'columns.user')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-rose-600">{error.message}</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                Chưa có gán vai trò nào.
              </td></tr>
            )}
            {!loading && filtered.map(r => {
              const busyKey = `${r.userId}:${r.roleId}`;
              return (
                <tr key={busyKey} className="hover:bg-brand-cream/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-brand-rose text-[11px] font-serif text-white">
                        {(r.userFullName ?? r.userEmail)[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-brand-textmain">{r.userFullName ?? '—'}</p>
                        <p className="text-[11px] text-brand-textmuted">{r.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.roleCode}</td>
                  <td className="px-4 py-3 text-brand-textmuted text-xs">
                    {r.scopeBranchId
                      ? `branch:${r.scopeBranchId.slice(0, 8)}`
                      : r.scopeOrgId
                        ? `org:${r.scopeOrgId.slice(0, 8)}`
                        : 'tenant'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-brand-textmuted">
                    {new Date(r.grantedAt).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={busy === busyKey}
                      onClick={() => handleRevoke(r.userId, r.roleId, r.scopeOrgId, r.scopeBranchId)}
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      {busy === busyKey ? '…' : t('actions.revoke')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function KpiCard({
  label, value, Icon, accent, bg
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-3xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
