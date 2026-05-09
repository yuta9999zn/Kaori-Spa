'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarRange, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRooms, type RoomDto, type BedDto } from '@/lib/hooks';

type Status = 'available' | 'booked' | 'in_use' | 'cleaning' | 'maintenance';

const HOURS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

const COLORS: Record<Status, string> = {
  available:   'bg-emerald-50 border-emerald-200',
  booked:      'bg-amber-100 border-amber-200',
  in_use:      'bg-brand-gold/30 border-brand-gold/40',
  cleaning:    'bg-blue-50 border-blue-200',
  maintenance: 'bg-rose-50 border-rose-200'
};

/** Map a bed status to a calendar cell status. The booking grid below is a
 *  visual mock until the timeline endpoint ships. */
function bedBaseStatus(bed: BedDto): Status {
  if (bed.status === 'maintenance' || bed.status === 'retired') return 'maintenance';
  return 'available';
}

/** Pseudo-random but stable status pattern per (row, hour) so the page looks
 *  alive without an availability endpoint. */
// TODO(Phase B): replace with /v1/availability or /v1/rooms/calendar.
function mockCellStatus(rowIdx: number, hourIdx: number, base: Status): Status {
  if (base === 'maintenance') return 'maintenance';
  const seed = (rowIdx * 7 + hourIdx * 3) % 5;
  const ladder: Status[] = ['available', 'booked', 'in_use', 'cleaning', 'available'];
  return ladder[seed] ?? 'available';
}

interface Row {
  key: string;
  label: string;
  base: Status;
}

function buildRows(rooms: RoomDto[]): Row[] {
  const out: Row[] = [];
  for (const r of rooms) {
    const roomName = r.name?.vi ?? r.name?.en ?? r.code;
    if (r.beds.length === 0) {
      out.push({ key: r.id, label: `${roomName} · ${r.roomType}`, base: 'available' });
    } else {
      for (const b of r.beds) {
        const bedName = b.name?.vi ?? b.name?.en ?? b.code;
        out.push({
          key: `${r.id}:${b.id}`,
          label: `${roomName} · ${bedName}`,
          base: bedBaseStatus(b)
        });
      }
    }
  }
  return out;
}

export default function RoomCalendarView() {
  const t = useTranslations('roomCalendar');
  const { data, loading, error } = useRooms();

  const rows = useMemo(() => buildRows(data ?? []), [data]);
  const grid = useMemo<Status[][]>(() => {
    return rows.map((r, i) => HOURS.map((_, j) => mockCellStatus(i, j, r.base)));
  }, [rows]);

  const flat = grid.flat();
  const total = flat.length || 1;
  const inUse = flat.filter(c => c === 'in_use').length;
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
          <p className="font-serif text-2xl text-brand-textmain mt-1">{rows.length}</p>
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
        {loading && (
          <div className="py-10 text-center">
            <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
          </div>
        )}
        {!loading && error && (
          <div className="py-10 text-center text-sm text-rose-600">{error.message}</div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="py-10 text-center text-sm text-brand-textmuted">Chưa có phòng nào</div>
        )}
        {!loading && !error && rows.length > 0 && (
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
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="py-1.5 px-2 text-brand-textmain font-medium sticky left-0 bg-white z-10">
                    {r.label}
                  </td>
                  {grid[i].map((c, j) => (
                    <td key={j} className="py-1 px-0.5">
                      <div className={`h-7 rounded border ${COLORS[c]}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
