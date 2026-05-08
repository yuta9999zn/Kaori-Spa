'use client';

import { useState } from 'react';
import {
  Clock, UserCheck, Phone, CheckCircle2, X, Plus, Sparkles,
  Calendar, AlertCircle
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/cn';

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

const SEED: TodayBooking[] = [
  { id: '1', code: 'BK-2026-001', time: '10:00', customer: 'Nguyễn Thị Mai', phone: '0901234567',
    service: 'VIO Combo',           staff: 'Mai',  bedCode: 'G2A', status: 'confirmed',  durationMin: 60 },
  { id: '2', code: 'BK-2026-002', time: '11:30', customer: 'Trần Thị Lan',  phone: '0902345678',
    service: 'Combo 10 buổi VIO',   staff: 'Mai',  bedCode: 'G2B', status: 'arrived',    durationMin: 60 },
  { id: '3', code: 'BK-2026-003', time: '14:00', customer: 'Lê Thị Hoa',    phone: '0903456789',
    service: 'Yomogi Steam',        staff: 'Yến',  bedCode: 'GVIP', status: 'pending',   durationMin: 30 },
  { id: '4', code: 'BK-2026-004', time: '15:30', customer: 'Phạm Thị Yến',  phone: '0904567890',
    service: 'Triệt Toàn Thân',     staff: 'Mai',  bedCode: 'G1A', status: 'pending',    durationMin: 120 },
  { id: '5', code: 'BK-2026-005', time: '17:00', customer: 'Hoàng Thị Thu', phone: '0905678901',
    service: 'Set Beauty 3 DV VIP', staff: 'Yến',  bedCode: 'GVIP', status: 'confirmed', durationMin: 90 }
];

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
  const [list, setList] = useState<TodayBooking[]>(SEED);

  const move = (id: string, to: TodayBooking['status']) => {
    setList(s => s.map(b => b.id === id ? { ...b, status: to } : b));
  };

  const counts = list.reduce((a, b) => { a[b.status] = (a[b.status] ?? 0) + 1; return a; }, {} as Record<string, number>);

  const upcoming = list.filter(b => ['pending', 'confirmed'].includes(b.status));
  const arrivedNow = list.filter(b => ['arrived', 'in_progress'].includes(b.status));
  const wrapped = list.filter(b => ['done', 'no_show'].includes(b.status));

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

      {/* Quick stats — 2 col mobile, 4 desktop */}
      <section className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        <Stat label="Chờ" count={counts.pending ?? 0}      Icon={Clock}        tone="amber" />
        <Stat label="Đã đến" count={counts.arrived ?? 0}    Icon={UserCheck}    tone="violet" />
        <Stat label="Đang phục vụ" count={counts.in_progress ?? 0} Icon={Sparkles} tone="emerald" />
        <Stat label="Hoàn tất" count={counts.done ?? 0}     Icon={CheckCircle2} tone="slate" />
      </section>

      {/* Section 1: Đang ở spa */}
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
