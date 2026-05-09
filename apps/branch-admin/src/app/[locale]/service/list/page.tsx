import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Search, Sparkles, Waves, Flower, Clock, MoreVertical } from 'lucide-react';

type ServiceCard = {
  id: string;
  code: string;
  name: string;
  category: 'massage' | 'facial' | 'hair_removal' | 'package';
  duration: number;
  price: number;
  staffReq: number;
  branches: number;
  rating: number;
  status: 'active' | 'inactive';
  description: string;
  icon: 'waves' | 'sparkles' | 'flower';
};

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function ServiceListPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('serviceList');

  // TODO(Phase B): wire to backend when endpoint ships
  const cards: ServiceCard[] = [
    { id: 'srv-1', code: 'SRV-001', name: 'Triệt lông toàn thân nữ', category: 'hair_removal', duration: 90, price: 4500000, staffReq: 1, branches: 3, rating: 4.9, status: 'active', description: 'Liệu trình triệt lông công nghệ Diode toàn thân cho nữ, an toàn cho mọi loại da.', icon: 'sparkles' },
    { id: 'srv-2', code: 'SRV-002', name: 'Massage trị liệu chuyên sâu', category: 'massage', duration: 75, price: 850000, staffReq: 1, branches: 3, rating: 4.8, status: 'active', description: 'Massage thư giãn các nhóm cơ sâu, giảm căng cứng vai gáy.', icon: 'waves' },
    { id: 'srv-3', code: 'SRV-003', name: 'Chăm sóc da Hydrating', category: 'facial', duration: 60, price: 650000, staffReq: 1, branches: 2, rating: 4.7, status: 'active', description: 'Cấp ẩm chuyên sâu với serum hyaluronic acid và mặt nạ thạch.', icon: 'flower' },
    { id: 'srv-4', code: 'SRV-004', name: 'Triệt lông vùng nách nam', category: 'hair_removal', duration: 30, price: 1200000, staffReq: 1, branches: 3, rating: 4.6, status: 'active', description: 'Liệu trình 6 buổi triệt lông vùng nách dành cho nam giới.', icon: 'sparkles' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
        </div>
      </header>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm w-80">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input className="flex-1 bg-transparent outline-none placeholder-brand-textmuted/60" placeholder={t('searchPh')} />
        </div>
        <select className="rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm">
          <option>{t('filterAll')}</option>
          <option>{t('cat.massage')}</option>
          <option>{t('cat.facial')}</option>
          <option>{t('cat.hair_removal')}</option>
          <option>{t('cat.package')}</option>
        </select>
        <select className="rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm">
          <option>{t('sort.popular')}</option>
          <option>{t('sort.name')}</option>
          <option>{t('sort.priceHigh')}</option>
          <option>{t('sort.newest')}</option>
        </select>
      </div>

      <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(c => (
          <article key={c.id} className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden flex flex-col">
            <div className="h-40 bg-gradient-to-br from-brand-gold/15 via-brand-cream to-brand-rose/15 flex items-center justify-center text-brand-gold">
              {c.icon === 'waves' ? <Waves className="h-12 w-12" /> : c.icon === 'sparkles' ? <Sparkles className="h-12 w-12" /> : <Flower className="h-12 w-12" />}
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg text-brand-textmain leading-tight">{c.name}</h3>
                <button className="p-1.5 rounded-lg hover:bg-brand-cream/50 shrink-0" aria-label="more">
                  <MoreVertical className="h-4 w-4 text-brand-textmuted" />
                </button>
              </div>
              <p className="text-xs text-brand-textmuted">{c.description}</p>
              <div className="flex items-center justify-between text-xs text-brand-textmuted mt-auto pt-3 border-t border-brand-cream/60">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration} {t('min')}</span>
                <span className="text-brand-gold">★ {c.rating.toFixed(1)}</span>
                <span className="font-serif text-brand-textmain text-base">{VND(c.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${c.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {t(`status.${c.status}` as 'status.active')}
                </span>
                <span className="text-[10px] text-brand-textmuted">{t('branchesCount', { count: c.branches })}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
