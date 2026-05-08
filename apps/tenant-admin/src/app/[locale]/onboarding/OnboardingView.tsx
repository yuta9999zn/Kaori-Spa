'use client';

import { useState } from 'react';
import { ArrowRight, Check, Flower2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import {
  ONBOARDING_STEPS,
  TENANT_ID,
  advanceOnboarding,
  completeOnboarding,
  useOnboarding,
  type OnboardingStep,
  type OnboardingState
} from '@/lib/hooks';
import type { ApiError } from '@/lib/api';

export default function OnboardingView() {
  const t = useTranslations('onboarding');
  const { data, error, loading, refetch } = useOnboarding(TENANT_ID);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const state: OnboardingState | null = data;
  const currentStep = (state?.currentStep ?? 'welcome') as OnboardingStep;
  const completed = new Set(state?.completedSteps ?? []);
  const isDone = state?.completedAt != null || currentStep === 'done';

  // Compute the next step based on the canonical order.
  const currentIdx = ONBOARDING_STEPS.indexOf(currentStep);
  const nextStep: OnboardingStep | null =
    currentIdx >= 0 && currentIdx < ONBOARDING_STEPS.length - 1
      ? ONBOARDING_STEPS[currentIdx + 1]
      : null;

  const onAdvance = async () => {
    if (!nextStep) return;
    setBusy(true);
    setActionError(null);
    try {
      await advanceOnboarding(TENANT_ID, nextStep);
      await refetch();
    } catch (e) {
      setActionError(`${t('errors.advance')} (${(e as ApiError).message})`);
    } finally {
      setBusy(false);
    }
  };

  const onComplete = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await completeOnboarding(TENANT_ID);
      await refetch();
    } catch (e) {
      setActionError(`${t('errors.complete')} (${(e as ApiError).message})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-brand-gold" />
          {t('title')}
        </h1>
        <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{t('errors.load')} ({error.message})</span>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" />
        </div>
      )}

      {!loading && state && (
        <>
          {/* Step indicator */}
          <ol className="flex items-center mb-8 gap-1">
            {ONBOARDING_STEPS.map((step, i) => {
              const isCurrent = step === currentStep;
              const isCompleted = completed.has(step) || (isDone && true);
              return (
                <li key={step} className="flex items-center flex-1 last:flex-initial">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium flex-shrink-0',
                      isCurrent   ? 'bg-brand-gold text-white' :
                      isCompleted ? 'bg-emerald-500 text-white' :
                                    'bg-brand-cream text-brand-textmuted'
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < ONBOARDING_STEPS.length - 1 && (
                    <span className={cn('mx-2 h-0.5 flex-1',
                      isCompleted ? 'bg-emerald-500' : 'bg-brand-cream')} />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="card-soft space-y-4">
            {/* Step list with explicit status */}
            <ul className="divide-y divide-brand-cream/60">
              {ONBOARDING_STEPS.map(step => {
                const isCurrent = step === currentStep && !isDone;
                const isCompleted = completed.has(step) || isDone;
                const status = isCompleted
                  ? t('stepStatus.completed')
                  : isCurrent
                    ? t('stepStatus.current')
                    : t('stepStatus.pending');
                return (
                  <li key={step} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-brand-textmain">
                      {t(`steps.${step}` as 'steps.welcome')}
                    </span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest',
                      isCompleted ? 'bg-emerald-50 text-emerald-700' :
                      isCurrent   ? 'bg-brand-gold/10 text-brand-gold' :
                                    'bg-brand-cream/60 text-brand-textmuted'
                    )}>
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Meta */}
            <div className="grid gap-2 grid-cols-2 text-xs text-brand-textmuted pt-2 border-t border-brand-cream/60">
              <div>
                <span className="block uppercase tracking-widest text-[10px]">{t('startedAt')}</span>
                <span className="text-brand-textmain">
                  {state.startedAt ? new Date(state.startedAt).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="block uppercase tracking-widest text-[10px]">{t('completedAt')}</span>
                <span className="text-brand-textmain">
                  {state.completedAt ? new Date(state.completedAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            {!isDone && nextStep && (
              <button
                onClick={onAdvance}
                disabled={busy}
                className="btn-primary disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {t('actions.advance')}
              </button>
            )}
            {!isDone && (
              <button
                onClick={onComplete}
                disabled={busy}
                className="btn-ghost disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t('actions.complete')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
