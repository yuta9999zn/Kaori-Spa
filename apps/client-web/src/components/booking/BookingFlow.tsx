'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronLeft, ChevronRight, MapPin, CalendarDays, Sparkles, User, PartyPopper, Loader2, AlertCircle } from 'lucide-react';
import { branches } from '@/data/branches';
import { services } from '@/data/services';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { pickText, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { api, ApiError } from '@/lib/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000';
const BRANCH_UUIDS: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_BRANCH_UUIDS ?? '{}');
  } catch { return {}; }
})();

type Step = 0 | 1 | 2 | 3 | 4;

interface State {
  branch: string | undefined;
  serviceCodes: string[];
  date: string | undefined;
  slot: string | undefined;
  customer: { name: string; phone: string; email: string; note: string };
}

export default function BookingFlow({
  locale,
  initialService,
  initialBranch
}: {
  locale: Locale;
  initialService?: string;
  initialBranch?: string;
}) {
  const t = useTranslations('booking');
  const tSvc = useTranslations('services');
  const tBranch = useTranslations('branches');
  const tCommon = useTranslations('common');

  const [step, setStep] = useState<Step>(0);
  const [state, setState] = useState<State>({
    branch: initialBranch && branches.find(b => b.code === initialBranch) ? initialBranch : undefined,
    serviceCodes: initialService && services.find(s => s.code === initialService) ? [initialService] : [],
    date: undefined,
    slot: undefined,
    customer: { name: '', phone: '', email: '', note: '' }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => state.serviceCodes.map(c => services.find(s => s.code === c)).filter(Boolean) as typeof services,
    [state.serviceCodes]
  );
  const totalPrice = selectedServices.reduce((s, x) => s + x.basePrice, 0);
  const totalDuration = selectedServices.reduce((s, x) => s + x.durationMin, 0);

  const next = () => {
    if (step === 0 && !state.branch) {
      setErrors({ branch: t('errors.branchRequired') });
      return;
    }
    if (step === 1 && state.serviceCodes.length === 0) {
      setErrors({ services: t('errors.serviceRequired') });
      return;
    }
    if (step === 2 && (!state.date || !state.slot)) {
      setErrors({ slot: t('errors.slotRequired') });
      return;
    }
    if (step === 3) {
      const e: Record<string, string> = {};
      if (!state.customer.name.trim()) e.name = t('errors.nameRequired');
      if (!/^[+0-9 ()-]{8,20}$/.test(state.customer.phone)) e.phone = t('errors.phoneInvalid');
      if (state.customer.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.customer.email))
        e.email = t('errors.emailInvalid');
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
      void submitBooking();
      return;
    }
    setErrors({});
    setStep(s => Math.min(4, (s + 1) as Step));
  };

  const submitBooking = async () => {
    if (submitting || !state.branch || !state.date || !state.slot || selectedServices.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const branchUuid = BRANCH_UUIDS[state.branch];
      const requestedStart = `${state.date}T${state.slot}:00+07:00`;
      const firstService = selectedServices[0];
      await api('/v1/public/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': `web-${Date.now()}-${state.customer.phone}` },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          branchId: branchUuid,
          customerName: state.customer.name,
          customerPhone: state.customer.phone,
          customerEmail: state.customer.email || undefined,
          locale,
          note: state.customer.note || undefined,
          serviceCode: firstService.code,
          durationMin: firstService.durationMin,
          price: firstService.basePrice,
          requestedStart
        })
      }).then((res) => {
        const r = res as { code: string };
        setBookingCode(r.code);
      });
      setErrors({});
      setStep(4);
    } catch (e) {
      const err = e as ApiError;
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const back = () => {
    setErrors({});
    setStep(s => Math.max(0, (s - 1) as Step));
  };

  const stepLabels = [t('stepBranch'), t('stepService'), t('stepTime'), t('stepInfo')];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Step indicator */}
        {step < 4 && (
          <ol className="mb-8 flex items-center">
            {stepLabels.map((label, i) => (
              <li key={label} className="flex items-center flex-1 last:flex-initial">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-medium transition',
                    step === i
                      ? 'border-brand-gold bg-brand-gold text-white shadow-[0_0_0_4px_rgba(201,168,124,0.18)]'
                      : step > i
                        ? 'border-brand-gold bg-emerald-50 text-emerald-600'
                        : 'border-brand-cream bg-white text-brand-textmuted'
                  )}
                >
                  {step > i ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="ml-2 text-xs font-medium text-brand-textmuted hidden sm:inline">
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div
                    className={cn(
                      'mx-3 h-0.5 flex-1 transition',
                      step > i ? 'bg-brand-gold' : 'bg-brand-cream'
                    )}
                  />
                )}
              </li>
            ))}
          </ol>
        )}

        <div className="card-soft">
          {step === 0 && (
            <BranchStep
              locale={locale}
              selected={state.branch}
              onPick={code => setState(s => ({ ...s, branch: code }))}
              error={errors.branch}
            />
          )}
          {step === 1 && (
            <ServiceStep
              locale={locale}
              selected={state.serviceCodes}
              onToggle={code =>
                setState(s => ({
                  ...s,
                  serviceCodes: s.serviceCodes.includes(code)
                    ? s.serviceCodes.filter(c => c !== code)
                    : [...s.serviceCodes, code]
                }))
              }
              error={errors.services}
            />
          )}
          {step === 2 && (
            <TimeStep
              date={state.date}
              slot={state.slot}
              onPick={(date, slot) => setState(s => ({ ...s, date, slot }))}
              error={errors.slot}
            />
          )}
          {step === 3 && (
            <InfoStep
              data={state.customer}
              onChange={c => setState(s => ({ ...s, customer: c }))}
              errors={errors}
            />
          )}
          {step === 4 && <SuccessStep code={bookingCode} />}
        </div>

        {submitError && step < 4 && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {step < 4 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || submitting}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> {t('back')}
            </button>
            <button type="button" onClick={next} disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (step === 3 ? t('confirm') : t('next'))}
              {!submitting && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {step < 4 && (
        <aside className="card-soft h-fit lg:sticky lg:top-24">
          <h3 className="font-serif text-lg text-brand-textmain mb-4">{t('summary')}</h3>

          <div className="space-y-3 text-sm">
            <Row icon={<MapPin className="h-3.5 w-3.5" />} label={tBranch('address')}>
              {state.branch
                ? pickText(branches.find(b => b.code === state.branch)!.name, locale)
                : '—'}
            </Row>

            <Row icon={<Sparkles className="h-3.5 w-3.5" />} label={tSvc('title')}>
              {selectedServices.length === 0 ? '—' : (
                <ul className="space-y-0.5">
                  {selectedServices.map(s => (
                    <li key={s.code} className="flex items-baseline justify-between gap-2">
                      <span className="truncate">{pickText(s.name, locale)}</span>
                      <span className="text-brand-textmuted whitespace-nowrap">
                        {formatPrice(s.basePrice, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Row>

            <Row icon={<CalendarDays className="h-3.5 w-3.5" />} label={t('stepTime')}>
              {state.date && state.slot ? `${state.date} · ${state.slot}` : '—'}
            </Row>
          </div>

          <div className="mt-6 border-t border-brand-cream pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Total</p>
              <p className="text-brand-textmuted text-xs">
                {totalDuration > 0 ? tSvc('duration', { minutes: totalDuration }) : tCommon('loading').replace('...', '—')}
              </p>
            </div>
            <p className="font-serif text-2xl text-brand-gold">
              {formatPrice(totalPrice, locale)}
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  children
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">
        {icon} {label}
      </p>
      <div className="text-brand-textmain">{children}</div>
    </div>
  );
}

function BranchStep({
  locale,
  selected,
  onPick,
  error
}: {
  locale: Locale;
  selected?: string;
  onPick: (code: string) => void;
  error?: string;
}) {
  const tBranch = useTranslations('branches');
  return (
    <div>
      <h2 className="font-serif text-xl text-brand-textmain mb-1">{tBranch('title')}</h2>
      <p className="text-sm text-brand-textmuted mb-6">{tBranch('subtitle')}</p>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map(b => (
          <button
            key={b.code}
            type="button"
            onClick={() => onPick(b.code)}
            className={cn(
              'rounded-2xl border-2 p-5 text-left transition',
              selected === b.code
                ? 'border-brand-gold bg-brand-gold/5'
                : 'border-brand-cream hover:border-brand-gold'
            )}
          >
            <h3 className="font-serif text-lg text-brand-textmain mb-1">
              {pickText(b.name, locale)}
            </h3>
            <p className="text-sm text-brand-textmuted">{pickText(b.address, locale)}</p>
            <p className="mt-2 text-xs text-brand-textmuted">{b.phone}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceStep({
  locale,
  selected,
  onToggle,
  error
}: {
  locale: Locale;
  selected: string[];
  onToggle: (code: string) => void;
  error?: string;
}) {
  const t = useTranslations('services');
  return (
    <div>
      <h2 className="font-serif text-xl text-brand-textmain mb-1">{t('title')}</h2>
      <p className="text-sm text-brand-textmuted mb-6">{t('subtitle')}</p>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1">
        {services.map(s => {
          const checked = selected.includes(s.code);
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => onToggle(s.code)}
              className={cn(
                'flex items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left transition',
                checked
                  ? 'border-brand-gold bg-brand-gold/5'
                  : 'border-brand-cream hover:border-brand-gold'
              )}
            >
              <div className="min-w-0">
                <p className="font-serif text-sm text-brand-textmain truncate">
                  {pickText(s.name, locale)}
                </p>
                <p className="mt-0.5 text-xs text-brand-textmuted">
                  {t('duration', { minutes: s.durationMin })}
                  {s.sessions > 1 && <> · {t('sessions', { count: s.sessions })}</>}
                </p>
              </div>
              <span className="font-medium text-brand-gold whitespace-nowrap">
                {formatPrice(s.basePrice, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeStep({
  date,
  slot,
  onPick,
  error
}: {
  date?: string;
  slot?: string;
  onPick: (date: string, slot: string) => void;
  error?: string;
}) {
  const t = useTranslations('booking');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(tomorrow);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  return (
    <div>
      <h2 className="font-serif text-xl text-brand-textmain mb-6">{t('stepTime')}</h2>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-brand-textmuted mb-2">Date</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => onPick(d, slot ?? '')}
              className={cn(
                'rounded-2xl border-2 px-4 py-3 text-center text-xs transition flex-shrink-0',
                date === d
                  ? 'border-brand-gold bg-brand-gold text-white'
                  : 'border-brand-cream text-brand-textmain hover:border-brand-gold'
              )}
            >
              <div className="font-medium">{new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div className="text-base font-serif mt-1">{new Date(d).getDate()}</div>
            </button>
          ))}
        </div>
      </div>

      {date && (
        <div>
          <p className="text-xs uppercase tracking-widest text-brand-textmuted mb-2">Slot</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map(sl => (
              <button
                key={sl}
                type="button"
                onClick={() => onPick(date, sl)}
                className={cn(
                  'rounded-xl border-2 px-3 py-2 text-sm transition',
                  slot === sl
                    ? 'border-brand-gold bg-brand-gold text-white'
                    : 'border-brand-cream text-brand-textmain hover:border-brand-gold'
                )}
              >
                {sl}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoStep({
  data,
  onChange,
  errors
}: {
  data: { name: string; phone: string; email: string; note: string };
  onChange: (data: { name: string; phone: string; email: string; note: string }) => void;
  errors: Record<string, string>;
}) {
  const t = useTranslations('booking.form');
  return (
    <div>
      <h2 className="font-serif text-xl text-brand-textmain mb-6">
        <User className="inline h-5 w-5 mr-2" />
        {t('name')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('name')} error={errors.name}>
          <input
            className="fi"
            placeholder={t('namePlaceholder')}
            value={data.name}
            onChange={e => onChange({ ...data, name: e.target.value })}
          />
        </Field>
        <Field label={t('phone')} error={errors.phone}>
          <input
            className="fi"
            placeholder={t('phonePlaceholder')}
            value={data.phone}
            onChange={e => onChange({ ...data, phone: e.target.value })}
          />
        </Field>
        <Field label={t('email')} error={errors.email}>
          <input
            className="fi"
            type="email"
            placeholder="name@example.com"
            value={data.email}
            onChange={e => onChange({ ...data, email: e.target.value })}
          />
        </Field>
        <Field label={t('note')}>
          <textarea
            className="fi min-h-[80px]"
            placeholder={t('notePlaceholder')}
            value={data.note}
            onChange={e => onChange({ ...data, note: e.target.value })}
          />
        </Field>
      </div>
      <style jsx>{`
        .fi {
          width: 100%;
          border: 1px solid #f4efea;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          background: #faf9f6;
          color: #4a443e;
          outline: none;
          transition: border 0.2s;
        }
        .fi:focus {
          border-color: #c9a87c;
          box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-brand-textmuted mb-1.5">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function SuccessStep({ code }: { code: string | null }) {
  const t = useTranslations('booking.success');
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <PartyPopper className="h-8 w-8" />
      </div>
      <h2 className="font-serif text-2xl text-brand-textmain mb-2">{t('title')}</h2>
      <p className="text-brand-textmuted mb-4 max-w-md mx-auto">{t('desc')}</p>
      {code && (
        <p className="font-mono text-brand-gold text-lg mb-8">{code}</p>
      )}
      <Link href="/" className="btn-primary">
        {t('backHome')}
      </Link>
    </div>
  );
}
