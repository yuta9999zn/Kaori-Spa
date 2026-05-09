import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PackagePlus, Plus, Receipt, Wallet, Boxes, Truck } from 'lucide-react';

type RStatus = 'draft' | 'pending' | 'received';

// TODO(Phase B): wire to backend - replace with /v1/inventory/receipts endpoint.
const RECEIPTS: { code: string; supplier: string; date: string; items: number; total: number; status: RStatus }[] = [
  { code: 'NK-2401', supplier: 'Cty Mỹ phẩm Xanh', date: '2026-05-08', items: 18, total: 12_400_000, status: 'received' },
  { code: 'NK-2402', supplier: 'Beauty Pro JSC',   date: '2026-05-08', items: 9,  total: 5_800_000,  status: 'pending' },
  { code: 'NK-2403', supplier: 'NPP Kaori Center', date: '2026-05-07', items: 32, total: 24_500_000, status: 'received' },
  { code: 'NK-2404', supplier: 'Skin Lab Vina',    date: '2026-05-07', items: 12, total: 7_200_000,  status: 'draft' }
];

const ITEMS = [
  { product: 'Tinh dầu massage Lavender 250ml', qty: 24, unit: 'chai', unitPrice: 180_000 },
  { product: 'Mặt nạ collagen Premium',          qty: 60, unit: 'gói', unitPrice: 45_000 },
  { product: 'Sữa rửa mặt Hydrating 200ml',     qty: 12, unit: 'chai', unitPrice: 320_000 }
];

export default async function InventoryInPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('inventoryIn');

  const today = RECEIPTS.filter(r => r.date === '2026-05-08').length;
  const totalValue = RECEIPTS.reduce((s, r) => s + r.total, 0);
  const totalUnits = RECEIPTS.reduce((s, r) => s + r.items, 0);
  const suppliers = new Set(RECEIPTS.map(r => r.supplier)).size;
  const subtotal = ITEMS.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <PackagePlus className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button className="btn-primary"><Plus className="h-4 w-4" /> {t('newReceipt')}</button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <Kpi label={t('kpi.todayReceipts')} value={String(today)} Icon={Receipt} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.totalValue')} value={fmtM(totalValue)} Icon={Wallet} accent="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label={t('kpi.totalUnits')} value={String(totalUnits)} Icon={Boxes} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.suppliers')} value={String(suppliers)} Icon={Truck} accent="text-purple-600" bg="bg-purple-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('newReceipt')}</h2>
          <div className="grid gap-3 md:grid-cols-2 mb-4">
            <Field label={t('form.supplier')}>
              <select className="spa-input"><option>Cty Mỹ phẩm Xanh</option><option>Beauty Pro JSC</option></select>
            </Field>
            <Field label={t('form.receiptCode')}>
              <input type="text" defaultValue="NK-2405" className="spa-input" />
            </Field>
            <Field label={t('form.receiptDate')}>
              <input type="date" defaultValue="2026-05-09" className="spa-input" />
            </Field>
            <Field label={t('form.note')}>
              <input type="text" placeholder="..." className="spa-input" />
            </Field>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] uppercase tracking-widest text-brand-textmuted">{t('form.items')}</h3>
            <button className="btn-ghost text-xs"><Plus className="h-3.5 w-3.5" /> {t('form.addItem')}</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <th className="text-left py-2 px-2 font-medium">{t('columns.product')}</th>
                <th className="text-right py-2 px-2 font-medium">{t('columns.qty')}</th>
                <th className="text-left py-2 px-2 font-medium">{t('columns.unit')}</th>
                <th className="text-right py-2 px-2 font-medium">{t('columns.unitPrice')}</th>
                <th className="text-right py-2 px-2 font-medium">{t('columns.subtotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {ITEMS.map(i => (
                <tr key={i.product}>
                  <td className="py-2 px-2">{i.product}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{i.qty}</td>
                  <td className="py-2 px-2 text-brand-textmuted">{i.unit}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtK(i.unitPrice)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtK(i.qty * i.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-brand-cream">
                <td colSpan={4} className="py-2.5 px-2 text-right text-[11px] uppercase tracking-widest text-brand-textmuted">{t('columns.total')}</td>
                <td className="py-2.5 px-2 text-right tabular-nums font-serif text-brand-gold">{fmtM(subtotal)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-end mt-4">
            <button className="btn-primary">{t('form.submit')}</button>
          </div>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-base text-brand-textmain mb-3">Phiếu gần đây</h2>
          <ul className="space-y-3">
            {RECEIPTS.map(r => (
              <li key={r.code} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-brand-gold">{r.code}</p>
                  <p className="text-[11px] text-brand-textmuted">{r.supplier}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">{fmtM(r.total)}</p>
                  <StatusBadge s={r.status} label={t(`status.${r.status}` as 'status.draft')} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }
function fmtK(n: number) { return `${(n / 1_000).toFixed(0)}K ₫`; }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-brand-textmuted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function StatusBadge({ s, label }: { s: RStatus; label: string }) {
  const cls = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    received: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }[s];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function Kpi({
  label, value, Icon, accent, bg
}: {
  label: string; value: string; accent: string; bg: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
