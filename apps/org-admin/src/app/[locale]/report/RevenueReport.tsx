'use client';

import { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, Loader2, RefreshCw, Flame } from 'lucide-react';
import { api, ApiError, ctx } from '@/lib/api';
import AvailabilityHeatmap from '@/components/charts/AvailabilityHeatmap';

interface DailyRevenue { day: string; revenue: number; bookings: number; }
interface BranchSummary { branchId: string; revenue: number; bookings: number; doneBookings: number; cancelled: number; avgTicket: number; }
interface TopService { serviceCode: string; times: number; revenue: number; }

const BRANCH_NAMES: Record<string, string> = {
  'nb-kim-ma-575': 'Natural Beauty 575 Kim Mã',
  'nb-kim-ma-625': 'Natural Beauty 625 Kim Mã'
};

const SEED_BRANCHES: BranchSummary[] = [
  { branchId: 'nb-kim-ma-575', revenue: 198_300_000, bookings: 142, doneBookings: 134, cancelled: 4, avgTicket: 1_480_597 },
  { branchId: 'nb-kim-ma-625', revenue: 150_200_000, bookings: 98,  doneBookings: 90,  cancelled: 5, avgTicket: 1_668_888 }
];

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}
function fmtCompact(n: number) {
  return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export default function RevenueReport() {
  const today = new Date();
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => today.toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [byBranch, setByBranch] = useState<BranchSummary[]>(SEED_BRANCHES);
  const [daily, setDaily] = useState<DailyRevenue[]>([]);
  const [topSvc, setTopSvc] = useState<TopService[]>([]);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const [b, d, ts] = await Promise.all([
        api<BranchSummary[]>(`/v1/reports/revenue/by-branch?tenantId=${ctx.tenantId}&from=${from}&to=${to}`),
        api<DailyRevenue[]>(`/v1/reports/revenue/daily?tenantId=${ctx.tenantId}&from=${from}&to=${to}`),
        api<TopService[]>(`/v1/reports/top-services?tenantId=${ctx.tenantId}&from=${from}&to=${to}&limit=8`)
      ]);
      setByBranch(b);
      setDaily(d);
      setTopSvc(ts);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = byBranch.reduce(
    (acc, r) => ({
      revenue: acc.revenue + Number(r.revenue),
      bookings: acc.bookings + r.bookings,
      done: acc.done + r.doneBookings,
      cancelled: acc.cancelled + r.cancelled
    }),
    { revenue: 0, bookings: 0, done: 0, cancelled: 0 }
  );
  const cancelRate = totals.bookings > 0 ? (totals.cancelled / totals.bookings) * 100 : 0;

  // Daily mini-chart
  const maxDaily = Math.max(1, ...daily.map(d => Number(d.revenue)));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">Báo cáo doanh thu đa chi nhánh</h1>
          <p className="text-sm text-brand-textmuted">Tổng hợp doanh số toàn tổ chức</p>
        </div>
        <div className="flex items-end gap-3">
          <label className="text-xs">
            <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Từ</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs" />
          </label>
          <label className="text-xs">
            <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Đến</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs" />
          </label>
          <button onClick={load} disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Tải lại
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          API offline — demo data. ({error})
        </div>
      )}

      {/* KPIs */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <Stat Icon={DollarSign} label="Tổng doanh thu" value={fmt(totals.revenue)} />
        <Stat Icon={Calendar}   label="Booking" value={fmtCompact(totals.bookings)} />
        <Stat Icon={TrendingUp} label="Hoàn tất" value={fmtCompact(totals.done)} />
        <Stat Icon={Calendar}   label="Tỉ lệ huỷ" value={`${cancelRate.toFixed(1)}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* By branch */}
        <article className="kpi-card !p-0 overflow-hidden">
          <header className="px-5 py-3 border-b border-brand-cream/60 bg-brand-cream/20">
            <h2 className="font-serif text-base">Theo chi nhánh</h2>
          </header>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Chi nhánh</th>
                <th className="text-right px-4 py-2 font-medium">Doanh thu</th>
                <th className="text-right px-4 py-2 font-medium">Booking</th>
                <th className="text-right px-4 py-2 font-medium">Done</th>
                <th className="text-right px-4 py-2 font-medium">Huỷ</th>
                <th className="text-right px-4 py-2 font-medium">Avg ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {byBranch.map(r => (
                <tr key={r.branchId} className="hover:bg-brand-cream/15">
                  <td className="px-4 py-2">{BRANCH_NAMES[r.branchId] ?? r.branchId.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-right font-medium text-brand-gold">{fmt(Number(r.revenue))}</td>
                  <td className="px-4 py-2 text-right">{r.bookings}</td>
                  <td className="px-4 py-2 text-right text-emerald-700">{r.doneBookings}</td>
                  <td className="px-4 py-2 text-right text-rose-700">{r.cancelled}</td>
                  <td className="px-4 py-2 text-right text-brand-textmuted">{fmt(Number(r.avgTicket))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        {/* Top services */}
        <aside className="kpi-card">
          <h2 className="font-serif text-base mb-4">Top dịch vụ</h2>
          {topSvc.length === 0 ? (
            <p className="text-xs text-brand-textmuted">—</p>
          ) : (
            <ul className="space-y-3">
              {topSvc.map(t => (
                <li key={t.serviceCode}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono text-xs text-brand-gold">{t.serviceCode}</span>
                    <span className="font-medium">{fmt(Number(t.revenue))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-textmuted">
                    <span>{t.times} lượt</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Daily revenue mini bar chart */}
      {daily.length > 0 && (
        <article className="kpi-card mt-6">
          <h2 className="font-serif text-base mb-4">Doanh thu theo ngày</h2>
          <div className="flex items-end gap-1 h-40">
            {daily.map(d => (
              <div key={d.day} className="flex-1 group relative" title={`${d.day}: ${fmt(Number(d.revenue))}`}>
                <div
                  className="bg-brand-gold/80 rounded-sm hover:bg-brand-gold transition-all"
                  style={{ height: `${(Number(d.revenue) / maxDaily) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-brand-textmuted">
            <span>{daily[0]?.day}</span>
            <span>{daily[daily.length - 1]?.day}</span>
          </div>
        </article>
      )}

      <article className="kpi-card mt-6">
        <h2 className="font-serif text-base mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-brand-gold" />
          Bản đồ giờ cao điểm
        </h2>
        <AvailabilityHeatmap from={from} to={to} />
      </article>
    </>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof DollarSign; label: string; value: string }) {
  return (
    <article className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</span>
        <Icon className="h-4 w-4 text-brand-gold" />
      </div>
      <p className="font-serif text-2xl truncate">{value}</p>
    </article>
  );
}
