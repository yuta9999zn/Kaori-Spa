import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Search, Download, Filter } from 'lucide-react';

type HistoryRow = {
  id: string;
  customer: string;
  customerSub: string;
  service: string;
  dateTime: string;
  branch: string;
  staff: string;
  status: 'completed' | 'cancelled' | 'noshow';
  payment: 'paid' | 'unpaid' | 'refunded';
  total: number;
};

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function BookingHistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('bookingHistory');

  // TODO(Phase B): wire to backend when endpoint ships
  const rows: HistoryRow[] = [
    {
      id: 'BK-10425',
      customer: 'Lê Thị Hương',
      customerSub: '+84 901 234 567',
      service: 'Massage cổ vai gáy (60 phút)',
      dateTime: '08/03/2026 · 10:00',
      branch: 'Quận 1',
      staff: 'Anna Nguyễn',
      status: 'completed',
      payment: 'paid',
      total: 450000
    },
    {
      id: 'BK-10424',
      customer: 'Marcus Chen',
      customerSub: '+84 911 888 777',
      service: 'Liệu trình đá nóng (75 phút)',
      dateTime: '07/03/2026 · 19:00',
      branch: 'Quận 1',
      staff: 'Elena R.',
      status: 'completed',
      payment: 'paid',
      total: 750000
    },
    {
      id: 'BK-10423',
      customer: 'Trần Văn Phúc',
      customerSub: '+84 912 333 222',
      service: 'Triệt lông toàn thân nam',
      dateTime: '07/03/2026 · 15:30',
      branch: 'Westside',
      staff: 'Maria Trần',
      status: 'cancelled',
      payment: 'refunded',
      total: 1200000
    },
    {
      id: 'BK-10422',
      customer: 'Nguyễn Mỹ Linh',
      customerSub: '+84 909 222 111',
      service: 'Chăm sóc da Hydrating',
      dateTime: '06/03/2026 · 14:00',
      branch: 'Quận 1',
      staff: 'Anna Nguyễn',
      status: 'noshow',
      payment: 'unpaid',
      total: 600000
    }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Filter className="h-4 w-4" /> {t('filter')}</button>
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('export')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')} value="12.450" />
        <KpiTile label={t('kpi.today')} value="84" />
        <KpiTile label={t('kpi.completed')} value="11.420" tone="emerald" />
        <KpiTile label={t('kpi.cancelled')} value="840" tone="red" />
        <KpiTile label={t('kpi.noShowRate')} value="4.2%" tone="rose" />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md w-full sm:w-auto shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select className="rounded-full border border-brand-cream bg-white px-3 py-2 text-xs">
          <option>{t('filterStatusAll')}</option>
          <option>{t('status.completed')}</option>
          <option>{t('status.cancelled')}</option>
          <option>{t('status.noshow')}</option>
        </select>
        <select className="rounded-full border border-brand-cream bg-white px-3 py-2 text-xs">
          <option>{t('filterDateAny')}</option>
          <option>{t('filterLast7')}</option>
          <option>{t('filterLast30')}</option>
        </select>
      </div>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.id')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.customer')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.service')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.dateTime')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.branchStaff')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.payment')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-textmain">{r.customer}</p>
                    <p className="text-[10px] text-brand-textmuted font-mono">{r.customerSub}</p>
                  </td>
                  <td className="px-4 py-3">{r.service}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.dateTime}</td>
                  <td className="px-4 py-3">
                    <p>{r.branch}</p>
                    <p className="text-[10px] text-brand-textmuted">{r.staff}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} label={t(`status.${r.status}` as 'status.completed')} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge payment={r.payment} label={t(`payment.${r.payment}` as 'payment.paid')} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-brand-textmain">{VND(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'red' | 'rose' }) {
  const labelCls =
    tone === 'emerald' ? 'text-emerald-600' :
    tone === 'red' ? 'text-red-500' :
    tone === 'rose' ? 'text-brand-rose' :
    'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: HistoryRow['status']; label: string }) {
  const cls =
    status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
    'bg-rose-50 text-rose-700 border-rose-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function PaymentBadge({ payment, label }: { payment: HistoryRow['payment']; label: string }) {
  const cls =
    payment === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    payment === 'unpaid' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-purple-50 text-purple-700 border-purple-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
