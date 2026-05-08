'use client';

import { useState } from 'react';
import { BadgePercent, Check, Loader2, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface VoucherDto {
  id: string;
  code: string;
  kind: 'PERCENT' | 'FIXED';
  value: number;
  capAmount: number | null;
  minBill: number;
  validFrom: string;
  validTo: string;
}

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

/** Local-only discount preview — does NOT persist redemption.
 *  Caller redeems at payment time (PaymentPanel). */
export default function VoucherInput({
  billAmount,
  onApply,
  applied
}: {
  billAmount: number;
  onApply: (v: { voucher: VoucherDto; discount: number } | null) => void;
  applied: { voucher: VoucherDto; discount: number } | null;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeDiscount = (v: VoucherDto, bill: number) => {
    if (bill < v.minBill) return -1;
    if (v.kind === 'PERCENT') {
      let d = Math.round((bill * v.value) / 100);
      if (v.capAmount && d > v.capAmount) d = v.capAmount;
      return d;
    }
    return Math.min(v.value, bill);
  };

  const lookup = async () => {
    if (!code.trim()) return;
    setBusy(true); setError(null);
    try {
      const v = await api<VoucherDto>(
        `/v1/vouchers/lookup?orgId=${ORG_ID}&code=${encodeURIComponent(code.trim())}`
      );
      const now = Date.now();
      if (now < new Date(v.validFrom).getTime() || now > new Date(v.validTo).getTime()) {
        throw new Error('Mã đã hết hạn hoặc chưa kích hoạt');
      }
      const d = computeDiscount(v, billAmount);
      if (d < 0) throw new Error(`Hoá đơn cần tối thiểu ${fmt(v.minBill)}`);
      onApply({ voucher: v, discount: d });
      setCode('');
    } catch (e) {
      const err = e as ApiError | Error;
      setError(
        ('code' in err && err.code === 'NOT_FOUND') ? 'Không tìm thấy mã' :
        err.message || 'Không áp dụng được mã'
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = () => { onApply(null); setError(null); };

  if (applied) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
        <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono font-medium text-emerald-800">{applied.voucher.code}</span>
            <span className="text-xs text-emerald-700">
              {applied.voucher.kind === 'PERCENT'
                ? `-${applied.voucher.value}%${applied.voucher.capAmount ? ` (max ${fmt(applied.voucher.capAmount)})` : ''}`
                : `-${fmt(applied.voucher.value)}`}
            </span>
          </div>
          <p className="text-xs text-emerald-700">Giảm {fmt(applied.discount)}</p>
        </div>
        <button onClick={remove} className="text-emerald-700 hover:text-rose-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-textmuted" />
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Mã giảm giá"
            className="w-full rounded-xl border border-brand-cream bg-brand-ivory pl-10 pr-3 py-2.5 text-sm font-mono outline-none focus:border-brand-gold"
            onKeyDown={e => e.key === 'Enter' && lookup()}
          />
        </div>
        <button
          onClick={lookup}
          disabled={busy || !code.trim()}
          className={cn('btn-primary !py-2 !px-4 !text-xs disabled:opacity-50')}
        >
          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
          Áp dụng
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
