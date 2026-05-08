'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Lock } from 'lucide-react';
import { useFetch } from '@/lib/hooks';
import { api, ctx } from '@/lib/api';

interface SalaryRow {
  id: string; staffId: string; period: string;
  baseSalary: number; commissionTotal: number; bonus: number; deduction: number;
  daysWorked: number; daysOff: number; daysLate: number; minutesWorked: number;
  net: number; status: 'open' | 'locked' | 'paid';
}

const SEED: SalaryRow[] = [
  { id: 's1', staffId: 'a', period: '', baseSalary: 5000000, commissionTotal: 2860000, bonus: 0, deduction: 0, daysWorked: 26, daysOff: 4, daysLate: 1, minutesWorked: 12480, net: 7860000, status: 'open' },
  { id: 's2', staffId: 'b', period: '', baseSalary: 5000000, commissionTotal: 4220000, bonus: 200000, deduction: 0, daysWorked: 24, daysOff: 6, daysLate: 0, minutesWorked: 11520, net: 9420000, status: 'open' }
];

const STAFF_NAMES: Record<string, string> = {
  a: 'Nguyễn Khánh Linh (miko)',
  b: 'Phạm Thị Mai',
  c: 'Lê Thị Yến',
  d: 'Nguyễn Lan Hương (hương)'
};

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

export default function PayrollTable() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const period = `${year}-${String(month).padStart(2, '0')}`;
  const [busy, setBusy] = useState(false);

  const { data, error, refetch } = useFetch<SalaryRow[]>(() =>
    api<SalaryRow[]>(`/v1/payroll/${period}?branchId=${ctx.branchId}`),
    [period]
  );

  const rows = data ?? SEED;
  const totals = rows.reduce((acc, r) => ({
    base: acc.base + r.baseSalary,
    commission: acc.commission + r.commissionTotal,
    net: acc.net + r.net
  }), { base: 0, commission: 0, net: 0 });

  const rebuild = async () => {
    setBusy(true);
    try {
      await api(`/v1/payroll/${period}/rebuild?branchId=${ctx.branchId}`, { method: 'POST' });
      await refetch();
    } finally { setBusy(false); }
  };

  const lock = async () => {
    if (!confirm('Khoá kỳ lương này? Sau khi khoá không sửa được nữa.')) return;
    setBusy(true);
    try {
      await api(`/v1/payroll/${period}/lock?branchId=${ctx.branchId}`, { method: 'POST' });
      await refetch();
    } finally { setBusy(false); }
  };

  const goPrev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">Lương & Hoa hồng</h1>
          <p className="text-sm text-brand-textmuted">Tổng hợp theo tháng từ chấm công và doanh số</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="btn-ghost !py-2 !px-3"><ChevronLeft className="h-4 w-4" /></button>
          <span className="font-serif text-xl px-3">{period}</span>
          <button onClick={goNext} className="btn-ghost !py-2 !px-3"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={rebuild} disabled={busy} className="btn-ghost disabled:opacity-50">
            <RefreshCw className={busy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Tổng hợp
          </button>
          <button onClick={lock} disabled={busy} className="btn-primary disabled:opacity-50">
            <Lock className="h-4 w-4" /> Khoá kỳ lương
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          API offline — demo data.
        </div>
      )}

      <section className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-6">
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng lương cơ bản</p>
          <p className="font-serif text-2xl mt-1">{formatPrice(totals.base)}</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng hoa hồng</p>
          <p className="font-serif text-2xl mt-1 text-brand-gold">{formatPrice(totals.commission)}</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng chi trả</p>
          <p className="font-serif text-2xl mt-1 text-emerald-700">{formatPrice(totals.net)}</p>
        </article>
      </section>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nhân viên</th>
              <th className="text-right px-4 py-3 font-medium">Cơ bản</th>
              <th className="text-right px-4 py-3 font-medium">Hoa hồng</th>
              <th className="text-right px-4 py-3 font-medium">Thưởng</th>
              <th className="text-right px-4 py-3 font-medium">Trừ</th>
              <th className="text-center px-4 py-3 font-medium">Công</th>
              <th className="text-center px-4 py-3 font-medium">Trễ</th>
              <th className="text-right px-4 py-3 font-medium">Net</th>
              <th className="text-center px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/15">
                <td className="px-4 py-3">{STAFF_NAMES[r.staffId] ?? r.staffId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-right text-brand-textmuted">{formatPrice(r.baseSalary)}</td>
                <td className="px-4 py-3 text-right font-medium text-brand-gold">{formatPrice(r.commissionTotal)}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{formatPrice(r.bonus)}</td>
                <td className="px-4 py-3 text-right text-rose-700">-{formatPrice(r.deduction)}</td>
                <td className="px-4 py-3 text-center">{r.daysWorked}/{r.daysWorked + r.daysOff}</td>
                <td className="px-4 py-3 text-center text-amber-700">{r.daysLate}</td>
                <td className="px-4 py-3 text-right font-serif text-base text-brand-textmain">{formatPrice(r.net)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    r.status === 'open' ? 'bg-amber-50 text-amber-700' :
                    r.status === 'locked' ? 'bg-blue-50 text-blue-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
