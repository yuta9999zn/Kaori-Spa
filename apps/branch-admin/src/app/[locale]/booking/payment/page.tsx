import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { CreditCard, Receipt, Tag, Plus, Trash2 } from 'lucide-react';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function BookingPaymentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('booking');
  const t = await getTranslations('bookingPayment');

  // TODO(Phase B): wire to backend when endpoint ships
  const items = [
    { id: 1, desc: 'Massage cổ vai gáy', qty: '60 phút', unit: 450_000, total: 450_000 },
    { id: 2, desc: 'Tinh dầu thảo mộc bổ sung', qty: 'x1', unit: 80_000, total: 80_000 }
  ];

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discount = 50_000;
  const tax = Math.round((subtotal - discount) * 0.08);
  const total = subtotal - discount + tax;
  const deposit = 100_000;
  const due = total - deposit;

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Receipt className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')} <span className="font-mono text-brand-gold ml-2">#BK-10425</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost">{t('printPreview')}</button>
          <button className="btn-primary"><CreditCard className="h-4 w-4" /> {t('chargeNow')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking summary */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">{t('bookingSummary')}</h2>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <Field label={t('serviceTime')} value="08/03 · 10:00 — 11:00" />
              <Field label={t('primaryStaff')} value="Anna Nguyễn" />
              <Field label={t('status')} value={t('statusInProgress')} />
              <Field label={t('membership')} value={t('memberGold')} />
              <Field label={t('loyaltyPoints')} value="2.450" />
              <Field label={t('customerPhone')} value="+84 901 234 567" />
            </div>
          </section>

          {/* Items table */}
          <section className="bg-white rounded-2xl shadow-soft border border-brand-cream/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-cream/50 flex items-center justify-between">
              <h2 className="font-serif text-lg text-brand-textmain">{t('items')}</h2>
              <button className="btn-ghost text-xs"><Plus className="h-4 w-4" /> {t('addItem')}</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-brand-ivory/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-1/2">{t('cols.item')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.qty')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('cols.unit')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('cols.total')}</th>
                  <th className="text-center px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-brand-ivory/20">
                    <td className="px-4 py-3 font-medium">{i.desc}</td>
                    <td className="px-4 py-3 text-center text-brand-textmuted">{i.qty}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{VND(i.unit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{VND(i.total)}</td>
                    <td className="px-3 py-3 text-center">
                      <button aria-label="remove" className="p-1 text-brand-textmuted hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Voucher / discount */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-gold" /> {t('voucher')}
            </h2>
            <div className="flex gap-2">
              <input
                placeholder={t('voucherPlaceholder')}
                className="flex-1 rounded-xl border border-brand-cream px-3 py-2 text-sm"
              />
              <button className="btn-ghost">{t('apply')}</button>
            </div>
            <p className="text-xs text-brand-textmuted mt-2">{t('voucherHint')}</p>
          </section>
        </div>

        {/* Payment summary */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60 sticky top-6">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">{t('paymentSummary')}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t('subtotal')} value={VND(subtotal)} />
              <Row label={t('discount')} value={`- ${VND(discount)}`} mute />
              <Row label={t('tax')} value={VND(tax)} mute />
              <div className="pt-2 mt-2 border-t border-brand-cream">
                <Row label={t('total')} value={VND(total)} bold />
              </div>
              <Row label={t('depositPaid')} value={`- ${VND(deposit)}`} mute />
              <div className="pt-2 mt-2 border-t border-brand-cream">
                <Row label={t('amountDue')} value={VND(due)} accent />
              </div>
            </dl>

            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('paymentMethod')}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'card', 'transfer', 'momo', 'vnpay', 'split'] as const).map(m => (
                  <button
                    key={m}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      m === 'transfer'
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-goldhover'
                        : 'border-brand-cream bg-white text-brand-textmain hover:border-brand-gold'
                    }`}
                  >
                    {t(`methods.${m}` as 'methods.cash')}
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full mt-5 btn-primary">
              <CreditCard className="h-4 w-4" /> {t('chargeAmount', { amount: VND(due) })}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-0.5">{label}</p>
      <p className="font-medium text-brand-textmain">{value}</p>
    </div>
  );
}

function Row({ label, value, mute, bold, accent }: { label: string; value: string; mute?: boolean; bold?: boolean; accent?: boolean }) {
  const cls = accent
    ? 'text-brand-gold font-serif text-xl'
    : bold
    ? 'font-semibold text-brand-textmain'
    : mute
    ? 'text-brand-textmuted'
    : 'text-brand-textmain';
  return (
    <div className="flex items-center justify-between">
      <dt className={mute ? 'text-brand-textmuted' : 'text-brand-textmain'}>{label}</dt>
      <dd className={`font-mono text-xs ${cls}`}>{value}</dd>
    </div>
  );
}
