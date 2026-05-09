import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Plus, Search, Folder, Edit2, Trash2 } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  slug: string;
  serviceCount: number;
  active: number;
  status: 'active' | 'inactive';
  description: string;
};

export default async function ServiceCategoriesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  const t = await getTranslations('serviceCategories');

  // TODO(Phase B): wire to backend when endpoint ships
  const cats: Category[] = [
    { id: 'cat-1', name: 'Triệt lông', slug: 'hair-removal', serviceCount: 24, active: 22, status: 'active', description: 'Liệu trình triệt lông Diode, IPL cho nam và nữ.' },
    { id: 'cat-2', name: 'Massage', slug: 'massage', serviceCount: 18, active: 18, status: 'active', description: 'Massage thư giãn, trị liệu, đá nóng.' },
    { id: 'cat-3', name: 'Chăm sóc da mặt', slug: 'facial', serviceCount: 15, active: 14, status: 'active', description: 'Chăm sóc da chuyên sâu, hydrating, anti-aging.' },
    { id: 'cat-4', name: 'Liệu trình body', slug: 'body', serviceCount: 9, active: 7, status: 'active', description: 'Tắm trắng, body scrub, wrap thải độc.' },
    { id: 'cat-5', name: 'Combo & Gói', slug: 'package', serviceCount: 12, active: 10, status: 'active', description: 'Gói liệu trình tiết kiệm 10-25%.' },
    { id: 'cat-6', name: 'Dịch vụ ngừng', slug: 'archived', serviceCount: 4, active: 0, status: 'inactive', description: 'Các dịch vụ đã ngừng cung cấp.' }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('newCategory')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label={t('kpi.total')} value="18" />
        <Kpi label={t('kpi.active')} value="16" tone="green" />
        <Kpi label={t('kpi.inactive')} value="2" />
        <Kpi label={t('kpi.uncategorized')} value="3" tone="gold" />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
          <div className="flex items-center gap-2 rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm w-72">
            <Search className="h-4 w-4 text-brand-textmuted" />
            <input className="flex-1 bg-transparent outline-none placeholder-brand-textmuted/60" placeholder={t('searchPh')} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.name')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.slug')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.services')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.active')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {cats.map(c => (
                <tr key={c.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-cream/60 text-brand-gold flex items-center justify-center"><Folder className="h-4 w-4" /></div>
                      <div>
                        <p className="font-serif text-base text-brand-textmain">{c.name}</p>
                        <p className="text-[10px] text-brand-textmuted">{c.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{c.slug}</td>
                  <td className="text-center px-4 py-3">{c.serviceCount}</td>
                  <td className="text-center px-4 py-3 text-green-700">{c.active}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${c.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {t(`status.${c.status}` as 'status.active')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="edit"><Edit2 className="h-4 w-4 text-brand-textmuted" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50" aria-label="delete"><Trash2 className="h-4 w-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'gold' }) {
  const labelCls = tone === 'green' ? 'text-green-600' : tone === 'gold' ? 'text-brand-gold' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}
