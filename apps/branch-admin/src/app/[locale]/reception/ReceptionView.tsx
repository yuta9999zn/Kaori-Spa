'use client';

import { useMemo, useState } from 'react';
import {
  Clock, UserCheck, Phone, CheckCircle2, X, Plus, Sparkles,
  Calendar, Loader2
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { useAttendance, checkIn, checkOut } from '@/lib/hooks';

interface TodayBooking {
  id: string;
  code: string;
  time: string;
  customer: string;
  phone: string;
  service: string;
  staff: string;
  bedCode: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'done' | 'no_show';
  durationMin: number;
}

const STATUS_BG: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:   'bg-blue-100 text-blue-800 border-blue-200',
  arrived:     'bg-violet-100 text-violet-800 border-violet-200',
  in_progress: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  done:        'bg-slate-100 text-slate-700 border-slate-200',
  no_show:     'bg-rose-100 text-rose-700 border-rose-200'
};

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', arrived: 'Đã đến',
  in_progress: 'Đang phục vụ', done: 'Hoàn tất', no_show: 'Không đến'
};

export default function ReceptionView() {
  // Attendance is the actual reception workflow: check staff in/out for the
  // shift. Booking-level pending/arrived/in_progress is separate (timeline lives
  // on the booking detail page).
  const { data: attendance, loading, refetch } = useAttendance();
  const [busy, setBusy] = useState<string | null>(null);

  // Booking list is mock until /v1/bookings paged list ships in M1.
  // TODO(M1): replace SEED with hook that filters today's bookings by branch.
  const SEED: TodayBooking[] = useMemo(() => ([
    { id: '1', code: 'BK-2026-001', time: '10:00', customer: 'Nguyễn Thị Mai', phone: '0901234567',
      service: 'VIO Combo', staff: 'Mai', bedCode: 'G2A', status: 'confirmed', durationMin: 60 },
    { id: '2', code: 'BK-2026-002', time: '11:30', customer: 'Trần Thị Lan', phone: '0902345678',
      service: 'Combo 10 buổi VIO', staff: 'Mai', bedCode: 'G2B', status: 'arrived', durationMin: 60 }
  ]), []);
  const [list, setList] = useState<TodayBooking[]>(SEED);

  const move = (id: string, to: TodayBooking['status']) => {
    setList(s => s.map(b => b.id === id ? { ...b, status: to } : b));
  };

  const punchIn = async (staffId: string) => {
    setBusy(staffId);
    try { await checkIn(staffId); await refetch(); }
    finally { setBusy(null); }
  };
  const punchOut = async (staffId: string) => {
    setBusy(staffId);
    try { await checkOut(staffId); await refetch(); }
    finally { setBusy(null); }
  };

  const counts = list.reduce((a, b) => { a[b.status] = (a[b.status] ?? 0) + 1; return a; }, {} as Record<string, number>);

  const upcoming = list.filter(b => ['pending', 'confirmed'].includes(b.status));
  const arrivedNow = list.filter(b => ['arrived', 'in_progress'].includes(b.status));
  const wrapped = list.filter(b => ['done', 'no_show'].includes(b.status));

  const presentCount = (attendance ?? []).filter(a => a.actualIn != null && a.actualOut == null).length;
  const totalScheduled = (attendance ?? []).filter(a => a.shiftType != null && a.shiftType !== 'NGHI').length;

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain">Lễ tân</h1>
          <p className="text-xs text-brand-textmuted">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        </div>
        <Link href="/booking/new" className="btn-primary !py-2 !px-4 !text-sm">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tạo</span>
        </Link>
      </header>

      {/* Quick stats */}
      <section className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        <Stat label="KTV có mặt"    count={presentCount}                 Icon={UserCheck}    tone="emerald" />
        <Stat label="Lịch chờ"      count={counts.pending ?? 0}           Icon={Clock}        tone="amber" />
        <Stat label="Đang phục vụ"  count={counts.in_progress ?? 0}        Icon={Sparkles}     tone="violet" />
        <Stat label="Hoàn tất"      count={counts.done ?? 0}              Icon={CheckCircle2} tone="slate" />
      </section>

      {/* Staff attendance */}
      <Section title="Chấm công nhân viên" badge={(attendance ?? []).length}>
        {loading ? (
          <p className="text-sm text-brand-textmuted text-center py-4">
            <Loader2 className="inline h-4 w-4 animate-spin" />
          </p>
        ) : (attendance ?? []).length === 0 ? (
          <p className="text-sm text-brand-textmuted text-center py-4">Chưa có dữ liệu</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {(attendance ?? []).map(a => {
              const isIn = a.actualIn != null && a.actualOut == null;
              const isOut = a.actualOut != null;
              return (
                <li key={a.staffId} className="rounded-2xl border border-brand-cream bg-white p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {a.staffName ?? a.staffNickname ?? a.staffId.slice(0, 8)}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                      {a.shiftType ?? 'Chưa phân ca'} · {a.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!isIn && !isOut && (
                      <button
                        disabled={busy === a.staffId}
                        onClick={() => punchIn(a.staffId)}
                        className="btn-primary !py-1 !px-3 !text-xs disabled:opacity-50"
                      >
                        {busy === a.staffId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Vào'}
                      </button>
                    )}
                    {isIn && (
                      <button
                        disabled={busy === a.staffId}
                        onClick={() => punchOut(a.staffId)}
                        className="btn-ghost !py-1 !px-3 !text-xs disabled:opacity-50"
                      >
                        {busy === a.staffId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ra'}
                      </button>
                    )}
                    {isOut && <span className="text-[10px] text-emerald-600 self-center">Đã tan ca</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Section 1: Đang ở spa (mock) */}
      <Section title="Đang ở Spa" badge={arrivedNow.length} highlight>
        {arrivedNow.length === 0 ? (
          <p className="text-sm text-brand-textmuted text-center py-4">Chưa có khách check-in</p>
        ) : (
          arrivedNow.map(b => <BookingCard key={b.id} b={b} onMove={move} />)
        )}
      </Section>

      {/* Section 2: Sắp đến (upcoming) */}
      <Section title="Lịch tới" badge={upcoming.length}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-brand-textmuted text-center py-4">Hôm nay không còn lịch</p>
        ) : (
          upcoming.map(b => <BookingCard key={b.id} b={b} onMove={move} />)
        )}
      </Section>

      {/* Section 3: Đã qua */}
      {wrapped.length > 0 && (
        <Section title="Đã hoàn tất" badge={wrapped.length} muted>
          {wrapped.map(b => <BookingCard key={b.id} b={b} onMove={move} />)}
        </Section>
      )}

      <p className="mt-6 text-[10px] text-brand-textmuted text-center">
        Đã phân ca: {totalScheduled}. Booking list dùng mock — sẽ thay khi /v1/bookings list ra mắt.
      </p>
    </>
  );
}

function Section({ title, badge, highlight, muted, children }: {
  title: string; badge: number; highlight?: boolean; muted?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <header className="flex items-center justify-between mb-2">
        <h2 className={cn(
          'font-serif text-lg',
          muted ? 'text-brand-textmuted' : highlight ? 'text-brand-gold' : 'text-brand-textmain'
        )}>{title}</h2>
        <span className="text-xs text-brand-textmuted">{badge}</span>
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function BookingCard({ b, onMove }: { b: TodayBooking; onMove: (id: string, to: TodayBooking['status']) => void }) {
  return (
    <article className="rounded-2xl border border-brand-cream bg-white p-3 sm:p-4 shadow-soft">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-brand-textmuted mb-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium text-brand-textmain">{b.time}</span>
            <span>·</span>
            <span>{b.durationMin}p</span>
            <span>·</span>
            <span className="font-mono text-[10px]">{b.bedCode}</span>
          </div>
          <p className="font-medium text-brand-textmain truncate">{b.customer}</p>
          <p className="text-xs text-brand-textmuted truncate">{b.service} · @{b.staff}</p>
        </div>
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest whitespace-nowrap', STATUS_BG[b.status])}>
          {STATUS_VI[b.status]}
        </span>
      </div>

      {/* Action row — mobile-friendly chunky buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-cream/60">
        <a href={`tel:${b.phone}`} className="btn-ghost !py-1.5 !px-3 !text-xs flex-1 sm:flex-initial justify-center">
          <Phone className="h-3 w-3" /> Gọi
        </a>
        {b.status === 'pending' && (
          <button onClick={() => onMove(b.id, 'confirmed')} className="btn-ghost !py-1.5 !px-3 !text-xs flex-1 sm:flex-initial justify-center">
            Xác nhận
          </button>
        )}
        {(b.status === 'pending' || b.status === 'confirmed') && (
          <>
            <button onClick={() => onMove(b.id, 'arrived')} className="btn-primary !py-1.5 !px-3 !text-xs flex-1 sm:flex-initial justify-center">
              <UserCheck className="h-3 w-3" /> Check-in
            </button>
            <button onClick={() => onMove(b.id, 'no_show')} className="btn-ghost !py-1.5 !px-3 !text-xs !border-rose-200 hover:!text-rose-600 flex-1 sm:flex-initial justify-center">
              <X className="h-3 w-3" /> No-show
            </button>
          </>
        )}
        {b.status === 'arrived' && (
          <button onClick={() => onMove(b.id, 'in_progress')} className="btn-primary !py-1.5 !px-3 !text-xs flex-1 sm:flex-initial justify-center">
            <Sparkles className="h-3 w-3" /> Bắt đầu
          </button>
        )}
        {b.status === 'in_progress' && (
          <button onClick={() => onMove(b.id, 'done')} className="btn-primary !py-1.5 !px-3 !text-xs flex-1 sm:flex-initial justify-center">
            <CheckCircle2 className="h-3 w-3" /> Hoàn tất
          </button>
        )}
        <Link href={{ pathname: '/booking/[id]' as '/booking/new', params: { id: b.id } } as never}
          className="btn-ghost !py-1.5 !px-3 !text-xs flex-1 sm:flex-initial justify-center">
          <Calendar className="h-3 w-3" /> Chi tiết
        </Link>
      </div>
    </article>
  );
}

function Stat({ label, count, Icon, tone }: { label: string; count: number; Icon: typeof Clock; tone: string }) {
  const map: Record<string, string> = {
    amber:   'bg-amber-50 text-amber-700',
    violet:  'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate:   'bg-slate-50 text-slate-700'
  };
  return (
    <article className="kpi-card !p-3 sm:!p-4">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg mb-2', map[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-serif text-xl sm:text-2xl text-brand-textmain leading-none">{count}</p>
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mt-1 truncate">{label}</p>
    </article>
  );
}
