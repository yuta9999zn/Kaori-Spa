import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Package, Tag, Calendar, Edit2 } from 'lucide-react';

type Combo = {
  id: string;
  name: string;
  code: string;
  serviceCount: number;
  totalPrice: number;
  comboPrice: number;
  discountPct: number;
  validUntil: string;
  status: 'active' | 'draft' | 'expired';
  audience: 'all' | 'member' | 'vip';
};

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function ServicePackagesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('servicePackages');

  // TODO(Phase B): wire to backend when endpoint ships
  const combos: Combo[] = [
    { id: 'pkg-1', name: 'Combo Triệt lông toàn thân nữ - 6 buổi', code: 'PKG-HRF-6', serviceCount: 6, totalPrice: 27000000, comboPrice: 19800000, discountPct: 26, validUntil: '2026-12-31', status: 'active', audience: 'all' },
    { id: 'pkg-2', name: 'Combo Massage trị liệu - 10 buổi', code: 'PKG-MSG-10', serviceCount: 10, totalPrice: 8500000, comboPrice: 6800000, discountPct: 20, validUntil: '2026-09-30', status: 'active', audience: 'member' },
    { id: 'pkg-3', name: 'Combo Chăm sóc da Hydrating - 5 buổi', code: 'PKG-FCL-5', serviceCount: 5, totalPrice: 3250000, comboPrice: 2750000, discountPct: 15, validUntil: '2026-08-15', status: 'active', audience: 'all' },
    { id: 'pkg-4', name: 'VIP Spa Day cao cấp', code: 'PKG-VIP-1', serviceCount: 4, totalPrice: 5500000, comboPrice: 4200000, discountPct: 24, validUntil: '2026-12-31', status: 'draft', audience: 'vip' },
    { id: 'pkg-5', name: 'Combo Cưới hỏi - Bridal', code: 'PKG-WED-1', serviceCount: 7, totalPrice: 12000000, comboPrice: 9500000, discountPct: 21, validUntil: '2026-06-30', status: 'expired', audience: 'all' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('newCombo')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label={t('kpi.total')} value="18" />
        <Kpi label={t('kpi.active')} value="12" tone="green" />
        <Kpi label={t('kpi.draft')} value="4" />
        <Kpi label={t('kpi.expiringSoon')} value="2" tone="gold" />
      </section>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {combos.map(c => (
          <article key={c.id} className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center"><Package className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-serif text-lg text-brand-textmain leading-tight">{c.name}</h3>
                  <p className="text-[10px] text-brand-textmuted uppercase tracking-wider">{c.code}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${c.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : c.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {t(`status.${c.status}` as 'status.active')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-brand-ivory/50 p-2">
                <p className="text-[10px] uppercase tracking-wider text-brand-textmuted">{t('serviceCount')}</p>
                <p className="font-serif text-brand-textmain text-lg">{c.serviceCount}</p>
              </div>
              <div className="rounded-xl bg-brand-ivory/50 p-2">
                <p className="text-[10px] uppercase tracking-wider text-brand-textmuted">{t('discount')}</p>
                <p className="font-serif text-brand-gold text-lg">-{c.discountPct}%</p>
              </div>
              <div className="rounded-xl bg-brand-ivory/50 p-2">
                <p className="text-[10px] uppercase tracking-wider text-brand-textmuted">{t('audience.label')}</p>
                <p className="font-medium text-brand-textmain text-xs">{t(`audience.${c.audience}` as 'audience.all')}</p>
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-brand-cream/60 pt-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-textmuted">{t('comboPrice')}</p>
                <p className="font-serif text-xl text-brand-textmain">{VND(c.comboPrice)}</p>
                <p className="text-[10px] text-brand-textmuted line-through">{VND(c.totalPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-brand-textmuted inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {t('validUntil')}</p>
                <p className="text-xs font-mono text-brand-textmain">{c.validUntil}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn-ghost flex-1"><Edit2 className="h-3.5 w-3.5" /> {t('edit')}</button>
              <button className="btn-ghost"><Tag className="h-3.5 w-3.5" /> {t('promote')}</button>
            </div>
          </article>
        ))}
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
