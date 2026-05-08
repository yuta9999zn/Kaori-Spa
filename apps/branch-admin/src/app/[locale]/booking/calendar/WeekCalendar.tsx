'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRooms, type RoomDto, type BedDto } from '@/lib/hooks';

interface BookingBlock {
  id: string;
  bedId: string;
  customer: string;
  service: string;
  staff: string;
  startMin: number;   // minutes since 09:00
  durationMin: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
}

const SAMPLE_BOOKINGS: Record<number, BookingBlock[]> = {
  // dayOffset (0=Mon … 6=Sun) → list
  0: [
    { id: 'BK-001', bedId: 'b1', customer: 'Nguyễn Thị Mai',  service: 'VIO Combo',           staff: 'Mai', startMin:   0, durationMin: 60, status: 'confirmed'   },
    { id: 'BK-002', bedId: 'b2', customer: 'Trần Thị Lan',    service: 'Triệt Toàn Thân',     staff: 'Mai', startMin:  90, durationMin: 120,status: 'in_progress' },
    { id: 'BK-003', bedId: 'b3', customer: 'Lê Thị Hoa',      service: 'Yomogi',              staff: 'Yến', startMin: 240, durationMin: 30, status: 'pending'     }
  ],
  2: [
    { id: 'BK-004', bedId: 'b5', customer: 'Phạm Thị Yến',    service: 'Set Beauty VIP',      staff: 'Hương',startMin: 180, durationMin: 120,status: 'confirmed'  }
  ]
};

const STATUS_BG: Record<BookingBlock['status'], string> = {
  pending:     'bg-amber-100 border-amber-300 text-amber-900',
  confirmed:   'bg-blue-100 border-blue-300 text-blue-900',
  in_progress: 'bg-emerald-100 border-emerald-300 text-emerald-900',
  done:        'bg-slate-100 border-slate-300 text-slate-700',
  cancelled:   'bg-rose-100 border-rose-300 text-rose-700 opacity-60 line-through'
};

const HOUR_HEIGHT_PX = 64;
const SLOT_MIN = 30;
const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i);   // 09:00 → 21:00
const DAYS = ['T2','T3','T4','T5','T6','T7','CN'];

export default function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const { data: rooms } = useRooms();

  const beds = useMemo(() => flatBeds(rooms), [rooms]);

  const dates = useMemo(() => {
    return DAYS.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const goPrev = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const goNext = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday = () => setWeekStart(mondayOf(new Date()));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">Lịch tuần</h1>
          <p className="text-sm text-brand-textmuted">
            {fmtDate(dates[0])} – {fmtDate(dates[6])}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="btn-ghost !py-2 !px-3"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={goToday} className="btn-ghost !py-2 !px-3">Hôm nay</button>
          <button onClick={goNext} className="btn-ghost !py-2 !px-3"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(7, minmax(140px, 1fr))` }}>
          {/* Header row */}
          <div className="border-b border-brand-cream bg-brand-cream/30 p-2 text-[10px] uppercase tracking-widest text-brand-textmuted">Giờ</div>
          {dates.map((d, i) => (
            <div key={i} className={cn(
              'border-b border-l border-brand-cream bg-brand-cream/30 p-2 text-center text-xs',
              isToday(d) && 'bg-brand-gold/10'
            )}>
              <div className="font-medium text-brand-textmain">{DAYS[i]}</div>
              <div className="text-[11px] text-brand-textmuted">{d.getDate()}/{d.getMonth() + 1}</div>
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(h => (
            <>
              <div key={`hour-${h}`} className="border-b border-brand-cream/60 text-[10px] text-brand-textmuted text-right pr-2 pt-1"
                style={{ height: HOUR_HEIGHT_PX }}>
                {String(h).padStart(2, '0')}:00
              </div>
              {dates.map((_, d) => (
                <div
                  key={`cell-${h}-${d}`}
                  className="border-b border-l border-brand-cream/60 relative"
                  style={{ height: HOUR_HEIGHT_PX }}
                >
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-brand-cream/40" />
                </div>
              ))}
            </>
          ))}

          {/* Booking blocks (overlay) */}
          {dates.map((_, dayIdx) => {
            const list = SAMPLE_BOOKINGS[dayIdx] ?? [];
            return list.map(b => {
              const top = (b.startMin / 60) * HOUR_HEIGHT_PX;
              const height = (b.durationMin / 60) * HOUR_HEIGHT_PX;
              const left = `calc(60px + ${dayIdx} * (100% - 60px) / 7 + 4px)`;
              const width = `calc((100% - 60px) / 7 - 8px)`;
              return (
                <div
                  key={b.id}
                  draggable
                  className={cn(
                    'absolute rounded-lg border-l-4 px-2 py-1 text-[11px] shadow cursor-grab',
                    STATUS_BG[b.status]
                  )}
                  style={{
                    top: `calc(${HOUR_HEIGHT_PX}px + ${top}px)`,
                    height: `${height}px`,
                    left, width
                  }}
                  title={`${b.id} · ${b.customer} · ${b.service}`}
                >
                  <div className="font-medium leading-tight truncate">{b.customer}</div>
                  <div className="text-[10px] truncate">{b.service}</div>
                  <div className="text-[10px] opacity-70">@{b.staff} · {beds.find(x => x.id === b.bedId)?.code ?? ''}</div>
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-textmuted">
        <Legend cls={STATUS_BG.pending}     label="Chờ xác nhận" />
        <Legend cls={STATUS_BG.confirmed}   label="Đã xác nhận" />
        <Legend cls={STATUS_BG.in_progress} label="Đang phục vụ" />
        <Legend cls={STATUS_BG.done}        label="Hoàn tất" />
        <Legend cls={STATUS_BG.cancelled}   label="Đã huỷ" />
      </div>
    </>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className={cn('rounded-full border px-3 py-1', cls)}>{label}</span>;
}

function flatBeds(rooms: RoomDto[] | null): BedDto[] {
  if (!rooms) return [];
  return rooms.flatMap(r => r.beds);
}

function mondayOf(d: Date): Date {
  const day = d.getDay() === 0 ? 7 : d.getDay();   // CN=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function isToday(d: Date) {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
