import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Shield, Save, RotateCcw, Briefcase, Megaphone, PieChart, Settings, Check, ListChecks } from 'lucide-react';

// TODO(backend): role/permission matrix CRUD not implemented in auth-service
// yet — see /role/page.tsx note. Renders from a static GROUPS array.

type Cell = boolean | 'na';
type ModuleRow = { key: string; label: string; perms: Cell[] }; // [view, create, edit, delete, manage]

const GROUPS: { key: 'operations' | 'marketing' | 'analytics' | 'tenant'; Icon: React.ComponentType<{ className?: string }>; modules: ModuleRow[] }[] = [
  {
    key: 'operations',
    Icon: Briefcase,
    modules: [
      { key: 'service',  label: 'Dịch vụ',     perms: [true,  false, false, false, false] },
      { key: 'booking',  label: 'Đặt lịch',    perms: [true,  true,  true,  true,  true ] },
      { key: 'customer', label: 'Khách hàng',  perms: [true,  true,  true,  false, false] },
      { key: 'staff',    label: 'Nhân viên',   perms: [true,  false, true,  false, false] },
      { key: 'room',     label: 'Phòng',       perms: [true,  false, false, false, false] }
    ]
  },
  {
    key: 'marketing',
    Icon: Megaphone,
    modules: [
      { key: 'campaign', label: 'Chiến dịch',  perms: [false, false, false, false, false] },
      { key: 'voucher',  label: 'Voucher',     perms: [true,  false, false, false, false] }
    ]
  },
  {
    key: 'analytics',
    Icon: PieChart,
    modules: [
      { key: 'globalReport', label: 'Báo cáo tổ chức',  perms: [false, 'na', 'na', 'na', 'na'] },
      { key: 'branchReport', label: 'Báo cáo chi nhánh', perms: [true,  'na', 'na', 'na', 'na'] }
    ]
  },
  {
    key: 'tenant',
    Icon: Settings,
    modules: [
      { key: 'branch',  label: 'Chi nhánh',     perms: [false, false, false, false, false] },
      { key: 'role',    label: 'Vai trò & quyền', perms: [false, false, false, false, false] },
      { key: 'audit',   label: 'Audit log',     perms: [false, 'na', 'na', 'na', 'na'] }
    ]
  }
];

const PERM_COLS = ['view', 'create', 'edit', 'delete', 'manage'] as const;

export default async function PermissionMatrixPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('permissionMatrix');

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Shield className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost">
            <RotateCcw className="h-4 w-4" /> {t('reset')}
          </button>
          <button className="btn-primary">
            <Save className="h-4 w-4" /> {t('save')}
          </button>
        </div>
      </header>

      {/* Role context */}
      <section className="kpi-card mb-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('role')}</p>
            <p className="mt-1 font-serif text-xl text-brand-textmain">BRANCH_MANAGER</p>
          </div>
          <span className="hidden h-10 w-px bg-brand-cream md:block" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('scope')}</p>
            <p className="mt-1 text-sm font-medium text-brand-textmain">Branch</p>
          </div>
          <span className="hidden h-10 w-px bg-brand-cream md:block" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('assigned')}</p>
            <p className="mt-1 text-sm font-medium text-brand-gold">5 {t('users')}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-4">
        {/* Matrix groups */}
        <div className="space-y-6 xl:col-span-3">
          {GROUPS.map(g => (
            <section key={g.key} className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
              <header className="flex items-center justify-between border-b border-brand-cream bg-brand-ivory/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                    <g.Icon className="h-4 w-4" />
                  </span>
                  <h2 className="font-serif text-lg text-brand-textmain">{t(`groups.${g.key}` as 'groups.operations')}</h2>
                </div>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">{t('columns.module')}</th>
                      {PERM_COLS.map(p => (
                        <th key={p} className="text-center px-3 py-3 font-medium">
                          {t(`columns.${p}` as 'columns.view')}
                        </th>
                      ))}
                      <th className="text-center px-3 py-3 font-medium border-l border-brand-cream">{t('columns.all')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream/60">
                    {g.modules.map(m => {
                      const all = m.perms.every(p => p === true);
                      return (
                        <tr key={m.key} className="hover:bg-brand-cream/20">
                          <td className="px-6 py-3 font-medium text-brand-textmain">{m.label}</td>
                          {m.perms.map((p, i) => (
                            <td key={i} className="px-3 py-3 text-center">
                              {p === 'na' ? (
                                <span className="text-brand-textmuted/50">—</span>
                              ) : p ? (
                                <Check className="inline h-4 w-4 text-emerald-600" />
                              ) : (
                                <span className="text-brand-textmuted/40">·</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center border-l border-brand-cream">
                            {all ? <Check className="inline h-4 w-4 text-brand-gold" /> : <span className="text-brand-textmuted/40">·</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        {/* Summary */}
        <aside className="xl:col-span-1">
          <div className="kpi-card sticky top-6">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-5 w-5 text-brand-gold" />
              <h2 className="font-serif text-lg text-brand-textmain">{t('summary')}</h2>
            </div>
            <p className="text-xs text-brand-textmuted leading-relaxed mb-4">{t('summaryDesc')}</p>
            <div className="flex flex-wrap gap-2">
              {GROUPS.flatMap(g =>
                g.modules
                  .filter(m => m.perms.some(p => p === true))
                  .map(m => {
                    const total = m.perms.filter(p => p !== 'na').length;
                    const granted = m.perms.filter(p => p === true).length;
                    const full = granted === total;
                    return (
                      <span
                        key={`${g.key}-${m.key}`}
                        className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          full ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold' : 'border-brand-cream bg-brand-ivory text-brand-textmain'
                        }`}
                      >
                        {m.label}
                        {!full && <span className="ml-1.5 text-[10px] text-brand-textmuted">({granted}/{total})</span>}
                      </span>
                    );
                  })
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
