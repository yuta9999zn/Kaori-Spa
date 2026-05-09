import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Sparkles, Plus, Activity, CheckCircle2, AlertTriangle, Wallet } from 'lucide-react';

type TStatus = 'active' | 'completed' | 'expiring' | 'paused';

// TODO(Phase B): wire to backend - replace with /v1/reports/treatments endpoint.
const TREATMENTS: { code: string; customer: string; combo: string; done: number; total: number; expiry: string; status: TStatus }[] = [
  { code: 'TR-001', customer: 'Trần Mỹ Duyên',   combo: 'Combo trẻ hoá da 6 buổi',    done: 4, total: 6, expiry: '2026-08-12', status: 'active' },
  { code: 'TR-002', customer: 'Phạm Anh Thư',    combo: 'Liệu trình triệt lông toàn thân 8 buổi', done: 7, total: 8, expiry: '2026-06-30', status: 'expiring' },
  { code: 'TR-003', customer: 'Nguyễn Văn An',   combo: 'Combo massage thư giãn 10 buổi', done: 10, total: 10, expiry: '2026-04-22', status: 'completed' },
  { code: 'TR-004', customer: 'Lê Quỳnh Như',    combo: 'Liệu trình giảm béo 12 buổi', done: 3, total: 12, expiry: '2026-12-01', status: 'active' },
  { code: 'TR-005', customer: 'Hoàng Thanh Tùng',combo: 'Triệt lông nam 6 buổi',       done: 2, total: 6, expiry: '2026-09-15', status: 'paused' },
  { code: 'TR-006', customer: 'Đỗ Hà My',        combo: 'Combo dưỡng trắng 5 buổi',    done: 4, total: 5, expiry: '2026-06-25', status: 'expiring' }
];

const COMBOS = [
  { name: 'Combo trẻ hoá da 6 buổi', price: 7_200_000, sold: 38 },
  { name: 'Triệt lông toàn thân 8 buổi', price: 12_000_000, sold: 24 },
  { name: 'Massage thư giãn 10 buổi', price: 5_500_000, sold: 56 },
  { name: 'Liệu trình giảm béo 12 buổi', price: 14_400_000, sold: 12 }
];

export default async function ReportTreatmentsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reportTreatments');

  const active = TREATMENTS.filter(x => x.status === 'active').length;
  const completed = TREATMENTS.filter(x => x.status === 'completed').length;
  const expiring = TREATMENTS.filter(x => x.status === 'expiring').length;
  const totalRev = COMBOS.reduce((s, c) => s + c.price * c.sold, 0);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button className="btn-primary"><Plus className="h-4 w-4" /> {t('addCombo')}</button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <Kpi label={t('kpi.activeTreatments')} value={String(active)} Icon={Activity} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.completedThisMonth')} value={String(completed)} Icon={CheckCircle2} accent="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label={t('kpi.expiringSoon')} value={String(expiring)} Icon={AlertTriangle} accent="text-amber-600" bg="bg-amber-50" />
        <Kpi label={t('kpi.totalRevenue')} value={fmtM(totalRev)} Icon={Wallet} accent="text-purple-600" bg="bg-purple-50" />
      </section>

      <section className="kpi-card mb-6">
        <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.ongoing')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <th className="text-left py-2 px-3 font-medium">{t('columns.code')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.customer')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.combo')}</th>
                <th className="text-left py-2 px-3 font-medium">{t('columns.progress')}</th>
                <th className="text-center py-2 px-3 font-medium">{t('columns.remaining')}</th>
                <th className="text-center py-2 px-3 font-medium">{t('columns.expiry')}</th>
                <th className="text-center py-2 px-3 font-medium">{t('columns.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {TREATMENTS.map(tr => {
                const pct = Math.round((tr.done / tr.total) * 100);
                return (
                  <tr key={tr.code}>
                    <td className="py-2.5 px-3 text-brand-gold">{tr.code}</td>
                    <td className="py-2.5 px-3">{tr.customer}</td>
                    <td className="py-2.5 px-3 text-brand-textmuted">{tr.combo}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 rounded-full bg-brand-cream overflow-hidden">
                          <div className="h-full bg-brand-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-brand-textmuted tabular-nums">{tr.done}/{tr.total}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center tabular-nums">{tr.total - tr.done}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs">{tr.expiry}</td>
                    <td className="py-2.5 px-3 text-center"><StatusBadge s={tr.status} label={t(`status.${tr.status}` as 'status.active')} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="kpi-card">
        <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.comboCatalog')}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {COMBOS.map(c => (
            <article key={c.name} className="rounded-2xl border border-brand-cream/70 p-4">
              <p className="font-medium text-brand-textmain text-sm">{c.name}</p>
              <p className="font-serif text-xl text-brand-gold mt-2">{fmtM(c.price)}</p>
              <p className="text-[11px] text-brand-textmuted mt-1">{c.sold} đã bán</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }

function StatusBadge({ s, label }: { s: TStatus; label: string }) {
  const cls = {
    active: 'bg-brand-gold/10 text-brand-goldhover border-brand-gold/30',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expiring: 'bg-amber-50 text-amber-700 border-amber-200',
    paused: 'bg-gray-100 text-gray-600 border-gray-200'
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
          <p className={`mt-1 font-serif text-2xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
