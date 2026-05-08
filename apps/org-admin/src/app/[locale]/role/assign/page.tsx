import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ShieldCheck, Plus, Search, Users, Clock, AlertTriangle, Building2 } from 'lucide-react';

// TODO(backend): role assignment CRUD endpoints not exposed yet — auth-service
// needs /v1/role-assignments + scope queries before this page can be wired.

export default async function RoleAssignPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('roleAssign');

  const rows = [
    { id: 'AS-2026-001', userName: 'Nguyễn Thị Mai',    email: 'mai.nguyen@naturalbeauty.vn',    role: 'ORG_OWNER',       scope: 'Toàn tổ chức',                assignedBy: 'Kaori Admin',     assignedAt: '2026-01-12', expires: '—',          status: 'active'  },
    { id: 'AS-2026-002', userName: 'Trần Quốc Hùng',    email: 'hung.tran@naturalbeauty.vn',     role: 'BRANCH_MANAGER',  scope: 'BR-HCM-01 · Quận 1',          assignedBy: 'Nguyễn Thị Mai',  assignedAt: '2026-02-04', expires: '2027-02-04', status: 'active'  },
    { id: 'AS-2026-003', userName: 'Lê Thanh Hà',       email: 'ha.le@naturalbeauty.vn',         role: 'RECEPTIONIST',    scope: 'BR-HCM-02 · Quận 7',          assignedBy: 'Trần Quốc Hùng',  assignedAt: '2026-03-15', expires: '2026-09-15', status: 'expired' },
    { id: 'AS-2026-004', userName: 'Phạm Yến Nhi',      email: 'nhi.pham@naturalbeauty.vn',      role: 'THERAPIST',       scope: 'BR-HN-01 · Hà Nội',           assignedBy: 'Trần Quốc Hùng',  assignedAt: '2026-04-22', expires: '2027-04-22', status: 'active'  },
    { id: 'AS-2026-005', userName: 'Đặng Khánh Linh',   email: 'linh.dang@naturalbeauty.vn',     role: 'ACCOUNTANT',      scope: 'Toàn tổ chức',                assignedBy: 'Nguyễn Thị Mai',  assignedAt: '2026-05-01', expires: '—',          status: 'pending' },
    { id: 'AS-2026-006', userName: 'Hoàng Minh Tuấn',   email: 'tuan.hoang@naturalbeauty.vn',    role: 'THERAPIST',       scope: 'BR-DN-01 · Đà Nẵng',          assignedBy: 'Trần Quốc Hùng',  assignedAt: '2026-05-04', expires: '2026-05-25', status: 'active'  }
  ];

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
        <button className="btn-primary">
          <Plus className="h-4 w-4" /> {t('create')}
        </button>
      </header>

      {/* KPI summary */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard label={t('kpi.users')}    value="42" Icon={Users}          accent="text-brand-gold" bg="bg-brand-gold/10" />
        <KpiCard label={t('kpi.pending')}  value="3"  Icon={Clock}          accent="text-blue-600"   bg="bg-blue-50" />
        <KpiCard label={t('kpi.expiring')} value="2"  Icon={AlertTriangle}  accent="text-brand-rose" bg="bg-brand-rose/10" />
        <KpiCard label={t('kpi.branches')} value="5"  Icon={Building2}      accent="text-emerald-600" bg="bg-emerald-50" />
      </section>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[260px] items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input className="flex-1 bg-transparent text-sm outline-none" placeholder={t('filter.search')} />
        </div>
        <select defaultValue="all" className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold">
          <option value="all">{t('filter.all')}</option>
          <option value="ORG_OWNER">ORG_OWNER</option>
          <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
          <option value="RECEPTIONIST">RECEPTIONIST</option>
          <option value="THERAPIST">THERAPIST</option>
          <option value="ACCOUNTANT">ACCOUNTANT</option>
        </select>
        <select defaultValue="all" className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold">
          <option value="all">{t('filter.scopeAll')}</option>
          <option value="org">org</option>
          <option value="BR-HCM-01">BR-HCM-01</option>
          <option value="BR-HCM-02">BR-HCM-02</option>
          <option value="BR-HN-01">BR-HN-01</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['user', 'role', 'scope', 'assignedBy', 'assignedAt', 'expires', 'status', 'actions'] as const).map(c => (
                <th key={c} className={`px-4 py-3 font-medium ${c === 'status' || c === 'actions' ? 'text-center' : 'text-left'}`}>
                  {t(`columns.${c}` as 'columns.user')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-brand-rose text-[11px] font-serif text-white">
                      {r.userName.split(' ').slice(-1)[0]?.[0] ?? '?'}
                    </span>
                    <div>
                      <p className="font-medium text-brand-textmain">{r.userName}</p>
                      <p className="text-[11px] text-brand-textmuted">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.role}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.scope}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.assignedBy}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-brand-textmuted">{r.assignedAt}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-brand-textmuted">{r.expires}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={r.status} label={t(`status.${r.status}` as 'status.active')} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 text-[11px] font-medium text-brand-textmain hover:border-brand-gold hover:text-brand-gold transition">
                      {t('actions.extend')}
                    </button>
                    <button className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-100 transition">
                      {t('actions.revoke')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-slate-50 text-slate-600 border-slate-200'
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${map[status] ?? ''}`}>
      {label}
    </span>
  );
}
