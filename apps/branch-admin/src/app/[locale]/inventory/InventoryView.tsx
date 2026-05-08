'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Package, RotateCcw } from 'lucide-react';
import {
  useInventoryProducts, useInventoryStock, useInventoryMoves, recordMove,
  type InventoryProduct, type InventoryStockRow
} from '@/lib/hooks';
import { cn } from '@/lib/cn';

const SEED_STOCK: InventoryStockRow[] = [
  { productId: 'p1', productCode: 'NB-001', productName: { vi: 'Serum dưỡng trắng Aura' }, unit: 'pcs', qty: 12 },
  { productId: 'p2', productCode: 'NB-002', productName: { vi: 'Kem dưỡng ẩm ban đêm' },    unit: 'pcs', qty: 8 },
  { productId: 'p3', productCode: 'NB-003', productName: { vi: 'Toner cân bằng da' },       unit: 'pcs', qty: 4 },
  { productId: 'p4', productCode: 'NB-004', productName: { vi: 'Mặt nạ collagen (hộp 5)' }, unit: 'box', qty: 22 }
];

const TYPE_BG: Record<string, string> = {
  in:       'bg-emerald-100 text-emerald-700',
  out:      'bg-rose-100 text-rose-700',
  adjust:   'bg-amber-100 text-amber-700',
  transfer: 'bg-blue-100 text-blue-700'
};

export default function InventoryView() {
  const { data: products } = useInventoryProducts();
  const { data: stock, refetch: refetchStock } = useInventoryStock();
  const { data: moves, refetch: refetchMoves } = useInventoryMoves();

  const [showForm, setShowForm] = useState<'in' | 'out' | null>(null);
  const [form, setForm] = useState({ productId: '', delta: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const rows = stock ?? SEED_STOCK;

  const submit = async () => {
    if (!form.productId || !form.delta || !showForm) return;
    setSubmitting(true);
    try {
      const qty = Math.abs(parseFloat(form.delta));
      await recordMove({
        productId: form.productId,
        delta: showForm === 'in' ? qty : -qty,
        moveType: showForm,
        note: form.note || undefined
      });
      await Promise.all([refetchStock(), refetchMoves()]);
      setForm({ productId: '', delta: '', note: '' });
      setShowForm(null);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSku = rows.length;
  const lowStock = rows.filter(r => r.qty <= 5).length;
  const totalUnits = rows.reduce((s, r) => s + Number(r.qty || 0), 0);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">Kho mỹ phẩm & vật tư</h1>
          <p className="text-sm text-brand-textmuted">Quản lý nhập/xuất, tồn kho theo chi nhánh</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm('in')} className="btn-primary">
            <ArrowDown className="h-4 w-4" /> Nhập kho
          </button>
          <button onClick={() => setShowForm('out')} className="btn-ghost">
            <ArrowUp className="h-4 w-4" /> Xuất kho
          </button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-6">
        <Stat label="Số SKU" value={String(totalSku)} Icon={Package} />
        <Stat label="Tổng đơn vị" value={totalUnits.toLocaleString('vi-VN')} Icon={Package} />
        <Stat label="Hàng sắp hết (≤5)" value={String(lowStock)} Icon={RotateCcw} highlight={lowStock > 0} />
      </section>

      {/* Inline form */}
      {showForm && (
        <div className="mb-6 card-soft">
          <h3 className="font-serif text-lg mb-3">
            {showForm === 'in' ? 'Nhập kho' : 'Xuất kho'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Sản phẩm</span>
              <select
                value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value })}
                className="fi"
              >
                <option value="">— Chọn —</option>
                {(products ?? []).map((p: InventoryProduct) => (
                  <option key={p.id} value={p.id}>{p.code} · {p.name.vi}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Số lượng</span>
              <input
                type="number" min="1"
                value={form.delta}
                onChange={e => setForm({ ...form, delta: e.target.value })}
                className="fi"
              />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Ghi chú</span>
              <input
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                className="fi"
                placeholder="Vd: NCC ABC, hoá đơn 1234"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={submit} disabled={submitting || !form.productId || !form.delta} className="btn-primary disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
            </button>
            <button onClick={() => setShowForm(null)} className="btn-ghost">Huỷ</button>
          </div>
          <style jsx>{`
            .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 8px 12px; font-size: 13px; background: #faf9f6; outline: none; }
            .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1); }
          `}</style>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Stock */}
        <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
          <header className="px-5 py-3 border-b border-brand-cream/60 bg-brand-cream/20">
            <h2 className="font-serif text-base">Tồn kho hiện tại</h2>
          </header>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Mã</th>
                <th className="text-left px-4 py-2 font-medium">Sản phẩm</th>
                <th className="text-right px-4 py-2 font-medium">Đơn vị</th>
                <th className="text-right px-4 py-2 font-medium">Tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.productId} className={cn('hover:bg-brand-cream/15', Number(r.qty) <= 5 && 'bg-rose-50/40')}>
                  <td className="px-4 py-2 font-mono text-xs text-brand-gold">{r.productCode}</td>
                  <td className="px-4 py-2">{r.productName.vi}</td>
                  <td className="px-4 py-2 text-right text-brand-textmuted">{r.unit}</td>
                  <td className={cn('px-4 py-2 text-right font-medium', Number(r.qty) <= 5 ? 'text-rose-600' : 'text-brand-textmain')}>
                    {Number(r.qty).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Moves history */}
        <aside className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <header className="px-5 py-3 border-b border-brand-cream/60 bg-brand-cream/20">
            <h2 className="font-serif text-base">Lịch sử nhập/xuất</h2>
          </header>
          <ul className="divide-y divide-brand-cream/60 max-h-[480px] overflow-y-auto">
            {(moves ?? []).slice(0, 20).map(m => (
              <li key={m.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${TYPE_BG[m.moveType]}`}>
                    {m.moveType}
                  </span>
                  <span className={cn('font-medium', m.delta > 0 ? 'text-emerald-700' : 'text-rose-700')}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </span>
                </div>
                <p className="text-xs text-brand-textmuted">
                  {new Date(m.occurredAt).toLocaleString('vi-VN')}
                </p>
                {m.note && <p className="text-xs text-brand-textmain mt-1">{m.note}</p>}
              </li>
            ))}
            {(!moves || moves.length === 0) && (
              <li className="px-4 py-6 text-center text-xs text-brand-textmuted">Chưa có lịch sử</li>
            )}
          </ul>
        </aside>
      </div>
    </>
  );
}

function Stat({ label, value, Icon, highlight }: { label: string; value: string; Icon: typeof Package; highlight?: boolean }) {
  return (
    <article className={cn('kpi-card', highlight && 'border-rose-200 bg-rose-50/40')}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</span>
        <Icon className={cn('h-4 w-4', highlight ? 'text-rose-600' : 'text-brand-gold')} />
      </div>
      <p className="font-serif text-2xl">{value}</p>
    </article>
  );
}
