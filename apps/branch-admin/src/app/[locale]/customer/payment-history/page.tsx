import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Receipt, CornerUpLeft, CreditCard } from 'lucide-react';

type Pay = {
  id: string;
  invoice: string;
  date: string;
  amount: string;
  method: 'card' | 'cash' | 'transfer' | 'momo';
  type: 'payment' | 'refund' | 'partial' | 'deposit';
  booking: string;
  status: 'success' | 'refunded' | 'pending';
};

export default async function CustomerPaymentHistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customerPaymentHistory');

  // TODO(Phase B): wire to backend when endpoint ships
  const payments: Pay[] = [
    { id: 'PAY-2045', invoice: 'INV-2045', date: '15/03/2026', amount: '$80.00', method: 'card', type: 'payment', booking: 'BK-10425', status: 'success' },
    { id: 'PAY-2032', invoice: 'INV-2032', date: '01/03/2026', amount: '-$45.00', method: 'card', type: 'refund', booking: 'BK-10410', status: 'refunded' },
    { id: 'PAY-2018', invoice: 'INV-2018', date: '14/02/2026', amount: '$150.00', method: 'cash', type: 'partial', booking: 'BK-10395', status: 'success' },
    { id: 'PAY-2010', invoice: 'INV-2010', date: '02/02/2026', amount: '$120.00', method: 'transfer', type: 'deposit', booking: 'BK-10380', status: 'success' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">JD</div>
          <div>
            <h1 className="font-serif text-3xl text-brand-textmain">John Doe</h1>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><CornerUpLeft className="h-4 w-4" /> {t('issueRefund')}</button>
          <button className="btn-primary"><Receipt className="h-4 w-4" /> {t('newInvoice')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.totalSpending')} value="$1,540.00" big />
        <KpiTile label={t('kpi.totalPayments')} value="12" />
        <KpiTile label={t('kpi.totalRefunds')} value="$120.00" accent="red" />
        <KpiTile label={t('kpi.avgPayment')} value="$128.33" />
        <KpiTile label={t('kpi.preferredMethod')} value={t('method.card')} icon={<CreditCard className="h-4 w-4" />} />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30 flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-textmain">{t('history')}</h2>
          <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
            <option>{t('filter.all')}</option>
            <option>{t('type.payment')}</option>
            <option>{t('type.refund')}</option>
            <option>{t('type.deposit')}</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.invoice')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.date')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.type')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.method')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.bookingRef')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.amount')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.invoice}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{p.date}</td>
                  <td className="px-4 py-3"><TypeBadge tp={p.type} label={t(`type.${p.type}`)} /></td>
                  <td className="px-4 py-3 text-brand-textmuted">{t(`method.${p.method}`)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{p.booking}</td>
                  <td className={`px-4 py-3 text-right font-serif text-base ${p.amount.startsWith('-') ? 'text-red-600' : 'text-brand-textmain'}`}>{p.amount}</td>
                  <td className="px-4 py-3"><StatusBadge s={p.status} label={t(`status.${p.status}`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, accent, big, icon }: { label: string; value: string; accent?: 'red'; big?: boolean; icon?: React.ReactNode }) {
  const cls = accent === 'red' ? 'text-red-500' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5 ${cls}`}>{icon}{label}</p>
      <p className={`font-serif text-brand-textmain ${big ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}

function TypeBadge({ tp, label }: { tp: Pay['type']; label: string }) {
  const cls =
    tp === 'payment' ? 'bg-green-50 text-green-700 border-green-200' :
    tp === 'refund' ? 'bg-red-50 text-red-700 border-red-200' :
    tp === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-blue-50 text-blue-700 border-blue-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function StatusBadge({ s, label }: { s: Pay['status']; label: string }) {
  const cls =
    s === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'refunded' ? 'bg-red-50 text-red-700 border-red-200' :
    'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
