import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  SlidersHorizontal,
  CalendarDays,
  Shield,
  CreditCard,
  Bell,
  Save,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export default async function BookingSettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('bookingSettings');

  // TODO(Phase B): wire to backend when endpoint ships
  const slotIntervals = ['15', '30', '60'] as const;
  const gapOptions = ['0', '10', '15', '30'] as const;
  const noticeOptions = ['1', '2', '24'] as const;
  const windowOptions = ['30', '60', '90'] as const;

  return (
    <>
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-ghost"><RotateCcw className="h-4 w-4" /> {t('resetDefault')}</button>
          <button className="btn-ghost"><ExternalLink className="h-4 w-4" /> {t('openPortal')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service & Staff */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-brand-gold" /> {t('sections.preferences')}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">
                  {t('serviceVisibility')}
                </label>
                <select className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  <option>{t('serviceVisibilityAll')}</option>
                  <option>{t('serviceVisibilitySelected')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">
                  {t('staffMode')}
                </label>
                <div className="grid gap-2 md:grid-cols-3">
                  {(['cannot', 'optional', 'mustChoose'] as const).map(mode => (
                    <label
                      key={mode}
                      className="rounded-xl border border-brand-cream bg-white p-3 cursor-pointer hover:border-brand-gold transition"
                    >
                      <p className="font-medium text-sm text-brand-textmain">{t(`staffModes.${mode}.label` as 'staffModes.cannot.label')}</p>
                      <p className="text-[10px] text-brand-textmuted mt-1">{t(`staffModes.${mode}.desc` as 'staffModes.cannot.desc')}</p>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Scheduling */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <CalendarDays className="h-4 w-4 text-brand-gold" /> {t('sections.scheduling')}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label={t('slotInterval')} hint={t('slotIntervalHint')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  {slotIntervals.map(v => <option key={v}>{t('minutes', { n: v })}</option>)}
                </select>
              </Field>
              <Field label={t('minGap')} hint={t('minGapHint')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  {gapOptions.map(v => <option key={v}>{t('minutes', { n: v })}</option>)}
                </select>
              </Field>
              <Field label={t('minNotice')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  {noticeOptions.map(v => <option key={v}>{t('hours', { n: v })}</option>)}
                </select>
              </Field>
              <Field label={t('maxWindow')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  {windowOptions.map(v => <option key={v}>{t('days', { n: v })}</option>)}
                </select>
              </Field>
            </div>
          </section>

          {/* Limits */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <Shield className="h-4 w-4 text-brand-gold" /> {t('sections.limits')}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label={t('maxPerDay')}>
                <input defaultValue={2} type="number" className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </Field>
              <Field label={t('maxFuture')}>
                <input defaultValue={3} type="number" className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </Field>
              <Field label={t('cancelNotice')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  <option>{t('hours', { n: '6' })}</option>
                  <option>{t('hours', { n: '12' })}</option>
                  <option>{t('hours', { n: '24' })}</option>
                </select>
              </Field>
              <Field label={t('latePenalty')}>
                <input defaultValue={50000} type="number" className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </Field>
            </div>
          </section>

          {/* Intake & Payments */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <CreditCard className="h-4 w-4 text-brand-gold" /> {t('sections.intake')}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label={t('requireDeposit')} hint={t('requireDepositHint')}>
                <input defaultValue={20} type="number" className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </Field>
              <Field label={t('autoConfirm')} hint={t('autoConfirmHint')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                  <option>{t('on')}</option>
                  <option>{t('off')}</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <Bell className="h-4 w-4 text-brand-gold" /> {t('sections.notifications')}
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between rounded-xl border border-brand-cream bg-brand-ivory/40 px-4 py-3">
                <div>
                  <p className="font-medium text-brand-textmain">{t('notif.confirmation')}</p>
                  <p className="text-xs text-brand-textmuted">{t('notif.confirmationDesc')}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-gold">SMS · Email · Zalo</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-cream bg-brand-ivory/40 px-4 py-3">
                <div>
                  <p className="font-medium text-brand-textmain">{t('notif.reminder')}</p>
                  <p className="text-xs text-brand-textmuted">{t('notif.reminderDesc')}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-gold">SMS · Zalo</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Live preview */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-base text-brand-textmain mb-4">{t('livePreview')}</h2>
            <div className="rounded-2xl border border-brand-cream bg-brand-ivory/50 p-4 space-y-3 text-sm">
              <div className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('previewStep1')}</div>
              <div className="rounded-xl border border-brand-gold bg-white px-3 py-2 flex justify-between">
                <span className="font-medium">Massage cổ vai gáy</span>
                <span className="font-serif text-brand-gold">450.000₫</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('previewStep2')}</div>
              <div className="grid grid-cols-2 gap-2">
                {['10:00', '10:30', '11:00', '11:30'].map(s => (
                  <div key={s} className="rounded-lg border border-brand-cream bg-white py-1.5 text-center text-xs">{s}</div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-brand-textmuted mt-3">{t('previewHint')}</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-brand-textmuted mt-1.5">{hint}</p>}
    </div>
  );
}
