// TODO(M3+): wire when auth-service ships a platform-wide member listing endpoint
//            (currently only branch-scoped staff endpoints exist).
import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Users, CheckCircle, MailWarning, Shield, Crown, Search, UserPlus, Download, MoreVertical
} from 'lucide-react';

type RoleKey = 'owner' | 'manager' | 'therapist' | 'receptionist' | 'marketing' | 'hr';
type StatusKey = 'active' | 'invited' | 'suspended';

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

export default async function MembersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('members');

  const kpis = [
    { key: 'total',   value: 42, Icon: Users,        tint: 'bg-brand-ivory text-brand-gold border-brand-cream' },
    { key: 'active',  value: 38, Icon: CheckCircle,  tint: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { key: 'pending', value: 3,  Icon: MailWarning,  tint: 'bg-amber-50 text-amber-500 border-amber-100' },
    { key: 'admins',  value: 5,  Icon: Shield,       tint: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' }
  ] as const;

  const rows: Array<{
    initials: string; name: string; email: string;
    role: RoleKey; branch: string; global?: boolean;
    status: StatusKey; lastLogin: string;
  }> = [
    { initials: 'SM', name: 'Sarah Miller',     email: 'sarah@naturalbeauty.vn',           role: 'owner',        branch: 'All locations', global: true, status: 'active',    lastLogin: 'Just now' },
    { initials: 'AN', name: 'Anna Nguyen',      email: 'anna.n@naturalbeauty.vn',          role: 'manager',      branch: 'District 1',                  status: 'active',    lastLogin: '2 hours ago' },
    { initials: 'ER', name: 'Elena Rodriguez',  email: 'elena@naturalbeauty.vn',           role: 'therapist',    branch: 'District 1',                  status: 'active',    lastLogin: 'Yesterday, 09:15' },
    { initials: 'JS', name: 'Jessica Smith',    email: 'jessica@naturalbeauty.vn',         role: 'receptionist', branch: 'Westside',                    status: 'invited',   lastLogin: '—' },
    { initials: 'RJ', name: 'Robert James',     email: 'robert.marketing@naturalbeauty.vn',role: 'marketing',    branch: 'All locations', global: true, status: 'suspended', lastLogin: '2026-04-12' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('actions.export')}</button>
          <button className="btn-primary"><UserPlus className="h-4 w-4" /> {t('actions.invite')}</button>
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
              placeholder={t('actions.search')}
              className="flex-1 bg-transparent text-sm outline-none placeholder-brand-textmuted/70 text-brand-textmain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm text-brand-textmain">
              <option>{t('filters.allRoles')}</option>
            </select>
            <select className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm text-brand-textmain">
              <option>{t('filters.allBranches')}</option>
            </select>
            <select className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm text-brand-textmain">
              <option>{t('filters.allStatuses')}</option>
            </select>
            <select className="rounded-xl border border-brand-cream bg-brand-cream/30 px-3 py-2 text-sm font-medium text-brand-textmain">
              <option>{t('filters.sortNewest')}</option>
              <option>{t('filters.sortAlpha')}</option>
              <option>{t('filters.sortRole')}</option>
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
              {rows.map(r => (
                <tr key={r.email} className="hover:bg-brand-cream/20 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-full font-serif text-sm flex items-center justify-center shrink-0 ${
                        r.role === 'owner'
                          ? 'bg-gradient-to-br from-brand-gold to-brand-rose text-white'
                          : r.status === 'invited'
                            ? 'bg-brand-ivory border border-dashed border-brand-cream text-brand-textmuted'
                            : 'bg-brand-cream text-brand-textmain border border-white shadow-sm'
                      }`}>
                        {r.initials}
                      </span>
                      <div>
                        <p className="font-medium text-brand-textmain">{r.name}</p>
                        <p className="text-xs text-brand-textmuted">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleStyles[r.role]}`}>
                      {r.role === 'owner' && <Crown className="h-3 w-3" />}
                      {t(`roles.${r.role}` as 'roles.owner')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-brand-textmain">{r.branch}</p>
                    {r.global && <p className="text-[10px] uppercase tracking-wider text-brand-textmuted">{t('status.global')}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[r.status].pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[r.status].dot}`} />
                      {t(`status.${r.status}` as 'status.active')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-brand-textmuted">
                    {r.status === 'invited' ? <em>{t('status.neverLogin')}</em> : r.lastLogin}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-2 rounded-full text-brand-textmuted hover:text-brand-gold hover:bg-brand-cream/40 transition">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-brand-cream/60 flex justify-between items-center text-sm text-brand-textmuted bg-brand-ivory/30">
          <p>
            {t('pagination.showing')} <span className="font-medium text-brand-textmain">1</span> {t('pagination.to')}{' '}
            <span className="font-medium text-brand-textmain">{rows.length}</span> {t('pagination.of')}{' '}
            <span className="font-medium text-brand-textmain">42</span> {t('pagination.users')}
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-brand-cream bg-white opacity-50 cursor-not-allowed">{t('pagination.previous')}</button>
            <button className="px-3 py-1.5 rounded-lg border border-brand-cream bg-white hover:border-brand-gold transition">{t('pagination.next')}</button>
          </div>
        </div>
      </section>
    </>
  );
}
