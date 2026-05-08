'use client';

import { useMemo, useState } from 'react';
import { Trophy, Medal, Award, Loader2, Building2, Users } from 'lucide-react';
import {
  useLeaderboardBranches, useLeaderboardStaff,
  type BranchOrderBy, type StaffOrderBy,
  type LeaderboardBranchRow, type LeaderboardStaffRow
} from '@/lib/hooks';
import { cn } from '@/lib/cn';

const BRANCH_NAMES: Record<string, string> = {
  // Hardcoded fallback so UI is meaningful before any API call lands.
  '575': '575 Kim Mã',
  '625': '625 Kim Mã'
};

const SEED_BRANCHES: LeaderboardBranchRow[] = [
  { branchId: '575', bookingsDone: 412, bookingsNoshow: 18, uniqueCustomers: 234,
    revenue: 187_400_000, avgRating: 4.78, ratingCount: 96, repeatPct: 0.62, score: 168.4 },
  { branchId: '625', bookingsDone: 327, bookingsNoshow: 22, uniqueCustomers: 198,
    revenue: 142_900_000, avgRating: 4.61, ratingCount: 71, repeatPct: 0.55, score: 142.1 }
];

const SEED_STAFF: LeaderboardStaffRow[] = [
  { staffId: 'st1', staffName: 'Nguyễn Khánh Linh', staffNickname: 'miko', branchId: '575',
    bookingsDone: 142, bookingsNoshow: 3, uniqueCustomers: 89, avgRating: 4.89, ratingCount: 41, onTimePct: 0.96, score: 198.4 },
  { staffId: 'st2', staffName: 'Nguyễn Lan Hương',  staffNickname: 'hương', branchId: '625',
    bookingsDone: 128, bookingsNoshow: 5, uniqueCustomers: 76, avgRating: 4.82, ratingCount: 38, onTimePct: 0.93, score: 182.7 },
  { staffId: 'st3', staffName: 'Trần Thị Bích',     staffNickname: null,    branchId: '575',
    bookingsDone: 96,  bookingsNoshow: 7, uniqueCustomers: 64, avgRating: 4.65, ratingCount: 28, onTimePct: 0.91, score: 154.2 }
];

export default function LeaderboardView() {
  const [tab, setTab] = useState<'branches' | 'staff'>('branches');

  return (
    <>
      <header className="mb-5">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
          <Trophy className="h-6 w-6 text-brand-gold" />
          Bảng xếp hạng <span className="text-sm font-sans text-brand-textmuted">/ 30 ngày</span>
        </h1>
        <p className="text-sm text-brand-textmuted">Xếp hạng theo doanh thu, đánh giá và tỷ lệ khách quay lại</p>
      </header>

      <nav role="tablist" className="mb-4 inline-flex rounded-full border border-brand-cream bg-white p-1 shadow-soft">
        <TabButton active={tab === 'branches'} onClick={() => setTab('branches')} icon={Building2}>
          Chi nhánh
        </TabButton>
        <TabButton active={tab === 'staff'} onClick={() => setTab('staff')} icon={Users}>
          Kỹ thuật viên
        </TabButton>
      </nav>

      {tab === 'branches' ? <BranchTab /> : <StaffTab />}
    </>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: {
  active: boolean; onClick: () => void; icon: typeof Building2; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} role="tab" aria-selected={active}
      className={cn('flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition',
        active ? 'bg-brand-gold text-white shadow-sm' : 'text-brand-textmuted hover:text-brand-textmain')}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function BranchTab() {
  const [orderBy, setOrderBy] = useState<BranchOrderBy>('score');
  const { data, loading } = useLeaderboardBranches(orderBy);
  const rows = data && data.length > 0 ? data : SEED_BRANCHES;

  return (
    <>
      <OrderPicker value={orderBy} onChange={setOrderBy as (v: string) => void}
        options={[
          ['score', 'Tổng điểm'],
          ['revenue', 'Doanh thu'],
          ['rating', 'Đánh giá'],
          ['bookings', 'Số booking']
        ]} />
      {loading && !data ? (
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted my-8" />
      ) : (
        <ul className="space-y-2">
          {rows.map((b, i) => (
            <li key={b.branchId} className={cn('card-soft', i < 3 && 'border-brand-gold/30')}>
              <div className="flex items-center gap-3">
                <RankBadge rank={i + 1} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base">{BRANCH_NAMES[b.branchId] ?? b.branchId.slice(0, 8)}</h3>
                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-xs">
                    <Stat label="Doanh thu" value={`${(b.revenue / 1_000_000).toFixed(1)}tr`} />
                    <Stat label="Booking" value={String(b.bookingsDone)} />
                    <Stat label="Đánh giá" value={`${Number(b.avgRating).toFixed(2)}/5 · ${b.ratingCount} review`} />
                    <Stat label="Khách quay lại" value={`${(Number(b.repeatPct) * 100).toFixed(0)}%`} />
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Điểm</p>
                  <p className="font-serif text-xl text-brand-gold tabular-nums">{Number(b.score).toFixed(1)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function StaffTab() {
  const [orderBy, setOrderBy] = useState<StaffOrderBy>('score');
  const { data, loading } = useLeaderboardStaff(orderBy);
  const rows = data && data.length > 0 ? data : SEED_STAFF;

  const byOrder = useMemo(() => rows.slice().sort((a, b) => Number(b.score) - Number(a.score)), [rows]);

  return (
    <>
      <OrderPicker value={orderBy} onChange={setOrderBy as (v: string) => void}
        options={[
          ['score', 'Tổng điểm'],
          ['rating', 'Đánh giá'],
          ['bookings', 'Số booking'],
          ['ontime', 'Đúng giờ']
        ]} />
      {loading && !data ? (
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted my-8" />
      ) : (
        <ul className="space-y-2">
          {byOrder.map((s, i) => (
            <li key={s.staffId} className={cn('card-soft', i < 3 && 'border-brand-gold/30')}>
              <div className="flex items-center gap-3">
                <RankBadge rank={i + 1} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base">
                    {s.staffName}
                    {s.staffNickname && (
                      <span className="ml-2 text-xs text-brand-textmuted font-sans">"{s.staffNickname}"</span>
                    )}
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                    {BRANCH_NAMES[s.branchId] ?? s.branchId.slice(0, 8)}
                  </p>
                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-xs">
                    <Stat label="Booking" value={String(s.bookingsDone)} />
                    <Stat label="Đánh giá" value={`${Number(s.avgRating).toFixed(2)}/5`} />
                    <Stat label="Đúng giờ" value={`${(Number(s.onTimePct) * 100).toFixed(0)}%`} />
                    <Stat label="Khách riêng" value={String(s.uniqueCustomers)} />
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Điểm</p>
                  <p className="font-serif text-xl text-brand-gold tabular-nums">{Number(s.score).toFixed(1)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OrderPicker<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: [T, string][];
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {options.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)}
          className={cn('rounded-full px-3 py-1 text-xs transition',
            value === k ? 'bg-brand-gold text-white' : 'bg-brand-cream/50 text-brand-textmuted hover:bg-brand-cream')}>
          {label}
        </button>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-700"><Trophy className="h-5 w-5" /></div>;
  }
  if (rank === 2) {
    return <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-500"><Medal className="h-5 w-5" /></div>;
  }
  if (rank === 3) {
    return <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-orange-100 text-orange-700"><Award className="h-5 w-5" /></div>;
  }
  return <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-cream text-brand-textmuted font-serif">{rank}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-brand-textmuted">{label}</p>
      <p className="font-medium text-brand-textmain">{value}</p>
    </div>
  );
}
