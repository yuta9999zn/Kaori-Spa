import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';

type Status = 'available' | 'booked' | 'in_use' | 'cleaning' | 'maintenance';

// TODO(Phase B): wire to backend - replace with /v1/rooms/calendar endpoint.
const ROOMS = [
  'Phòng 101 · VIP',
  'Phòng 102 · Massage',
  'Phòng 103 · Massage',
  'Phòng 201 · Laser',
  'Phòng 202 · Couple',
  'Phòng 203 · Standard'
];

const HOURS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

// 6 rooms × 12 hours
const GRID: Status[][] = [
  ['available', 'booked', 'booked', 'in_use', 'in_use', 'cleaning', 'available', 'booked', 'booked', 'in_use', 'cleaning', 'available'],
  ['available', 'available', 'booked', 'in_use', 'cleaning', 'available', 'booked', 'booked', 'in_use', 'available', 'available', 'available'],
  ['booked', 'in_use', 'cleaning', 'available', 'available', 'booked', 'booked', 'in_use', 'cleaning', 'available', 'booked', 'in_use'],
  ['maintenance', 'maintenance', 'maintenance', 'available', 'booked', 'in_use', 'cleaning', 'available', 'booked', 'in_use', 'cleaning', 'available'],
  ['available', 'booked', 'in_use', 'in_use', 'cleaning', 'available', 'booked', 'in_use', 'in_use', 'cleaning', 'available', 'booked'],
  ['available', 'available', 'booked', 'in_use', 'cleaning', 'available', 'available', 'booked', 'in_use', 'in_use', 'cleaning', 'available']
];

const COLORS: Record<Status, string> = {
  available: 'bg-emerald-50 border-emerald-200',
  booked: 'bg-amber-100 border-amber-200',
  in_use: 'bg-brand-gold/30 border-brand-gold/40',
  cleaning: 'bg-blue-50 border-blue-200',
  maintenance: 'bg-rose-50 border-rose-200'
};

export default async function RoomCalendarPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('roomCalendar');

  const flat = GRID.flat();
  const inUse = flat.filter(c => c === 'in_use').length;
  const total = flat.length;
  const busy = flat.filter(c => c === 'in_use' || c === 'booked').length;
  const occupancy = Math.round((busy / total) * 100);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <CalendarRange className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><ChevronLeft className="h-4 w-4" /> {t('prev')}</button>
          <button className="btn-ghost">{t('today')}</button>
          <button className="btn-ghost">{t('next')} <ChevronRight className="h-4 w-4" /></button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-3 mb-6">
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('summary.rooms')}</p>
          <p className="font-serif text-2xl text-brand-textmain mt-1">{ROOMS.length}</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('summary.occupancy')}</p>
          <p className="font-serif text-2xl text-brand-gold mt-1">{occupancy}%</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('summary.current')}</p>
          <p className="font-serif text-2xl text-brand-textmain mt-1">{inUse}</p>
        </article>
      </section>

      <section className="kpi-card mb-4 overflow-x-auto">
        <table className="w-full text-xs min-w-[1000px]">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 sticky left-0 bg-white z-10 w-48">&nbsp;</th>
              {HOURS.map(h => (
                <th key={h} className="text-center py-2 px-1 font-mono text-brand-textmuted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOMS.map((r, i) => (
              <tr key={r}>
                <td className="py-1.5 px-2 text-brand-textmain font-medium sticky left-0 bg-white z-10">{r}</td>
                {GRID[i].map((c, j) => (
                  <td key={j} className="py-1 px-0.5">
                    <div className={`h-7 rounded border ${COLORS[c]}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap gap-3 text-xs">
        {(['available', 'booked', 'in_use', 'cleaning', 'maintenance'] as const).map(s => (
          <span key={s} className="inline-flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded ${COLORS[s]}`} />
            <span className="text-brand-textmuted">{t(`legend.${s}` as 'legend.available')}</span>
          </span>
        ))}
      </div>
    </>
  );
}
