'use client';

import { useMemo, useState } from 'react';
import { Calendar, Check, ChevronRight, Clock, Loader2, MapPin, Phone, Sparkles, User } from 'lucide-react';
import { branches } from '@/data/branches';
import { services } from '@/data/services';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { pickText, formatPrice } from '@/lib/format';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000';
const BRANCH_UUIDS: Record<string, string> = (() => {
  try { return JSON.parse(process.env.NEXT_PUBLIC_BRANCH_UUIDS ?? '{}'); }
  catch { return {}; }
})();

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Dịch vụ', 'Chi nhánh', 'Thời gian', 'Liên hệ'];

/**
 * Mobile-first quick booking — 3 small steps then submit.
 *
 * Each step is rendered as a full-bleed panel below the hero summary so
 * users on small screens see one decision at a time. The footer "Tiếp"
 * button is sticky to the bottom (above safe-area) for thumb reach.
 */
export default function QuickBook({
  locale, initialService, initialBranch
}: {
  locale: Locale; initialService?: string; initialBranch?: string;
}) {
  const [step, setStep] = useState<Step>(initialService ? 2 : 1);
  const [serviceCode, setServiceCode] = useState<string | null>(initialService ?? null);
  const [branchCode, setBranchCode] = useState<string | null>(initialBranch ?? null);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const service = useMemo(() => services.find(s => s.code === serviceCode), [serviceCode]);
  const branch  = useMemo(() => branches.find(b => b.code === branchCode), [branchCode]);

  const canNext =
    (step === 1 && !!service) ||
    (step === 2 && !!branch) ||
    (step === 3 && !!date && !!time) ||
    (step === 4 && /^[+0-9 ()-]{8,20}$/.test(phone) && name.trim().length > 1);

  const submit = async () => {
    if (!service || !branch) return;
    setBusy(true); setError(null);
    try {
      const res = await api<{ code: string; status: string }>('/v1/public/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': `qb-${Date.now()}-${phone}` },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          branchId: BRANCH_UUIDS[branch.code],
          customerName: name,
          customerPhone: phone,
          locale,
          serviceCode: service.code,
          durationMin: service.durationMin,
          price: service.basePrice,
          requestedStart: `${date}T${time}:00+07:00`
        })
      });
      setCode(res.code);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  if (code) {
    return (
      <div className="container-prose py-12 max-w-md mx-auto text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-2xl mb-2">Đặt lịch thành công</h1>
        <p className="font-mono text-brand-gold text-xl mb-1">{code}</p>
        <p className="text-sm text-brand-textmuted mb-6">
          Chúng tôi đã gửi xác nhận qua SMS đến {phone}
        </p>
        <Link href="/" className="btn-primary">Về trang chủ</Link>
      </div>
    );
  }

  // Pre-compute next 7 dates for the date picker.
  const nextDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  return (
    <div className="pb-32 sm:pb-24">
      <div className="container-prose pt-6 sm:pt-12">
        {/* Step indicator */}
        <ol className="flex items-center mb-6 gap-1">
          {STEP_LABELS.map((label, i) => {
            const idx = (i + 1) as Step;
            const done = step > idx;
            const active = step === idx;
            return (
              <li key={label} className="flex items-center flex-1 last:flex-initial">
                <button
                  type="button"
                  onClick={() => idx <= step && setStep(idx)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition flex-shrink-0',
                    active ? 'bg-brand-gold text-white' :
                    done   ? 'bg-emerald-500 text-white' :
                             'bg-brand-cream text-brand-textmuted'
                  )}
                  aria-label={label}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : idx}
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <span className={cn('mx-2 h-0.5 flex-1', done ? 'bg-emerald-500' : 'bg-brand-cream')} />
                )}
              </li>
            );
          })}
        </ol>

        <h1 className="font-serif text-2xl text-brand-textmain mb-6">
          {STEP_LABELS[step - 1]}
        </h1>

        {/* Step 1 - Service */}
        {step === 1 && (
          <ul className="space-y-2">
            {services.map(s => (
              <li key={s.code}>
                <button
                  onClick={() => setServiceCode(s.code)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left transition',
                    serviceCode === s.code
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-brand-cream hover:border-brand-gold/50'
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brand-textmain truncate">{pickText(s.name, locale)}</p>
                    <p className="text-xs text-brand-textmuted mt-0.5">
                      {s.durationMin} phút {s.isCombo && '· combo'}
                    </p>
                  </div>
                  <span className="font-medium text-brand-gold whitespace-nowrap">
                    {formatPrice(s.basePrice, locale)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Step 2 - Branch */}
        {step === 2 && (
          <ul className="space-y-2">
            {branches.map(b => (
              <li key={b.code}>
                <button
                  onClick={() => setBranchCode(b.code)}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition',
                    branchCode === b.code
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-brand-cream hover:border-brand-gold/50'
                  )}
                >
                  <MapPin className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-brand-textmain">{pickText(b.name, locale)}</p>
                    <p className="text-xs text-brand-textmuted mt-0.5">{pickText(b.address, locale)}</p>
                    <p className="text-xs text-brand-textmuted mt-0.5">{b.phone}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Step 3 - Date + Time */}
        {step === 3 && (
          <>
            <p className="text-xs uppercase tracking-widest text-brand-textmuted mb-2">Ngày</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {nextDates.map(d => {
                const v = d.toISOString().slice(0, 10);
                const active = date === v;
                return (
                  <button
                    key={v}
                    onClick={() => setDate(v)}
                    className={cn(
                      'flex-shrink-0 snap-center rounded-2xl border-2 px-4 py-3 text-center text-xs transition min-w-[70px]',
                      active ? 'border-brand-gold bg-brand-gold text-white' : 'border-brand-cream hover:border-brand-gold/60'
                    )}
                  >
                    <div className="font-medium">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                    <div className="font-serif text-lg mt-1">{d.getDate()}</div>
                    <div className="text-[10px] opacity-70">{d.getMonth() + 1}</div>
                  </button>
                );
              })}
            </div>

            {date && (
              <>
                <p className="text-xs uppercase tracking-widest text-brand-textmuted mb-2 mt-6">Giờ</p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(s => {
                    const active = time === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setTime(s)}
                        className={cn(
                          'rounded-xl border-2 px-3 py-3 text-sm font-medium transition',
                          active ? 'border-brand-gold bg-brand-gold text-white' : 'border-brand-cream hover:border-brand-gold/60'
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Step 4 - Contact */}
        {step === 4 && (
          <div className="space-y-4">
            <Field label="Họ và tên">
              <input value={name} onChange={e => setName(e.target.value)} className="fi" placeholder="Nguyễn Thị A" />
            </Field>
            <Field label="Số điện thoại">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="fi"
                placeholder="09xx xxx xxx"
              />
            </Field>

            {/* Summary card */}
            <article className="card-soft mt-6 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-brand-textmuted text-xs uppercase tracking-widest">Dịch vụ</span>
                <span className="text-brand-textmain text-right truncate">{service ? pickText(service.name, locale) : '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-brand-textmuted text-xs uppercase tracking-widest">Chi nhánh</span>
                <span className="text-brand-textmain text-right truncate">{branch ? pickText(branch.name, locale) : '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-brand-textmuted text-xs uppercase tracking-widest">Thời gian</span>
                <span className="text-brand-textmain">{date && time ? `${date} ${time}` : '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-brand-cream/60">
                <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng</span>
                <span className="font-serif text-xl text-brand-gold">
                  {service ? formatPrice(service.basePrice, locale) : '—'}
                </span>
              </div>
            </article>

            {error && (
              <p className="text-sm text-rose-600 text-center">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-brand-cream bg-white/95 backdrop-blur p-4 safe-area"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="container-prose flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => (s - 1) as Step)}
              className="btn-ghost flex-shrink-0"
            >
              Quay lại
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => (s + 1) as Step)}
              disabled={!canNext}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              Tiếp <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy || !canNext}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .fi {
          width: 100%;
          border: 1px solid #f4efea;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 16px;
          background: #faf9f6;
          color: #4a443e;
          outline: none;
          transition: border 0.2s;
        }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
