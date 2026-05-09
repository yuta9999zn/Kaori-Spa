import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Upload, Download, Filter, Search, Sparkles, Waves, Flower, MoreVertical } from 'lucide-react';

type Row = {
  id: string;
  code: string;
  name: string;
  category: 'massage' | 'facial' | 'hair_removal' | 'package';
  duration: number;
  price: number;
  staffReq: number;
  popularity: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'inactive';
  icon: 'waves' | 'sparkles' | 'flower';
};

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function ServiceOverviewPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('serviceOverview');

  // TODO(Phase B): wire to backend when endpoint ships
  const rows: Row[] = [
    { id: 'srv-1', code: 'SRV-001', name: 'Triệt lông toàn thân nữ', category: 'hair_removal', duration: 90, price: 4500000, staffReq: 1, popularity: 5, status: 'active', icon: 'sparkles' },
    { id: 'srv-2', code: 'SRV-002', name: 'Massage trị liệu chuyên sâu', category: 'massage', duration: 75, price: 850000, staffReq: 1, popularity: 5, status: 'active', icon: 'waves' },
    { id: 'srv-3', code: 'SRV-003', name: 'Chăm sóc da Hydrating', category: 'facial', duration: 60, price: 650000, staffReq: 1, popularity: 4, status: 'active', icon: 'flower' },
    { id: 'srv-4', code: 'SRV-004', name: 'Triệt lông vùng nách nam', category: 'hair_removal', duration: 30, price: 1200000, staffReq: 1, popularity: 4, status: 'active', icon: 'sparkles' },
    { id: 'srv-5', code: 'SRV-005', name: 'Liệu trình đá nóng', category: 'massage', duration: 75, price: 1050000, staffReq: 1, popularity: 3, status: 'inactive', icon: 'waves' }
  ];

  const Icon = ({ name }: { name: 'waves' | 'sparkles' | 'flower' }) =>
    name === 'waves' ? <Waves className="h-5 w-5" /> : name === 'sparkles' ? <Sparkles className="h-5 w-5" /> : <Flower className="h-5 w-5" />;

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Upload className="h-4 w-4" /> {t('import')}</button>
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('export')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <Kpi label={t('kpi.total')} value="142" />
        <Kpi label={t('kpi.active')} value="128" tone="green" />
        <Kpi label={t('kpi.inactive')} value="14" />
        <Kpi label={t('kpi.mostBooked')} value="Triệt lông" tone="gold" />
        <Kpi label={t('kpi.avgDuration')} value="65" suffix={t('min')} />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
          <div className="flex items-center gap-2 rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm w-72">
            <Search className="h-4 w-4 text-brand-textmuted" />
            <input className="flex-1 bg-transparent outline-none placeholder-brand-textmuted/60" placeholder={t('searchPh')} />
          </div>
          <select className="rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm">
            <option>{t('filterCategoryAll')}</option>
            <option>{t('cat.massage')}</option>
            <option>{t('cat.facial')}</option>
            <option>{t('cat.hair_removal')}</option>
          </select>
          <select className="rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm">
            <option>{t('filterStatusAll')}</option>
            <option>{t('status.active')}</option>
            <option>{t('status.inactive')}</option>
          </select>
          <button className="ml-auto p-2 rounded-xl border border-brand-cream bg-white text-brand-textmuted hover:text-brand-gold">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.name')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.category')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.duration')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.price')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.staffReq')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.popularity')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-brand-cream/60 text-brand-gold flex items-center justify-center"><Icon name={r.icon} /></div>
                      <div>
                        <p className="font-serif text-base text-brand-textmain">{r.name}</p>
                        <p className="text-[10px] text-brand-textmuted uppercase tracking-wider">{r.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-textmuted">{t(`cat.${r.category}` as 'cat.massage')}</td>
                  <td className="px-4 py-3">{r.duration} {t('min')}</td>
                  <td className="px-4 py-3 font-serif">{VND(r.price)}</td>
                  <td className="text-center px-4 py-3">{r.staffReq}</td>
                  <td className="px-4 py-3 text-brand-gold">{'★'.repeat(r.popularity)}<span className="text-brand-cream">{'★'.repeat(5 - r.popularity)}</span></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${r.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {t(`status.${r.status}` as 'status.active')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="more">
                      <MoreVertical className="h-4 w-4 text-brand-textmuted" />
                    </button>
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

function Kpi({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone?: 'green' | 'gold' }) {
  const labelCls = tone === 'green' ? 'text-green-600' : tone === 'gold' ? 'text-brand-gold' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain truncate">
        {value}{suffix && <span className="text-xs ml-1 font-sans text-brand-textmuted">{suffix}</span>}
      </p>
    </div>
  );
}
