'use client';

import { useState } from 'react';
import { BadgePercent, Loader2, Plus, Power } from 'lucide-react';
import { ApiError } from '@/lib/api';
import {
  useVouchers, toggleVoucher, createVoucher,
  type AdminVoucherDto, type CreateVoucherInput
} from '@/lib/hooks';
import { cn } from '@/lib/cn';

const SEED: AdminVoucherDto[] = [
  { id: 's1', code: 'WELCOME10', kind: 'PERCENT', value: 10, capAmount: 200000, minBill: 0,
    validFrom: new Date().toISOString(), validTo: new Date(Date.now()+90*864e5).toISOString(),
    maxUses: 1000, usedCount: 23, maxUsesPerCustomer: 1, active: true },
  { id: 's2', code: 'TET2026',   kind: 'PERCENT', value: 15, capAmount: 500000, minBill: 500000,
    validFrom: new Date().toISOString(), validTo: new Date(Date.now()+30*864e5).toISOString(),
    maxUses: 500, usedCount: 8,  maxUsesPerCustomer: 2, active: true },
  { id: 's3', code: 'VIP100K',   kind: 'FIXED', value: 100000, capAmount: null, minBill: 1000000,
    validFrom: new Date().toISOString(), validTo: new Date(Date.now()+365*864e5).toISOString(),
    maxUses: null, usedCount: 0, maxUsesPerCustomer: 5, active: false }
];

function fmt(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function VoucherManager() {
  const { data, error, loading, refetch } = useVouchers();
  const [showForm, setShowForm] = useState(false);

  const rows = data ?? SEED;

  const onToggle = async (id: string) => {
    try {
      await toggleVoucher(id);
      await refetch();
    } catch (e) { alert((e as ApiError).message); }
  };

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
            <BadgePercent className="h-6 w-6 text-brand-gold" />
            Mã giảm giá
          </h1>
          <p className="text-sm text-brand-textmuted">Quản lý voucher / khuyến mãi của tổ chức</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus className="h-4 w-4" /> Tạo mới
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          API offline — demo data.
        </div>
      )}

      {showForm && <VoucherForm onCreated={() => { setShowForm(false); void refetch(); }} />}

      {loading && !data ? (
        <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
          <table className="w-full text-sm table-stack">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Mã</th>
                <th className="text-left px-4 py-3 font-medium">Loại</th>
                <th className="text-right px-4 py-3 font-medium">Giá trị</th>
                <th className="text-right px-4 py-3 font-medium">Min đơn</th>
                <th className="text-left px-4 py-3 font-medium">Hiệu lực</th>
                <th className="text-center px-4 py-3 font-medium">Đã dùng</th>
                <th className="text-center px-4 py-3 font-medium">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => {
                const expired = new Date(r.validTo).getTime() < Date.now();
                return (
                  <tr key={r.id} className={cn('hover:bg-brand-cream/15', !r.active && 'opacity-50')}>
                    <td data-label="Mã" className="px-4 py-3 font-mono text-brand-gold">{r.code}</td>
                    <td data-label="Loại" className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest',
                        r.kind === 'PERCENT' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')}>
                        {r.kind === 'PERCENT' ? '%' : 'Fixed'}
                      </span>
                    </td>
                    <td data-label="Giá trị" className="px-4 py-3 text-right font-medium">
                      {r.kind === 'PERCENT' ? `-${r.value}%${r.capAmount ? ` (≤${fmt(r.capAmount)})` : ''}` : `-${fmt(r.value)}`}
                    </td>
                    <td data-label="Min đơn" className="px-4 py-3 text-right text-brand-textmuted">{fmt(r.minBill)}</td>
                    <td data-label="Hiệu lực" className="px-4 py-3 text-xs text-brand-textmuted">
                      {fmtDate(r.validFrom)} → {fmtDate(r.validTo)}
                    </td>
                    <td data-label="Đã dùng" className="px-4 py-3 text-center text-xs">
                      {r.usedCount}{r.maxUses != null && `/${r.maxUses}`}
                    </td>
                    <td data-label="Trạng thái" className="px-4 py-3 text-center">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest',
                        expired ? 'bg-rose-50 text-rose-700' :
                        r.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500')}>
                        {expired ? 'Hết hạn' : r.active ? 'Đang chạy' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td data-label="Hành động" className="px-4 py-3 text-center">
                      <button onClick={() => onToggle(r.id)} className="text-brand-textmuted hover:text-brand-gold" aria-label="Toggle">
                        <Power className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function VoucherForm({ onCreated }: { onCreated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    kind: 'PERCENT' as 'PERCENT' | 'FIXED',
    value: '',
    capAmount: '',
    minBill: '',
    validFrom: new Date().toISOString().slice(0, 16),
    validTo: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 16),
    maxUses: '',
    maxUsesPerCustomer: '1'
  });

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const input: CreateVoucherInput = {
        code: form.code.trim().toUpperCase(),
        kind: form.kind,
        value: Number(form.value),
        capAmount: form.capAmount ? Number(form.capAmount) : null,
        minBill: form.minBill ? Number(form.minBill) : 0,
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo).toISOString(),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        maxUsesPerCustomer: Number(form.maxUsesPerCustomer)
      };
      await createVoucher(input);
      onCreated();
    } catch (e) { setError((e as ApiError).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card-soft mb-6 space-y-3">
      <h3 className="font-serif text-base">Tạo mã mới</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mã *">
          <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="fi font-mono" />
        </Field>
        <Field label="Loại *">
          <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as 'PERCENT' })} className="fi">
            <option value="PERCENT">Phần trăm (%)</option>
            <option value="FIXED">Cố định (VND)</option>
          </select>
        </Field>
        <Field label={form.kind === 'PERCENT' ? 'Giá trị (% từ 1-100) *' : 'Giá trị (VND) *'}>
          <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="fi" />
        </Field>
        {form.kind === 'PERCENT' && (
          <Field label="Cap tối đa (VND)">
            <input type="number" value={form.capAmount} onChange={e => setForm({ ...form, capAmount: e.target.value })} className="fi" />
          </Field>
        )}
        <Field label="Đơn tối thiểu (VND)">
          <input type="number" value={form.minBill} onChange={e => setForm({ ...form, minBill: e.target.value })} className="fi" />
        </Field>
        <Field label="Số lượt tổng">
          <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} placeholder="Không giới hạn" className="fi" />
        </Field>
        <Field label="Lượt / khách">
          <input type="number" value={form.maxUsesPerCustomer} onChange={e => setForm({ ...form, maxUsesPerCustomer: e.target.value })} className="fi" />
        </Field>
        <Field label="Hiệu lực từ *">
          <input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} className="fi" />
        </Field>
        <Field label="Đến *">
          <input type="datetime-local" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })} className="fi" />
        </Field>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !form.code || !form.value} className="btn-primary disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Tạo
        </button>
      </div>
      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 8px 12px;
              font-size: 14px; background: #faf9f6; outline: none; transition: border 0.2s; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</span>
      {children}
    </label>
  );
}
