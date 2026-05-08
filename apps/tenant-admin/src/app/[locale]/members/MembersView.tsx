'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Users, CheckCircle, MailWarning, Shield, Crown, Search, UserPlus, Download,
  MoreVertical, Loader2
} from 'lucide-react';
import { useMembers, type TenantMemberDto } from '@/lib/hooks';

type RoleKey = 'owner' | 'manager' | 'therapist' | 'receptionist' | 'marketing' | 'hr';
type StatusKey = 'active' | 'invited' | 'suspended';
type StatusFilter = 'all' | StatusKey;

const PAGE_SIZE = 20;

const roleStyles: Record<RoleKey, string> = {
  owner:        'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
  manager:      'bg-gray-100 text-gray-700 border-gray-200',
  therapist:    'bg-teal-50 text-teal-700 border-teal-100',
  receptionist: 'bg-brand-rose/10 text-brand-rose border-brand-rose/20',
  marketing:    'bg-blue-50 text-blue-700 border-blue-100',
  hr:           'bg-purple-50 text-purple-700 border-purple-100'
};

const statusStyles: Record<StatusKey, { dot: string; pill: string }> = {
  active:    { dot: 'bg-emerald-500', pill: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  invited:   { dot: 'bg-amber-500',   pill: 'text-amber-700 bg-amber-50 border-amber-200' },
  suspended: { dot: 'bg-red-500',     pill: 'text-red-700 bg-red-50 border-red-200' }
};

/** Map BE role codes (eg. ORG_OWNER, BRANCH_MANAGER, …) onto the UI palette. */
function pickRoleKey(roles: string[]): RoleKey {
  const upper = roles.map(r => r.toUpperCase());
  if (upper.some(r => r.includes('OWNER'))) return 'owner';
  if (upper.some(r => r.includes('MANAGER'))) return 'manager';
  if (upper.some(r => r.includes('THERAPIST') || r.includes('TECHNICIAN'))) return 'therapist';
  if (upper.some(r => r.includes('RECEPTION'))) return 'receptionist';
  if (upper.some(r => r.includes('MARKET'))) return 'marketing';
  if (upper.some(r => r.includes('HR') || r.includes('HUMAN'))) return 'hr';
  return 'manager';
}

function pickStatusKey(status: string | null | undefined): StatusKey {
  const s = (status ?? '').toLowerCase();
  if (s === 'invited' || s === 'pending') return 'invited';
  if (s === 'suspended' || s === 'disabled' || s === 'inactive') return 'suspended';
  return 'active';
}

function initialsOf(m: TenantMemberDto): string {
  const src = m.fullName ?? m.email ?? '?';
  const parts = src.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function MembersView() {
  const t = useTranslations('members');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);

  const { data, error, loading } = useMembers({
    q: q || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    size: PAGE_SIZE
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = total > 0 ? Math.ceil(total / PAGE_SIZE) - 1 : 0;
  const fromIdx = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = total === 0 ? 0 : page * PAGE_SIZE + items.length;

  // KPIs derived from current page only — totals across pages need a future BE summary endpoint.
  const kpiActive  = items.filter(m => pickStatusKey(m.status) === 'active').length;
  const kpiPending = items.filter(m => pickStatusKey(m.status) === 'invited').length;
  const kpiAdmins  = items.filter(m =>
    m.roles.some(r => r.toUpperCase().includes('OWNER') || r.toUpperCase().includes('SUPER_ADMIN'))
  ).length;

  const kpis = [
    { key: 'total',   value: total,      Icon: Users,        tint: 'bg-brand-ivory text-brand-gold border-brand-cream' },
    { key: 'active',  value: kpiActive,  Icon: CheckCircle,  tint: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { key: 'pending', value: kpiPending, Icon: MailWarning,  tint: 'bg-amber-50 text-amber-500 border-amber-100' },
    { key: 'admins',  value: kpiAdmins,  Icon: Shield,       tint: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' }
  ] as const;

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" disabled><Download className="h-4 w-4" /> {t('actions.export')}</button>
          <button className="btn-primary" disabled><UserPlus className="h-4 w-4" /> {t('actions.invite')}</button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map(({ key, value, Icon, tint }) => (
          <article key={key} className="kpi-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">
                {t(`kpi.${key}` as 'kpi.total')}
              </p>
              <h3 className={`font-serif text-2xl ${key === 'admins' ? 'text-brand-gold' : 'text-brand-textmain'}`}>{value}</h3>
            </div>
          </article>
        ))}
      </section>

      {/* Filter bar + table */}
      <section className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="p-5 border-b border-brand-cream/60 bg-brand-ivory/40 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex items-center bg-white rounded-xl border border-brand-cream px-3 py-2 w-full lg:w-96 focus-within:border-brand-gold transition">
            <Search className="h-4 w-4 text-brand-textmuted mr-2" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(0); }}
              placeholder={t('actions.search')}
              className="flex-1 bg-transparent text-sm outline-none placeholder-brand-textmuted/70 text-brand-textmain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(0); }}
              className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm text-brand-textmain"
            >
              <option value="all">{t('filters.allStatuses')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="invited">{t('status.invited')}</option>
              <option value="suspended">{t('status.suspended')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                {(['member', 'role', 'branch', 'status', 'lastLogin', 'actions'] as const).map(c => (
                  <th key={c} className={`px-5 py-3 font-medium ${c === 'actions' ? 'text-right' : 'text-left'}`}>
                    {t(`columns.${c}` as 'columns.member')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {loading && (
                <tr><td colSpan={6} className="px-5 py-10 text-center">
                  <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
                </td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-rose-600">
                  {error.message}
                </td></tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-brand-textmuted">—</td></tr>
              )}
              {!loading && !error && items.map(m => {
                const roleKey = pickRoleKey(m.roles);
                const statusKey = pickStatusKey(m.status);
                const branchLabel = m.branches.length === 0
                  ? t('status.global')
                  : m.branches.length === 1
                    ? m.branches[0]!.slice(0, 8) + '…'
                    : `${m.branches.length} branches`;
                const isGlobal = m.branches.length === 0;
                return (
                  <tr key={m.userId} className="hover:bg-brand-cream/20 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-full font-serif text-sm flex items-center justify-center shrink-0 ${
                          roleKey === 'owner'
                            ? 'bg-gradient-to-br from-brand-gold to-brand-rose text-white'
                            : statusKey === 'invited'
                              ? 'bg-brand-ivory border border-dashed border-brand-cream text-brand-textmuted'
                              : 'bg-brand-cream text-brand-textmain border border-white shadow-sm'
                        }`}>
                          {initialsOf(m)}
                        </span>
                        <div>
                          <p className="font-medium text-brand-textmain">{m.fullName ?? m.email ?? '—'}</p>
                          <p className="text-xs text-brand-textmuted">{m.email ?? m.phone ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleStyles[roleKey]}`}>
                        {roleKey === 'owner' && <Crown className="h-3 w-3" />}
                        {t(`roles.${roleKey}` as 'roles.owner')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-brand-textmain font-mono text-xs">{branchLabel}</p>
                      {isGlobal && <p className="text-[10px] uppercase tracking-wider text-brand-textmuted">{t('status.global')}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[statusKey].pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[statusKey].dot}`} />
                        {t(`status.${statusKey}` as 'status.active')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-brand-textmuted">
                      {statusKey === 'invited'
                        ? <em>{t('status.neverLogin')}</em>
                        : (m.lastLogin ?? '—')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-2 rounded-full text-brand-textmuted hover:text-brand-gold hover:bg-brand-cream/40 transition">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-brand-cream/60 flex justify-between items-center text-sm text-brand-textmuted bg-brand-ivory/30">
          <p>
            {t('pagination.showing')} <span className="font-medium text-brand-textmain">{fromIdx}</span> {t('pagination.to')}{' '}
            <span className="font-medium text-brand-textmain">{toIdx}</span> {t('pagination.of')}{' '}
            <span className="font-medium text-brand-textmain">{total}</span> {t('pagination.users')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page <= 0}
              className="px-3 py-1.5 rounded-lg border border-brand-cream bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-gold transition"
            >
              {t('pagination.previous')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="px-3 py-1.5 rounded-lg border border-brand-cream bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-gold transition"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
