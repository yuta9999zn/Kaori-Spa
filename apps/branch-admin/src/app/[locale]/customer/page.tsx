import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Search } from 'lucide-react';

export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customer');

  const rows = [
    { code: 'KH-2026-001', name: 'Nguyễn Thị Mai',  phone: '0901234567', segment: 'vip',    lastVisit: '2026-05-04', points: 1240, spent: '24.300.000 ₫' },
    { code: 'KH-2026-002', name: 'Trần Thị Lan',    phone: '0902345678', segment: 'regular',lastVisit: '2026-05-02', points: 480,  spent: '8.600.000 ₫' },
    { code: 'KH-2026-003', name: 'Lê Thị Hoa',      phone: '0903456789', segment: 'new',    lastVisit: '2026-05-05', points: 60,   spent: '500.000 ₫' },
    { code: 'KH-2026-004', name: 'Phạm Thị Yến',    phone: '0904567890', segment: 'vip',    lastVisit: '2026-05-06', points: 2100, spent: '42.000.000 ₫' },
    { code: 'KH-2026-005', name: 'Hoàng Thị Thu',   phone: '0905678901', segment: 'dormant',lastVisit: '2025-12-20', points: 320,  spent: '6.200.000 ₫' }
  ];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <button className="btn-primary">
          <Plus className="h-4 w-4" /> {t('create')}
        </button>
      </header>

      <div className="mb-5 flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md shadow-soft">
        <Search className="h-4 w-4 text-brand-textmuted" />
        <input className="flex-1 bg-transparent text-sm outline-none" placeholder={t('search')} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['code', 'name', 'phone', 'segment', 'lastVisit', 'points', 'spent'] as const).map(c => (
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
                <td className="px-4 py-3 text-brand-textmain">{r.name}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.phone}</td>
                <td className="px-4 py-3">
                  <SegmentBadge segment={r.segment} label={t(`segments.${r.segment}` as 'segments.vip')} />
                </td>
                <td className="px-4 py-3 text-brand-textmuted">{r.lastVisit}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.points}</td>
                <td className="px-4 py-3 text-right font-medium text-brand-gold">{r.spent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SegmentBadge({ segment, label }: { segment: string; label: string }) {
  const map: Record<string, string> = {
    vip:     'bg-amber-50 text-amber-700',
    regular: 'bg-emerald-50 text-emerald-700',
    new:     'bg-blue-50 text-blue-700',
    dormant: 'bg-slate-50 text-slate-600'
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${map[segment] ?? ''}`}>
      {label}
    </span>
  );
}
