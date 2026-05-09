import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  CalendarDays, Download, TrendingUp, Calendar, UserPlus, Receipt, Wallet
} from 'lucide-react';

// TODO(Phase B): wire to backend - replace with /v1/reports/daily endpoint.
const HOURLY_REVENUE = [
  { hour: '08', value: 5 },
  { hour: '09', value: 12 },
  { hour: '10', value: 18 },
  { hour: '11', value: 22 },
  { hour: '12', value: 16 },
  { hour: '13', value: 14 },
  { hour: '14', value: 21 },
  { hour: '15', value: 28 },
  { hour: '16', value: 24 },
  { hour: '17', value: 19 },
  { hour: '18', value: 15 },
  { hour: '19', value: 10 }
];

const TRANSACTIONS = [
  { time: '09:15', code: 'BK-2401', customer: 'Trần Mỹ Duyên', service: 'Massage Thuỵ Điển 60p', staff: 'Minh Phương', amount: 850_000, method: 'card' },
  { time: '10:30', code: 'BK-2402', customer: 'Nguyễn Văn An', service: 'Triệt lông nách', staff: 'Thu Hà', amount: 600_000, method: 'cash' },
  { time: '11:45', code: 'BK-2403', customer: 'Phạm Anh Thư', service: 'Combo dưỡng da Hydrating', staff: 'Lan Hương', amount: 1_350_000, method: 'transfer' },
  { time: '13:20', code: 'BK-2404', customer: 'Lê Quỳnh Như', service: 'Massage đá nóng 90p', staff: 'Quỳnh Anh', amount: 1_100_000, method: 'card' },
  { time: '14:55', code: 'BK-2405', customer: 'Hoàng Thanh Tùng', service: 'Triệt lông toàn thân nam', staff: 'Đức Thanh', amount: 2_400_000, method: 'card' },
  { time: '16:10', code: 'BK-2406', customer: 'Đỗ Hà My', service: 'Chăm sóc da cơ bản', staff: 'Minh Phương', amount: 720_000, method: 'cash' }
];

export default async function ReportDailyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reportDaily');

  const revenue = TRANSACTIONS.reduce((s, r) => s + r.amount, 0);
  const bookings = TRANSACTIONS.length;
  const newCustomers = 4;
  const avgTicket = bookings > 0 ? Math.round(revenue / bookings) : 0;
  const max = Math.max(...HOURLY_REVENUE.map(h => h.value));

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Calendar className="h-4 w-4" /> {t('datePicker')}</button>
          <button className="btn-primary"><Download className="h-4 w-4" /> {t('exportPdf')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <Kpi label={t('kpi.revenue')} value={fmtM(revenue)} Icon={TrendingUp} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.bookings')} value={String(bookings)} Icon={Calendar} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.newCustomers')} value={String(newCustomers)} Icon={UserPlus} accent="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label={t('kpi.avgTicket')} value={fmtK(avgTicket)} Icon={Receipt} accent="text-purple-600" bg="bg-purple-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.hourlyRevenue')}</h2>
          <div className="grid grid-cols-12 gap-1.5 h-40 items-end">
            {HOURLY_REVENUE.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-brand-textmuted tabular-nums">{h.value}M</span>
                <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${Math.max(2, (h.value / max) * 100)}%` }} />
                <span className="text-[9px] text-brand-textmuted">{h.hour}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-gold" /> {t('sections.cashflow')}
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Cash</span><span className="tabular-nums text-brand-textmain">2.1M ₫</span></li>
            <li className="flex justify-between"><span>Card</span><span className="tabular-nums text-brand-textmain">3.7M ₫</span></li>
            <li className="flex justify-between"><span>Transfer</span><span className="tabular-nums text-brand-textmain">1.0M ₫</span></li>
          </ul>
          <div className="mt-4 pt-3 border-t border-brand-cream/60">
            <h3 className="text-[11px] uppercase tracking-widest text-brand-textmuted mb-2">{t('sections.shiftSummary')}</h3>
            <p className="text-xs text-brand-textmuted">Sáng: 4 nv · Chiều: 5 nv · Tối: 3 nv</p>
          </div>
        </article>
      </section>

      <section className="kpi-card">
        <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.transactionLog')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <th className="text-left py-2 px-3 font-medium">{t('columns.time')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.code')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.customer')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.service')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.staff')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.amount')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.method')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {TRANSACTIONS.map(tx => (
                <tr key={tx.code}>
                  <td className="py-2.5 px-3 font-mono text-xs">{tx.time}</td>
                  <td className="py-2.5 px-3 text-brand-gold">{tx.code}</td>
                  <td className="py-2.5 px-3">{tx.customer}</td>
                  <td className="py-2.5 px-3 text-brand-textmuted">{tx.service}</td>
                  <td className="py-2.5 px-3">{tx.staff}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{fmtK(tx.amount)}</td>
                  <td className="py-2.5 px-3"><span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{tx.method}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }
function fmtK(n: number) { return `${(n / 1_000).toFixed(0)}K ₫`; }

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
          <p className={`mt-1 font-serif text-2xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
