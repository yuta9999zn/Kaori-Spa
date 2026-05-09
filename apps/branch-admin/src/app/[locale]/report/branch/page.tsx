import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  BarChart3, TrendingUp, Wallet, Receipt, Percent,
  FileSpreadsheet, Download, Sparkles, Users
} from 'lucide-react';

// TODO(Phase B): wire to backend - replace with /v1/reports/branch endpoint.
const SERVICE_GROUPS = [
  { name: 'Triệt lông', revenue: 245_000_000, share: 38 },
  { name: 'Massage',    revenue: 168_000_000, share: 26 },
  { name: 'Chăm sóc da', revenue: 142_000_000, share: 22 },
  { name: 'Body therapy', revenue: 56_000_000, share: 9 },
  { name: 'Combo gói',  revenue: 32_000_000, share: 5 }
];

const TOP_STAFF = [
  { name: 'Minh Phương', bookings: 84, revenue: 92_000_000 },
  { name: 'Thu Hà',      bookings: 71, revenue: 78_500_000 },
  { name: 'Lan Hương',   bookings: 65, revenue: 72_000_000 },
  { name: 'Quỳnh Anh',   bookings: 58, revenue: 64_200_000 },
  { name: 'Đức Thanh',   bookings: 49, revenue: 51_800_000 }
];

const EXPENSE_BREAKDOWN = [
  { category: 'Lương nhân viên', amount: 145_000_000, share: 48 },
  { category: 'Mặt bằng',         amount: 60_000_000, share: 20 },
  { category: 'Vật tư',           amount: 42_000_000, share: 14 },
  { category: 'Marketing',        amount: 30_000_000, share: 10 },
  { category: 'Khác',             amount: 25_000_000, share: 8 }
];

const MONTHLY_REVENUE = [
  420, 460, 510, 540, 580, 620, 660, 643, 690, 712, 738, 760
];

export default async function ReportBranchPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reportBranch');

  const totalRevenue = SERVICE_GROUPS.reduce((s, r) => s + r.revenue, 0);
  const totalExpense = EXPENSE_BREAKDOWN.reduce((s, r) => s + r.amount, 0);
  const profit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;
  const maxMonthly = Math.max(...MONTHLY_REVENUE);
  const maxStaffRev = Math.max(...TOP_STAFF.map(s => s.revenue));
  const now = new Date();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
          <p className="text-xs text-brand-gold mt-1">
            {t('monthLabel', { month: now.getMonth() + 1, year: now.getFullYear() })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">
            <FileSpreadsheet className="h-4 w-4" /> {t('exportExcel')}
          </button>
          <button className="btn-primary">
            <Download className="h-4 w-4" /> {t('exportPdf')}
          </button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <Kpi label={t('kpi.revenue')}  value={fmtM(totalRevenue)} accent="text-brand-gold" bg="bg-brand-gold/10" Icon={TrendingUp} />
        <Kpi label={t('kpi.expense')}  value={fmtM(totalExpense)} accent="text-rose-600"   bg="bg-rose-50"        Icon={Receipt} />
        <Kpi label={t('kpi.profit')}   value={fmtM(profit)}       accent="text-emerald-600" bg="bg-emerald-50"     Icon={Wallet} />
        <Kpi label={t('kpi.margin')}   value={`${margin}%`}        accent="text-blue-600"   bg="bg-blue-50"        Icon={Percent} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <SectionHeader Icon={Sparkles} label={t('sections.revenueByService')} />
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                <th className="text-left pb-2 font-medium">{t('columns.category')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.amount')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.share')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {SERVICE_GROUPS.map(r => (
                <tr key={r.name}>
                  <td className="py-2.5">{r.name}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtM(r.revenue)}</td>
                  <td className="py-2.5 text-right text-brand-gold tabular-nums">{r.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="kpi-card">
          <SectionHeader Icon={Users} label={t('sections.topStaff')} />
          <ul className="mt-3 space-y-3">
            {TOP_STAFF.map(s => (
              <li key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-brand-textmain font-medium">{s.name}</span>
                  <span className="text-brand-gold tabular-nums">{fmtM(s.revenue)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                  <div
                    className="h-full bg-brand-gold"
                    style={{ width: `${(s.revenue / maxStaffRev) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-brand-textmuted mt-0.5">{s.bookings} {t('columns.bookings').toLowerCase()}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="kpi-card">
          <SectionHeader Icon={Receipt} label={t('sections.expenseBreakdown')} />
          <table className="w-full text-sm mt-3">
            <tbody className="divide-y divide-brand-cream/60">
              {EXPENSE_BREAKDOWN.map(r => (
                <tr key={r.category}>
                  <td className="py-2.5">{r.category}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtM(r.amount)}</td>
                  <td className="py-2.5 text-right text-brand-textmuted tabular-nums w-16">{r.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="kpi-card">
          <SectionHeader Icon={BarChart3} label={t('sections.monthly')} />
          <div className="grid grid-cols-12 gap-1.5 h-44 items-end mt-4">
            {MONTHLY_REVENUE.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-brand-textmuted tabular-nums">{v}M</span>
                <div
                  className="w-full rounded-t bg-brand-gold/70"
                  style={{ height: `${Math.max(2, (v / maxMonthly) * 100)}%` }}
                />
                <span className="text-[9px] text-brand-textmuted">{i + 1}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }

function Kpi({
  label, value, accent, bg, Icon
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

function SectionHeader({
  Icon, label
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-brand-textmuted">
      <Icon className="h-3.5 w-3.5 text-brand-gold" />
      <span>{label}</span>
    </div>
  );
}
