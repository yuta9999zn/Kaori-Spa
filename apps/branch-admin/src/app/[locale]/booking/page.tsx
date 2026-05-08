import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';

export default async function BookingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('booking');

  const filters = ['filterAll', 'filterToday', 'filterUpcoming', 'filterDone'] as const;
  const rows = [
    { code: 'BK-001', customer: 'Nguyễn Thị Mai',  service: 'Combo VIO 10 buổi',     staff: 'KTV Linh',  room: 'P1', time: '10:00', status: 'confirmed', amount: '5.400.000 ₫' },
    { code: 'BK-002', customer: 'Trần Thị Lan',    service: 'Triệt Toàn Thân',        staff: 'KTV Hoa',   room: 'P3', time: '11:30', status: 'in_progress', amount: '1.000.000 ₫' },
    { code: 'BK-003', customer: 'Lê Thị Hoa',      service: 'Xông Yomogi',            staff: 'KTV Yến',   room: 'VIP', time: '14:00', status: 'pending',  amount: '500.000 ₫' },
    { code: 'BK-004', customer: 'Phạm Thị Yến',    service: 'Set Beauty 3 DV (VIP)',  staff: 'KTV Mai',   room: 'VIP', time: '16:00', status: 'pending',  amount: '2.100.000 ₫' },
    { code: 'BK-005', customer: 'Hoàng Thị Thu',   service: 'Triệt VIO Combo',        staff: 'KTV Linh',  room: 'P2', time: '17:30', status: 'confirmed', amount: '600.000 ₫' }
  ];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <button className="btn-primary">
          <Plus className="h-4 w-4" /> {t('create')}
        </button>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`rounded-full px-4 py-1.5 text-xs border transition ${
              i === 0
                ? 'bg-brand-gold border-brand-gold text-white'
                : 'border-brand-cream text-brand-textmuted hover:border-brand-gold'
            }`}
          >
            {t(f)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['code', 'customer', 'service', 'staff', 'room', 'time', 'status', 'amount'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.code')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.code} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                <td className="px-4 py-3 text-brand-textmain">{r.customer}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.service}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.staff}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.room}</td>
                <td className="px-4 py-3">{r.time}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-cream/60 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {t(`status.${r.status}` as 'status.pending')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-brand-gold">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
