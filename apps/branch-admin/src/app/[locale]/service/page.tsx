import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Plus,
  Search,
  Sparkles,
  Waves,
  Flower,
  HeartHandshake,
  Droplet,
  Clock,
  Store,
  Star,
  MoreVertical,
  Filter,
  Download,
  Upload
} from 'lucide-react';

type ServiceRow = {
  code: string;
  name: string;
  category: 'massage' | 'facial' | 'package' | 'hair_removal';
  duration: number;
  price: string;
  staff: number;
  branches: number;
  rating: number;
  status: 'active' | 'inactive';
  icon: 'waves' | 'sparkles' | 'flower' | 'heart' | 'droplet';
};

export default async function ServicePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('service');

  const rows: ServiceRow[] = [
    {
      code: 'SRV-001',
      name: 'Triệt lông toàn thân nữ',
      category: 'hair_removal',
      duration: 90,
      price: '6.500.000 ₫',
      staff: 1,
      branches: 3,
      rating: 5,
      status: 'active',
      icon: 'sparkles'
    },
    {
      code: 'SRV-012',
      name: 'Chăm sóc da mặt Kaori Signature',
      category: 'facial',
      duration: 60,
      price: '1.200.000 ₫',
      staff: 1,
      branches: 3,
      rating: 5,
      status: 'active',
      icon: 'flower'
    },
    {
      code: 'SRV-005',
      name: 'Massage thân thảo dược',
      category: 'massage',
      duration: 75,
      price: '950.000 ₫',
      staff: 1,
      branches: 2,
      rating: 4,
      status: 'active',
      icon: 'waves'
    },
    {
      code: 'SRV-008',
      name: 'Hot stone therapy',
      category: 'massage',
      duration: 75,
      price: '1.350.000 ₫',
      staff: 1,
      branches: 2,
      rating: 4,
      status: 'inactive',
      icon: 'droplet'
    },
    {
      code: 'PKG-002',
      name: 'Couples Retreat Package',
      category: 'package',
      duration: 120,
      price: '3.500.000 ₫',
      staff: 2,
      branches: 1,
      rating: 5,
      status: 'active',
      icon: 'heart'
    }
  ];

  const total = 142;
  const active = 128;
  const inactive = 14;

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-lg">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-ghost">
            <Upload className="h-4 w-4" /> {t('import')}
          </button>
          <button className="btn-ghost">
            <Download className="h-4 w-4" /> {t('export')}
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4" /> {t('create')}
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')} value={total.toString()} accent="text-brand-textmain" />
        <KpiTile label={t('kpi.active')} value={active.toString()} accent="text-emerald-600" />
        <KpiTile label={t('kpi.inactive')} value={inactive.toString()} accent="text-brand-textmain" />
        <KpiTile
          label={t('kpi.mostBooked')}
          value={t('mockMostBooked')}
          accent="text-brand-gold"
          small
        />
        <KpiTile
          label={t('kpi.avgDuration')}
          value={`65 ${t('minShort')}`}
          accent="text-brand-textmain"
        />
      </section>

      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 lg:w-96 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('search')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue=""
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterCategoryAll')}</option>
            <option value="massage">{t('category.massage')}</option>
            <option value="facial">{t('category.facial')}</option>
            <option value="hair_removal">{t('category.hair_removal')}</option>
            <option value="package">{t('category.package')}</option>
          </select>
          <select
            defaultValue=""
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterStatusAll')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </select>
          <select
            defaultValue="popular"
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="popular">{t('sort.popular')}</option>
            <option value="name">{t('sort.name')}</option>
            <option value="priceDesc">{t('sort.priceDesc')}</option>
            <option value="newest">{t('sort.newest')}</option>
          </select>
          <button className="rounded-xl border border-brand-cream bg-white p-2 text-brand-textmuted hover:text-brand-gold transition">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Service table */}
      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['name', 'category', 'duration', 'price', 'staff', 'branches', 'popularity', 'status'] as const).map(
                c => (
                  <th key={c} className="text-left px-4 py-3 font-medium">
                    {t(`columns.${c}` as 'columns.name')}
                  </th>
                )
              )}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.code} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 shrink-0 rounded-lg bg-brand-cream/60 flex items-center justify-center text-brand-gold">
                      <ServiceIcon icon={r.icon} />
                    </span>
                    <div>
                      <p className="font-serif text-sm text-brand-textmain leading-tight">{r.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted font-mono">
                        {r.code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-textmuted">
                  {t(`category.${r.category}` as 'category.massage')}
                </td>
                <td className="px-4 py-3 text-brand-textmuted whitespace-nowrap">
                  <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  {t('durationMin', { min: r.duration })}
                </td>
                <td className="px-4 py-3 font-serif text-brand-gold">{r.price}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.staff}</td>
                <td className="px-4 py-3 text-brand-textmuted">
                  <Store className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  {r.branches}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5 text-brand-gold">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-current' : 'text-brand-cream'}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} label={t(`status.${r.status}` as 'status.active')} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-full p-2 text-brand-textmuted hover:bg-brand-cream/50 hover:text-brand-gold transition">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-3 text-xs text-brand-textmuted">
          <p>{t('paginationSummary', { from: 1, to: 5, total })}</p>
          <div className="flex items-center gap-1">
            <button className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 opacity-50 cursor-not-allowed">
              {t('prev')}
            </button>
            <button className="h-8 w-8 rounded-lg border border-brand-gold bg-brand-gold text-white font-medium">
              1
            </button>
            <button className="h-8 w-8 rounded-lg border border-brand-cream bg-white text-brand-textmain hover:border-brand-gold hover:text-brand-gold transition font-medium">
              2
            </button>
            <button className="h-8 w-8 rounded-lg border border-brand-cream bg-white text-brand-textmain hover:border-brand-gold hover:text-brand-gold transition font-medium">
              3
            </button>
            <button className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 hover:border-brand-gold transition">
              {t('next')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({
  label,
  value,
  accent,
  small
}: {
  label: string;
  value: string;
  accent: string;
  small?: boolean;
}) {
  return (
    <article className="kpi-card">
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
      <p className={`mt-2 font-serif ${small ? 'text-base truncate' : 'text-2xl'} ${accent}`}>
        {value}
      </p>
    </article>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        map[status] ?? ''
      }`}
    >
      {label}
    </span>
  );
}

function ServiceIcon({ icon }: { icon: 'waves' | 'sparkles' | 'flower' | 'heart' | 'droplet' }) {
  const cls = 'h-5 w-5';
  switch (icon) {
    case 'waves':
      return <Waves className={cls} />;
    case 'sparkles':
      return <Sparkles className={cls} />;
    case 'flower':
      return <Flower className={cls} />;
    case 'heart':
      return <HeartHandshake className={cls} />;
    case 'droplet':
      return <Droplet className={cls} />;
  }
}
