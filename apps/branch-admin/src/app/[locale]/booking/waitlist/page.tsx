import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, RefreshCw, MoreVertical } from 'lucide-react';

type WaitlistRow = {
  id: string;
  position: number | '-';
  customer: string;
  customerSub: string;
  service: string;
  duration: string;
  preferredStaff: string;
  arrival: string;
  waitMin: string;
  priority: 'normal' | 'member' | 'vip';
  status: 'waiting' | 'assigned';
  highlight?: boolean;
};

export default async function BookingWaitlistPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('bookingWaitlist');

  // TODO(Phase B): wire to backend when endpoint ships
  const rows: WaitlistRow[] = [
    {
      id: 'wl-1',
      position: 1,
      customer: 'Eleanor Vance',
      customerSub: '+84 901 234 567',
      service: 'Massage Trị Liệu Chuyên Sâu',
      duration: '60 ' + t('min'),
      preferredStaff: t('anyAvailable'),
      arrival: '17:45',
      waitMin: '23',
      priority: 'vip',
      status: 'waiting',
      highlight: true
    },
    {
      id: 'wl-2',
      position: 2,
      customer: 'Nguyễn Văn An',
      customerSub: t('walkIn'),
      service: 'Chăm sóc da Hydrating',
      duration: '60 ' + t('min'),
      preferredStaff: 'Anna N.',
      arrival: '17:50',
      waitMin: '18',
      priority: 'normal',
      status: 'waiting'
    },
    {
      id: 'wl-3',
      position: 3,
      customer: 'Marcus Chen',
      customerSub: '+84 911 888 777',
      service: 'Liệu trình đá nóng',
      duration: '75 ' + t('min'),
      preferredStaff: t('anyAvailable'),
      arrival: '18:00',
      waitMin: '8',
      priority: 'normal',
      status: 'waiting'
    },
    {
      id: 'wl-4',
      position: '-',
      customer: 'Trần Thu Hà',
      customerSub: '+84 902 555 111',
      service: 'Massage Thuỵ Điển',
      duration: '60 ' + t('min'),
      preferredStaff: 'Elena R.',
      arrival: '17:15',
      waitMin: '-',
      priority: 'normal',
      status: 'assigned'
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
          <button className="btn-ghost"><RefreshCw className="h-4 w-4" /> {t('refresh')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('add')}</button>
        </div>
      </header>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 mb-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {t('slotAvailableBanner', { staff: 'Anna Nguyen' })}
        </div>
        <button className="text-xs font-semibold text-emerald-700 hover:underline">{t('autoAssign')}</button>
      </div>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiTile label={t('kpi.waiting')} value="5" />
        <KpiTile label={t('kpi.avgWait')} value="18" suffix={t('min')} />
        <KpiTile label={t('kpi.availableStaff')} value="1" hint={t('kpi.ready')} />
        <KpiTile label={t('kpi.nextSlot')} value="18:45" hint={t('kpi.in37')} />
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 flex items-center justify-between bg-brand-ivory/30">
          <h2 className="font-serif text-lg text-brand-textmain">{t('currentQueue')}</h2>
          <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
            <option>{t('sortPosition')}</option>
            <option>{t('sortWait')}</option>
            <option>{t('sortPriority')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-center px-4 py-3 font-medium w-16">{t('cols.pos')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.customer')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.service')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.staff')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.arrival')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.waitTime')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.priority')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.id} className={r.highlight ? 'bg-brand-gold/5' : 'hover:bg-brand-ivory/30'}>
                  <td className="text-center px-4 py-3">
                    {r.position === '-' ? (
                      <span className="text-brand-textmuted">-</span>
                    ) : r.highlight ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold text-white font-bold text-xs">{r.position}</span>
                    ) : (
                      <span className="text-brand-textmuted font-bold">{r.position}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-medium text-brand-textmain ${r.status === 'assigned' ? 'line-through opacity-60' : ''}`}>{r.customer}</p>
                    <p className="text-[10px] text-brand-textmuted">{r.customerSub}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{r.service}</p>
                    <p className="text-[10px] text-brand-textmuted">{r.duration}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-textmain">{r.preferredStaff}</td>
                  <td className="text-center px-4 py-3 font-mono text-xs">{r.arrival}</td>
                  <td className="text-center px-4 py-3 text-brand-textmuted">{r.waitMin === '-' ? '-' : `${r.waitMin} ${t('min')}`}</td>
                  <td className="text-center px-4 py-3">
                    <PriorityBadge p={r.priority} label={t(`priority.${r.priority}` as 'priority.normal')} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge s={r.status} label={t(`status.${r.status}` as 'status.waiting')} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'waiting' ? (
                      <div className="inline-flex items-center gap-1">
                        <button className="rounded-lg bg-brand-gold text-white px-3 py-1.5 text-xs font-medium hover:bg-brand-goldhover">
                          {t('assignSlot')}
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="more">
                          <MoreVertical className="h-4 w-4 text-brand-textmuted" />
                        </button>
                      </div>
                    ) : (
                      <button className="text-xs font-medium text-brand-gold hover:underline">{t('viewBooking')}</button>
                    )}
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

function KpiTile({ label, value, suffix, hint }: { label: string; value: string; suffix?: string; hint?: string }) {
  return (
    <div className="kpi-card">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">
        {value}{suffix && <span className="text-xs ml-1 font-sans text-brand-textmuted">{suffix}</span>}
      </p>
      {hint && <p className="text-[10px] text-brand-textmuted mt-1">{hint}</p>}
    </div>
  );
}

function PriorityBadge({ p, label }: { p: 'normal' | 'member' | 'vip'; label: string }) {
  const cls =
    p === 'vip' ? 'bg-brand-gold/20 text-brand-goldhover border-brand-gold/30' :
    p === 'member' ? 'bg-purple-50 text-purple-700 border-purple-200' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function StatusBadge({ s, label }: { s: 'waiting' | 'assigned'; label: string }) {
  const cls = s === 'waiting'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {s === 'waiting' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5" />}
      {label}
    </span>
  );
}
