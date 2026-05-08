import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';

// TODO(backend): no auth-service endpoint exposes org member list / role
// assignments yet. Wire to /v1/auth/users (or new org-members endpoint)
// once auth-service ships RBAC scope queries.
export default async function MemberPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('member');

  const rows = [
    { name: 'Chủ tổ chức Natural Beauty',          email: 'owner@naturalbeauty.vn', role: 'ORG_OWNER',     scope: 'Natural Beauty', status: 'active' },
    { name: 'Nguyễn Khánh Linh (miko)',           email: 'miko@naturalbeauty.vn',  role: 'BRANCH_MANAGER',scope: 'Kim Mã 575',     status: 'active' },
    { name: 'Nguyễn Lan Hương (hương)',           email: 'huong@naturalbeauty.vn', role: 'BRANCH_MANAGER',scope: 'Kim Mã 625',     status: 'active' },
    { name: 'Lê Thị Yến',                          email: 'yen@naturalbeauty.vn',   role: 'RECEPTIONIST',  scope: 'Kim Mã 575',     status: 'active' },
    { name: 'Phạm Thị Mai',                        email: 'mai@naturalbeauty.vn',   role: 'THERAPIST',     scope: 'Kim Mã 575',     status: 'pending' }
  ];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <button className="btn-primary"><Plus className="h-4 w-4" /> {t('invite')}</button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>{(['name', 'email', 'role', 'scope', 'status'] as const).map(c =>
              <th key={c} className="text-left px-4 py-3 font-medium">{t(`columns.${c}` as 'columns.name')}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.email} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 text-brand-textmuted font-mono text-xs">{r.email}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-brand-cream/60 px-2 py-0.5 text-[10px] uppercase">{r.role}</span></td>
                <td className="px-4 py-3 text-brand-textmuted">{r.scope}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    r.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
