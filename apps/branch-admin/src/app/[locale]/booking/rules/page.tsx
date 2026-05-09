import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { ScrollText, Save, RotateCcw, ShieldCheck, AlertOctagon, Workflow } from 'lucide-react';

export default async function BookingRulesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('booking');
  const t = await getTranslations('bookingRules');

  // TODO(Phase B): wire to backend when endpoint ships
  const scenarios = [
    { key: 'lastMinute', icon: 'workflow' as const },
    { key: 'standardOnline', icon: 'shield' as const },
    { key: 'cancelAttempt', icon: 'alert' as const },
    { key: 'lateArrival', icon: 'workflow' as const }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <ScrollText className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><RotateCcw className="h-4 w-4" /> {t('reset')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Eligibility */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <ShieldCheck className="h-4 w-4 text-brand-gold" /> {t('sections.eligibility')}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label={t('minAge')}>
                <input type="number" defaultValue={16} className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" />
              </Field>
              <Field label={t('membersOnly')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
                  <option>{t('off')}</option>
                  <option>{t('on')}</option>
                </select>
              </Field>
              <Field label={t('blacklistCheck')}>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
                  <option>{t('on')}</option>
                  <option>{t('off')}</option>
                </select>
              </Field>
              <Field label={t('depositRequired')}>
                <input type="number" defaultValue={20} className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" />
              </Field>
            </div>
          </section>

          {/* No-show */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <AlertOctagon className="h-4 w-4 text-brand-rose" /> {t('sections.noShow')}
            </h2>
            <div className="rounded-xl bg-brand-ivory/50 border border-brand-cream p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">{t('noShowHandling')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('graceMinutes')}>
                  <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm bg-white">
                    <option>{t('minutes', { n: '10' })}</option>
                    <option>{t('minutes', { n: '15' })}</option>
                    <option>{t('minutes', { n: '20' })}</option>
                  </select>
                </Field>
                <Field label={t('autoCancelAfter')}>
                  <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm bg-white">
                    <option>{t('minutes', { n: '30' })}</option>
                    <option>{t('minutes', { n: '45' })}</option>
                    <option>{t('minutes', { n: '60' })}</option>
                  </select>
                </Field>
                <Field label={t('penaltyAmount')}>
                  <input type="number" defaultValue={100000} className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm bg-white" />
                </Field>
                <Field label={t('strikeLimit')} hint={t('strikeLimitHint')}>
                  <input type="number" defaultValue={3} className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm bg-white" />
                </Field>
              </div>
            </div>
          </section>

          {/* Conflict resolution */}
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <Workflow className="h-4 w-4 text-brand-gold" /> {t('sections.conflict')}
            </h2>
            <div className="space-y-3 text-sm">
              {(['preferOnline', 'preferVip', 'preferEarlier'] as const).map(opt => (
                <label key={opt} className="flex items-start gap-3 rounded-xl border border-brand-cream bg-white p-3 cursor-pointer hover:border-brand-gold transition">
                  <input type="radio" name="conflict-policy" defaultChecked={opt === 'preferVip'} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-brand-textmain">{t(`conflict.${opt}.label` as 'conflict.preferOnline.label')}</p>
                    <p className="text-xs text-brand-textmuted">{t(`conflict.${opt}.desc` as 'conflict.preferOnline.desc')}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Scenarios */}
        <aside className="space-y-3">
          <h2 className="font-serif text-lg text-brand-textmain">{t('scenarios')}</h2>
          {scenarios.map(s => (
            <div key={s.key} className="bg-white rounded-2xl p-4 shadow-soft border border-brand-cream/60">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">
                {t(`scenario.${s.key}.title` as 'scenario.lastMinute.title')}
              </p>
              <p className="text-xs text-brand-textmain leading-relaxed">
                {t(`scenario.${s.key}.body` as 'scenario.lastMinute.body')}
              </p>
            </div>
          ))}
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
