import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { AlertTriangle, RefreshCw, Filter } from 'lucide-react';

type ConflictType = 'staff' | 'room' | 'sync';
type ConflictStatus = 'unresolved' | 'investigating' | 'resolved';

type ConflictRow = {
  id: string;
  type: ConflictType;
  bookingId: string;
  customer: string;
  service: string;
  scheduled: string;
  staff: string;
  room: string;
  reason: string;
  status: ConflictStatus;
};

export default async function BookingConflictsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('booking');
  const t = await getTranslations('bookingConflicts');

  // TODO(Phase B): wire to backend when endpoint ships
  const rows: ConflictRow[] = [
    {
      id: 'CF-2001',
      type: 'staff',
      bookingId: 'BK-10425',
      customer: 'Lê Thị Hương',
      service: 'Massage Trị Liệu (60 phút)',
      scheduled: '10/03 · 10:00',
      staff: 'Anna Nguyễn',
      room: 'VIP 2',
      reason: t('reason.staffOverlap'),
      status: 'unresolved'
    },
    {
      id: 'CF-2002',
      type: 'room',
      bookingId: 'BK-10428',
      customer: 'Marcus Chen',
      service: 'Liệu trình đá nóng',
      scheduled: '10/03 · 11:00',
      staff: 'Elena R.',
      room: 'Massage 1',
      reason: t('reason.roomBusy'),
      status: 'investigating'
    },
    {
      id: 'CF-2003',
      type: 'sync',
      bookingId: 'BK-10430',
      customer: 'Trần Văn Phúc',
      service: 'Triệt lông toàn thân',
      scheduled: '11/03 · 14:00',
      staff: 'Maria Tran',
      room: 'Laser 1',
      reason: t('reason.syncFail'),
      status: 'resolved'
    }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-brand-rose" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Filter className="h-4 w-4" /> {t('filter')}</button>
          <button className="btn-ghost"><RefreshCw className="h-4 w-4" /> {t('refresh')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')} value="7" />
        <KpiTile label={t('kpi.staff')} value="4" tone="rose" />
        <KpiTile label={t('kpi.room')} value="2" tone="amber" />
        <KpiTile label={t('kpi.sync')} value="1" tone="purple" />
        <KpiTile label={t('kpi.unresolved')} value="5" tone="red" />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.id')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.type')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.bookingId')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.customerService')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.scheduled')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.staffRoom')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.reason')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.id}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={r.type} label={t(`type.${r.type}` as 'type.staff')} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.bookingId}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.customer}</p>
                    <p className="text-[10px] text-brand-textmuted">{r.service}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.scheduled}</td>
                  <td className="px-4 py-3">
                    <p>{r.staff}</p>
                    <p className="text-[10px] text-brand-textmuted">{r.room}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-textmuted max-w-xs">{r.reason}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} label={t(`status.${r.status}` as 'status.unresolved')} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs font-medium text-brand-gold hover:underline">{t('resolve')}</button>
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

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: 'rose' | 'amber' | 'purple' | 'red' }) {
  const labelCls =
    tone === 'rose' ? 'text-brand-rose' :
    tone === 'amber' ? 'text-amber-600' :
    tone === 'purple' ? 'text-purple-600' :
    tone === 'red' ? 'text-red-600' :
    'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}

function TypeBadge({ type, label }: { type: ConflictType; label: string }) {
  const cls =
    type === 'staff' ? 'bg-rose-50 text-rose-700 border-rose-200' :
    type === 'room' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-purple-50 text-purple-700 border-purple-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function StatusBadge({ status, label }: { status: ConflictStatus; label: string }) {
  const cls =
    status === 'unresolved' ? 'bg-red-50 text-red-700 border-red-200' :
    status === 'investigating' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-emerald-50 text-emerald-700 border-emerald-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
