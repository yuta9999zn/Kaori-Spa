import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Sparkles, Store, AlertCircle, CheckCircle2, Settings2 } from 'lucide-react';

export default async function ServicePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('service');

  const rows = [
    { code: 'BR-HCM-01', name: 'Natural Beauty Quận 1',     status: 'active',   basePrice: '12.000.000 ₫', overridePrice: '13.500.000 ₫', duration: '90', staff: 1, room: 'Phòng triệt lông VIP', max: 18, updated: '2026-05-08 09:12', warn: false },
    { code: 'BR-HCM-02', name: 'Natural Beauty Quận 7',     status: 'active',   basePrice: '12.000.000 ₫', overridePrice: '12.000.000 ₫', duration: '90', staff: 1, room: 'Phòng triệt lông',     max: 14, updated: '2026-05-06 14:30', warn: false },
    { code: 'BR-HN-01',  name: 'Natural Beauty Hà Nội',     status: 'active',   basePrice: '12.000.000 ₫', overridePrice: '11.500.000 ₫', duration: '75', staff: 1, room: 'Phòng triệt lông',     max: 10, updated: '2026-05-04 18:05', warn: true  },
    { code: 'BR-DN-01',  name: 'Natural Beauty Đà Nẵng',    status: 'inactive', basePrice: '12.000.000 ₫', overridePrice: '12.000.000 ₫', duration: '90', staff: 1, room: '—',                    max: 0,  updated: '2026-04-22 11:00', warn: false },
    { code: 'BR-CT-01',  name: 'Natural Beauty Cần Thơ',    status: 'active',   basePrice: '12.000.000 ₫', overridePrice: '10.800.000 ₫', duration: '90', staff: 1, room: 'Phòng triệt lông',     max: 12, updated: '2026-05-07 08:40', warn: false }
  ];

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
        <button className="btn-primary">
          <CheckCircle2 className="h-4 w-4" /> {t('applyAll')}
        </button>
      </header>

      {/* Base service context */}
      <section className="kpi-card mb-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <ContextItem label={t('base.service')}  value={t('context.service')}   />
          <ContextItem label={t('base.category')} value={t('context.category')}  />
          <span className="hidden h-10 w-px bg-brand-cream md:block" />
          <ContextItem label={t('base.price')}    value={t('context.price')}    accent />
          <ContextItem label={t('base.duration')} value={t('context.duration')} />
        </div>
      </section>

      {/* Filter bar */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <select
          defaultValue="all"
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold"
        >
          <option value="all">{t('filter.all')}</option>
          <option value="active">{t('filter.active')}</option>
          <option value="inactive">{t('filter.inactive')}</option>
        </select>
      </div>

      {/* Branch override table */}
      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['branch', 'status', 'price', 'duration', 'staff', 'room', 'max', 'updated', 'actions'] as const).map(c => (
                <th
                  key={c}
                  className={`px-4 py-3 font-medium ${c === 'price' || c === 'duration' ? 'text-right' : c === 'status' || c === 'staff' || c === 'max' || c === 'actions' ? 'text-center' : 'text-left'}`}
                >
                  {t(`columns.${c}` as 'columns.branch')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.code} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cream text-brand-gold">
                      <Store className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-brand-textmain">{r.name}</p>
                      <p className="font-mono text-[10px] text-brand-gold">{r.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={r.status} label={t(`filter.${r.status}` as 'filter.active')} />
                </td>
                <td className="px-4 py-3 text-right">
                  {r.overridePrice !== r.basePrice ? (
                    <>
                      <span className="mr-2 line-through text-brand-textmuted opacity-60">{r.basePrice}</span>
                      <span className="font-medium text-brand-gold">{r.overridePrice}</span>
                    </>
                  ) : (
                    <span className="font-medium text-brand-textmain">{r.basePrice}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-brand-textmain">{r.duration} min</td>
                <td className="px-4 py-3 text-center text-brand-textmain">{r.staff}</td>
                <td className="px-4 py-3 text-brand-textmain">{r.room}</td>
                <td className={`px-4 py-3 text-center ${r.warn ? 'font-medium text-brand-rose' : 'text-brand-textmain'}`}>
                  {r.max}
                  {r.warn && <AlertCircle className="ml-1 inline h-3 w-3" />}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-brand-textmuted">{r.updated}</td>
                <td className="px-4 py-3 text-center">
                  <button className="btn-ghost px-3 py-1.5 text-xs">
                    <Settings2 className="h-3 w-3" /> {t('actions.edit')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ContextItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
      <p className={`mt-1 text-sm font-medium ${accent ? 'font-serif text-brand-gold' : 'text-brand-textmain'}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-600 border-slate-200'
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${map[status] ?? ''}`}>
      {label}
    </span>
  );
}
