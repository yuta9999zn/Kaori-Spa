import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';

export default async function BranchListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('branch');

  const rows = [
    { code: 'nb-kim-ma-575', name: 'Natural Beauty 575 Kim Mã', address: '575 Kim Mã, Ba Đình, Hà Nội', manager: 'Nguyễn Khánh Linh (miko)', status: 'active' },
    { code: 'nb-kim-ma-625', name: 'Natural Beauty 625 Kim Mã', address: '625 Kim Mã, Ba Đình, Hà Nội', manager: 'Nguyễn Lan Hương (hương)',  status: 'active' }
  ];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>{(['code', 'name', 'address', 'manager', 'status'] as const).map(c =>
              <th key={c} className="text-left px-4 py-3 font-medium">{t(`columns.${c}` as 'columns.code')}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.code} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.code}</td>
                <td className="px-4 py-3 text-brand-textmain">{r.name}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.address}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.manager}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] uppercase">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
