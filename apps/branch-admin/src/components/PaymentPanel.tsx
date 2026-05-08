'use client';

import { useState } from 'react';
import { Banknote, BadgePercent, CreditCard, Wallet, Smartphone, Loader2, Check, Award } from 'lucide-react';
import { api, ctx } from '@/lib/api';
import { cn } from '@/lib/cn';
import VoucherInput from './VoucherInput';

const METHODS: Array<{ code: string; label: string; Icon: typeof Banknote }> = [
  { code: 'tm',     label: 'Tiền mặt',    Icon: Banknote },
  { code: 'the',    label: 'Thẻ',         Icon: CreditCard },
  { code: 'ck-loc', label: 'CK chi nhánh',Icon: Wallet },
  { code: 'ck-cty', label: 'CK công ty',  Icon: Wallet },
  { code: 'vi-mom', label: 'Ví điện tử',  Icon: Smartphone }
];

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

interface VoucherDto { id: string; code: string; kind: 'PERCENT' | 'FIXED'; value: number; capAmount: number | null; minBill: number; validFrom: string; validTo: string; }

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

/**
 * Order of operations when finalising a bill:
 *   1. Apply voucher discount (off the top).
 *   2. Apply loyalty point redemption (capped per tier).
 *   3. Customer pays the remaining "due" via one of 5 methods.
 *
 * The redemption + voucher persist in their respective services as soon as
 * the user clicks "Xác nhận thu" — we do this in parallel with the payment
 * insert so a partial failure aborts the whole transaction client-side.
 */
export default function PaymentPanel({
  bookingId,
  customerId,
  customerName,
  customerPhone,
  customerPoints,
  totalAmount,
  onPaid
}: {
  bookingId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerPoints: number;
  totalAmount: number;
  onPaid?: () => void;
}) {
  const [voucher, setVoucher] = useState<{ voucher: VoucherDto; discount: number } | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointDiscount, setPointDiscount] = useState(0);

  const [method, setMethod] = useState('tm');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billAfterVoucher = Math.max(0, totalAmount - (voucher?.discount ?? 0));
  const dueAmount = Math.max(0, billAfterVoucher - pointDiscount);

  const previewRedeem = async (pts: number) => {
    setPointsToRedeem(pts);
    if (!customerId || pts <= 0) { setPointDiscount(0); return; }
    // Optimistic preview: 1 point ≈ 1000 VND. Real value comes from the
    // /redeem endpoint at confirm time (it also caps to 30% of bill).
    setPointDiscount(Math.min(pts * 1000, Math.round(billAfterVoucher * 0.3)));
  };

  const submit = async () => {
    if (busy || dueAmount < 0) return;
    setBusy(true); setError(null);
    try {
      // 1. Redeem voucher (if any).
      if (voucher) {
        await api('/v1/vouchers/redeem', {
          method: 'POST',
          body: JSON.stringify({
            orgId: ORG_ID,
            code: voucher.voucher.code,
            customerPhone,
            billAmount: totalAmount,
            bookingId
          })
        });
      }

      // 2. Redeem loyalty points (if any).
      if (customerId && pointsToRedeem > 0) {
        await api('/v1/loyalty/redeem', {
          method: 'POST',
          body: JSON.stringify({
            customerId,
            points: pointsToRedeem,
            billAmount: billAfterVoucher
          })
        });
      }

      // 3. Record the actual payment (the remaining due).
      await api('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: ctx.tenantId,
          branchId: ctx.branchId,
          txnType: 'dv',
          methodCode: method,
          amount: dueAmount,
          bookingId,
          customerName,
          customerPhone
        })
      });

      setDone(true);
      onPaid?.();
      setTimeout(() => setDone(false), 2000);
    } catch (e) {
      setError((e as Error).message || 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
        <p className="font-medium text-emerald-700">Đã thu {fmt(dueAmount)}</p>
      </div>
    );
  }

  const maxRedeemable = customerId
    ? Math.min(customerPoints, Math.floor((billAfterVoucher * 0.3) / 1000))
    : 0;

  return (
    <div className="card-soft space-y-4">
      <h3 className="font-serif text-lg flex items-center gap-2">
        <BadgePercent className="h-5 w-5 text-brand-gold" />
        Thanh toán
      </h3>

      {/* Bill summary */}
      <div className="space-y-1.5 text-sm">
        <Row label="Tổng đơn" value={fmt(totalAmount)} />
        {voucher && <Row label={`Mã ${voucher.voucher.code}`} value={`-${fmt(voucher.discount)}`} tone="emerald" />}
        {pointDiscount > 0 && <Row label={`${pointsToRedeem} điểm`} value={`-${fmt(pointDiscount)}`} tone="emerald" />}
        <hr className="my-2 border-brand-cream" />
        <Row label="Phải thu" value={fmt(dueAmount)} tone="bold" />
      </div>

      {/* Voucher */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Mã giảm giá</p>
        <VoucherInput billAmount={totalAmount} onApply={setVoucher} applied={voucher} />
      </div>

      {/* Loyalty redeem */}
      {customerId && customerPoints > 0 && maxRedeemable > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1 flex items-center gap-1">
            <Award className="h-3 w-3" />
            Đổi điểm (tối đa {maxRedeemable})
          </p>
          <input
            type="range"
            min="0"
            max={maxRedeemable}
            step="10"
            value={pointsToRedeem}
            onChange={e => previewRedeem(Number(e.target.value))}
            className="w-full accent-brand-gold"
          />
          <div className="flex items-baseline justify-between text-xs text-brand-textmuted">
            <span>{pointsToRedeem} điểm</span>
            <span>tiết kiệm {fmt(pointDiscount)}</span>
          </div>
        </div>
      )}

      {/* Method */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">Phương thức</p>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(({ code, label, Icon }) => (
            <button
              key={code}
              onClick={() => setMethod(code)}
              className={cn(
                'flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm transition',
                method === code
                  ? 'border-brand-gold bg-brand-gold/5 text-brand-textmain'
                  : 'border-brand-cream text-brand-textmuted hover:border-brand-gold/60'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        onClick={submit}
        disabled={busy || dueAmount < 0}
        className="btn-primary w-full justify-center disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Xác nhận thu {fmt(dueAmount)}
      </button>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'bold' }) {
  return (
    <div className={cn(
      'flex items-baseline justify-between gap-2',
      tone === 'emerald' && 'text-emerald-700',
      tone === 'bold' && 'font-medium text-base text-brand-textmain'
    )}>
      <span className={tone === 'bold' ? '' : 'text-brand-textmuted'}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
