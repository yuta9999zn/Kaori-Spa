import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Search, Filter, Star, Phone, Mail, MoreHorizontal } from 'lucide-react';

// TODO(Phase B): wire to backend `GET /v1/staff?branchId=...`
const MOCK_STAFF = [
  { id: 's1', code: 'KTV-001', name: 'Nguyễn Khánh Linh', nickname: 'miko', role: 'senior', rating: 4.92, bookings: 142, phone: '0901 234 567', email: 'linh.nguyen@kaori.vn', status: 'active' },
  { id: 's2', code: 'KTV-002', name: 'Phạm Thị Mai',     nickname: null,    role: 'therapist', rating: 4.78, bookings: 118, phone: '0901 345 678', email: 'mai.pham@kaori.vn',   status: 'active' },
  { id: 's3', code: 'KTV-003', name: 'Lê Thị Yến',       nickname: 'yến',   role: 'therapist', rating: 4.65, bookings: 96,  phone: '0901 456 789', email: 'yen.le@kaori.vn',     status: 'on_leave' },
  { id: 's4', code: 'KTV-004', name: 'Nguyễn Lan Hương', nickname: 'hương', role: 'senior',    rating: 4.84, bookings: 128, phone: '0901 567 890', email: 'huong.n@kaori.vn',    status: 'active' },
  { id: 's5', code: 'KTV-005', name: 'Trần Thị Bích',    nickname: null,    role: 'junior',    rating: 4.41, bookings: 64,  phone: '0901 678 901', email: 'bich.tran@kaori.vn',  status: 'active' }
] as const;

export default async function StaffListPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('staffList');

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Filter className="h-4 w-4" /> {t('filter')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md flex-1 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input className="flex-1 bg-transparent text-sm outline-none" placeholder={t('search')} />
        </div>
        <select className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft">
          <option>{t('roleAll')}</option>
          <option>{t('role.senior')}</option>
          <option>{t('role.therapist')}</option>
          <option>{t('role.junior')}</option>
          <option>{t('role.reception')}</option>
        </select>
        <select className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft">
          <option>{t('statusAll')}</option>
          <option>{t('status.active')}</option>
          <option>{t('status.on_leave')}</option>
          <option>{t('status.inactive')}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['code', 'name', 'role', 'contact', 'rating', 'bookings', 'status', 'actions'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.code')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {MOCK_STAFF.map(s => (
              <tr key={s.id} className="hover:bg-brand-cream/15">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{s.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-textmain">{s.name}</div>
                  {s.nickname && <div className="text-[11px] text-brand-textmuted">"{s.nickname}"</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-cream/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-textmuted">
                    {t(`role.${s.role}` as 'role.senior')}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-textmuted">
                  <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {s.phone}</div>
                  <div className="flex items-center gap-1 text-xs mt-0.5"><Mail className="h-3 w-3" /> {s.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-brand-gold text-brand-gold" />
                    <span className="font-medium text-brand-textmain">{s.rating.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-textmuted tabular-nums">{s.bookings}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    s.status === 'active'   ? 'bg-emerald-50 text-emerald-700' :
                    s.status === 'on_leave' ? 'bg-amber-50 text-amber-700' :
                                              'bg-slate-50 text-slate-600'
                  }`}>
                    {t(`status.${s.status}` as 'status.active')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-brand-textmuted hover:text-brand-gold">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[11px] text-brand-textmuted">
          {t('paginationSummary', { from: 1, to: MOCK_STAFF.length, total: MOCK_STAFF.length })}
        </div>
      </div>
    </>
  );
}
