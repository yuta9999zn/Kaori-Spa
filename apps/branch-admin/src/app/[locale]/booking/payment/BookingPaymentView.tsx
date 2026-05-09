'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreditCard, Receipt, Tag, Plus, Trash2, Search, Loader2, ChevronRight
} from 'lucide-react';
import { useBookings, type BookingListItem } from '@/lib/hooks';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

function fmtDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function BookingPaymentView() {
  const t = useTranslations('bookingPayment');
  const { data, loading, error } = useBookings({ status: 'done', size: 50 });
  const bookings: BookingListItem[] = data?.items ?? [];

  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return bookings;
    const needle = q.trim().toLowerCase();
    return bookings.filter(b =>
      b.code.toLowerCase().includes(needle)
      || b.customerName.toLowerCase().includes(needle)
      || b.customerPhone.includes(needle)
    );
  }, [bookings, q]);

  const selected = bookings.find(b => b.id === selectedId) ?? null;

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Receipt className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">
            {t('subtitle')}
            {selected && <span className="font-mono text-brand-gold ml-2">#{selected.code}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" disabled={!selected}>{t('printPreview')}</button>
          <button className="btn-primary" disabled={!selected}>
            <CreditCard className="h-4 w-4" /> {t('chargeNow')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: booking picker */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-soft border border-brand-cream/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-cream/50 flex items-center justify-between">
              <h2 className="font-serif text-lg text-brand-textmain">Chọn booking để thanh toán</h2>
              <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-brand-ivory/40 px-3 py-1.5 max-w-xs w-full">
                <Search className="h-4 w-4 text-brand-textmuted" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Tìm booking…"
                  className="flex-1 bg-transparent text-xs outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-brand-ivory/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Mã</th>
                    <th className="text-left px-4 py-3 font-medium">Khách</th>
                    <th className="text-left px-4 py-3 font-medium">Thời gian</th>
                    <th className="text-right px-4 py-3 font-medium">Tổng</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream/60">
                  {loading && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center">
                      <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
                    </td></tr>
                  )}
                  {!loading && error && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-rose-600">
                      {error.message}
                    </td></tr>
                  )}
                  {!loading && !error && filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                      Không có booking đã hoàn tất
                    </td></tr>
                  )}
                  {!loading && filtered.map(b => {
                    const active = selectedId === b.id;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedId(b.id)}
                        className={`cursor-pointer ${active ? 'bg-brand-gold/10' : 'hover:bg-brand-ivory/30'}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-brand-gold">{b.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-brand-textmain">{b.customerName}</p>
                          <p className="text-[10px] text-brand-textmuted font-mono">{b.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{fmtDateTime(b.startAt)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{VND(b.totalAmount)}</td>
                        <td className="px-3 py-3 text-right">
                          <ChevronRight className={`h-4 w-4 ${active ? 'text-brand-gold' : 'text-brand-textmuted'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {selected && <BookingDetail booking={selected} />}
        </div>

        {/* Right: payment summary */}
        <aside className="space-y-6">
          <PaymentPanel booking={selected} />
        </aside>
      </div>
    </>
  );
}

function BookingDetail({ booking }: { booking: BookingListItem }) {
  const t = useTranslations('bookingPayment');

  // TODO(Phase B): line items, deposit, voucher, tax aren't on BookingListItem.
  // We display the booking as a single mock line until /v1/bookings/:id ships.
  const items = [{ id: booking.id, desc: `Booking ${booking.code}`, qty: `${booking.itemCount} item(s)`, unit: booking.totalAmount, total: booking.totalAmount }];

  return (
    <>
      <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
        <h2 className="font-serif text-lg text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">
          {t('bookingSummary')}
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <Field label={t('serviceTime')} value={fmtDateTime(booking.startAt)} />
          {/* TODO(Phase B): primary staff name not on BookingListItem */}
          <Field label={t('primaryStaff')} value="—" />
          <Field label={t('status')} value={booking.status} />
          {/* TODO(Phase B): membership tier + loyalty points need a lookup. */}
          <Field label={t('membership')} value="—" />
          <Field label={t('loyaltyPoints')} value="—" />
          <Field label={t('customerPhone')} value={booking.customerPhone} />
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-soft border border-brand-cream/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-cream/50 flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-textmain">{t('items')}</h2>
          <button className="btn-ghost text-xs"><Plus className="h-4 w-4" /> {t('addItem')}</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-brand-ivory/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-1/2">{t('cols.item')}</th>
              <th className="text-center px-4 py-3 font-medium">{t('cols.qty')}</th>
              <th className="text-right px-4 py-3 font-medium">{t('cols.unit')}</th>
              <th className="text-right px-4 py-3 font-medium">{t('cols.total')}</th>
              <th className="text-center px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {items.map(i => (
              <tr key={i.id} className="hover:bg-brand-ivory/20">
                <td className="px-4 py-3 font-medium">{i.desc}</td>
                <td className="px-4 py-3 text-center text-brand-textmuted">{i.qty}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{VND(i.unit)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{VND(i.total)}</td>
                <td className="px-3 py-3 text-center">
                  <button aria-label="remove" className="p-1 text-brand-textmuted hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
        <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-brand-gold" /> {t('voucher')}
        </h2>
        <div className="flex gap-2">
          <input
            placeholder={t('voucherPlaceholder')}
            className="flex-1 rounded-xl border border-brand-cream px-3 py-2 text-sm"
          />
          <button className="btn-ghost">{t('apply')}</button>
        </div>
        <p className="text-xs text-brand-textmuted mt-2">{t('voucherHint')}</p>
      </section>
    </>
  );
}

function PaymentPanel({ booking }: { booking: BookingListItem | null }) {
  const t = useTranslations('bookingPayment');

  // TODO(Phase B): real flow integrates with PaymentController (POST /v1/payments).
  // This panel is a UI mock until the round wires PaymentController.
  const subtotal = booking?.totalAmount ?? 0;
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;
  const deposit = 0;
  const due = total - deposit;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60 sticky top-6">
      <h2 className="font-serif text-lg text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">{t('paymentSummary')}</h2>

      {!booking && (
        <p className="text-xs text-brand-textmuted">Chọn booking ở bảng để bắt đầu thanh toán.</p>
      )}

      {booking && (
        <>
          <dl className="space-y-2 text-sm">
            <Row label={t('subtotal')} value={VND(subtotal)} />
            <Row label={t('discount')} value={`- ${VND(discount)}`} mute />
            <Row label={t('tax')} value={VND(tax)} mute />
            <div className="pt-2 mt-2 border-t border-brand-cream">
              <Row label={t('total')} value={VND(total)} bold />
            </div>
            <Row label={t('depositPaid')} value={`- ${VND(deposit)}`} mute />
            <div className="pt-2 mt-2 border-t border-brand-cream">
              <Row label={t('amountDue')} value={VND(due)} accent />
            </div>
          </dl>

          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('paymentMethod')}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'transfer', 'momo', 'vnpay', 'split'] as const).map(m => (
                <button
                  key={m}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    m === 'transfer'
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-goldhover'
                      : 'border-brand-cream bg-white text-brand-textmain hover:border-brand-gold'
                  }`}
                >
                  {(() => {
                    try { return t(`methods.${m}` as 'methods.cash'); }
                    catch { return m; }
                  })()}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full mt-5 btn-primary" disabled>
            <CreditCard className="h-4 w-4" /> {t('chargeAmount', { amount: VND(due) })}
          </button>
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-0.5">{label}</p>
      <p className="font-medium text-brand-textmain">{value}</p>
    </div>
  );
}

function Row({ label, value, mute, bold, accent }: { label: string; value: string; mute?: boolean; bold?: boolean; accent?: boolean }) {
  const cls = accent
    ? 'text-brand-gold font-serif text-xl'
    : bold
    ? 'font-semibold text-brand-textmain'
    : mute
    ? 'text-brand-textmuted'
    : 'text-brand-textmain';
  return (
    <div className="flex items-center justify-between">
      <dt className={mute ? 'text-brand-textmuted' : 'text-brand-textmain'}>{label}</dt>
      <dd className={`font-mono text-xs ${cls}`}>{value}</dd>
    </div>
  );
}
