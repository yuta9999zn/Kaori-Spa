import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { CalendarClock, MoreVertical } from 'lucide-react';

type Booking = {
  id: string;
  date: string;
  service: string;
  staff: string;
  amount: string;
  payment: 'paid' | 'unpaid' | 'refunded';
  status: 'completed' | 'cancelled' | 'noShow' | 'upcoming';
};

export default async function CustomerBookingHistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  const t = await getTranslations('customerBookingHistory');

  // TODO(Phase B): wire to backend when endpoint ships
  const bookings: Booking[] = [
    { id: 'BK-10425', date: '15/03/2026 14:00', service: 'Facial Treatment', staff: 'Anna N.', amount: '$80.00', payment: 'paid', status: 'upcoming' },
    { id: 'BK-10410', date: '01/03/2026 10:30', service: 'Deep Tissue Massage', staff: 'Elena R.', amount: '$120.00', payment: 'paid', status: 'completed' },
    { id: 'BK-10395', date: '14/02/2026 16:00', service: 'Hot Stone Massage', staff: 'Anna N.', amount: '$150.00', payment: 'paid', status: 'completed' },
    { id: 'BK-10380', date: '02/02/2026 11:00', service: 'Hydrating Facial', staff: 'Sarah M.', amount: '$95.00', payment: 'unpaid', status: 'cancelled' },
    { id: 'BK-10370', date: '15/01/2026 09:00', service: 'Aromatherapy', staff: 'Elena R.', amount: '$110.00', payment: 'unpaid', status: 'noShow' }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">JD</div>
          <div>
            <h1 className="font-serif text-3xl text-brand-textmain">John Doe</h1>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-brand-gold" />
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-brand-gold">{t('upcoming')}</h3>
            <p className="font-serif text-xl text-brand-textmain mt-0.5">Facial Treatment · 15/03/2026 14:00</p>
            <p className="text-xs text-brand-textmuted">Anna N. · {t('amount')} $80.00</p>
          </div>
        </div>
        <button className="btn-ghost text-xs">{t('viewDetail')}</button>
      </div>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-6 mb-6">
        <KpiTile label={t('kpi.totalVisits')} value="12" />
        <KpiTile label={t('kpi.completed')} value="10" accent="green" />
        <KpiTile label={t('kpi.cancelled')} value="1" accent="rose" />
        <KpiTile label={t('kpi.noShows')} value="1" accent="red" />
        <KpiTile label={t('kpi.avgFreq')} value={t('every3w')} />
        <KpiTile label={t('kpi.avgSpend')} value="$125.00" />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30 flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-textmain">{t('history')}</h2>
          <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
            <option>{t('filter.all')}</option>
            <option>{t('filter.completed')}</option>
            <option>{t('filter.cancelled')}</option>
            <option>{t('filter.noShow')}</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.code')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.date')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.service')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.staff')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.amount')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.payment')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{b.date}</td>
                  <td className="px-4 py-3 font-medium text-brand-textmain">{b.service}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{b.staff}</td>
                  <td className="px-4 py-3 text-right font-serif">{b.amount}</td>
                  <td className="px-4 py-3"><PaymentBadge p={b.payment} label={t(`payment.${b.payment}`)} /></td>
                  <td className="px-4 py-3"><StatusBadge s={b.status} label={t(`status.${b.status}`)} /></td>
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

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' | 'rose' }) {
  const cls = accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-500' : accent === 'rose' ? 'text-brand-rose' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cls}`}>{label}</p>
      <p className="font-serif text-xl text-brand-textmain">{value}</p>
    </div>
  );
}

function PaymentBadge({ p, label }: { p: Booking['payment']; label: string }) {
  const cls = p === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : p === 'refunded' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function StatusBadge({ s, label }: { s: Booking['status']; label: string }) {
  const cls =
    s === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'upcoming' ? 'bg-brand-gold/10 text-brand-goldhover border-brand-gold/30' :
    s === 'cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' :
    'bg-red-50 text-red-700 border-red-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
