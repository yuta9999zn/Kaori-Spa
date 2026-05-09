import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Save, X, AlertTriangle } from 'lucide-react';

export default async function CustomerNewPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  const t = await getTranslations('customerForm');

  // TODO(Phase B): wire form submission to backend when endpoint ships

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><X className="h-4 w-4" /> {t('cancel')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <form className="space-y-6">
        <Section title={t('section.basic')}>
          <Field label={t('field.firstName')} required>
            <input type="text" className="spa-input" placeholder={t('placeholder.firstName')} />
          </Field>
          <Field label={t('field.lastName')} required>
            <input type="text" className="spa-input" placeholder={t('placeholder.lastName')} />
          </Field>
          <Field label={t('field.gender')}>
            <select className="spa-input">
              <option>{t('gender.female')}</option>
              <option>{t('gender.male')}</option>
              <option>{t('gender.other')}</option>
            </select>
          </Field>
          <Field label={t('field.dob')}>
            <input type="date" className="spa-input" />
          </Field>
        </Section>

        <Section title={t('section.contact')}>
          <Field label={t('field.phone')} required>
            <input type="tel" className="spa-input" placeholder="+84 ..." />
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t('duplicate.title')}</p>
                <p className="opacity-80">{t('duplicate.message')}</p>
              </div>
            </div>
          </Field>
          <Field label={t('field.email')}>
            <input type="email" className="spa-input" placeholder="name@example.com" />
          </Field>
          <Field label={t('field.address')} full>
            <input type="text" className="spa-input" placeholder={t('placeholder.address')} />
          </Field>
        </Section>

        <Section title={t('section.membership')}>
          <Field label={t('field.membershipLevel')}>
            <select className="spa-input">
              <option>{t('level.regular')}</option>
              <option>{t('level.silver')}</option>
              <option>{t('level.gold')}</option>
              <option>{t('level.platinum')}</option>
            </select>
          </Field>
          <Field label={t('field.accountStatus')}>
            <select className="spa-input">
              <option>{t('status.active')}</option>
              <option>{t('status.inactive')}</option>
              <option>{t('status.blocked')}</option>
            </select>
          </Field>
          <Field label={t('field.registrationBranch')}>
            <select className="spa-input">
              <option>Quận 1</option>
              <option>Quận 7</option>
              <option>Thủ Đức</option>
            </select>
          </Field>
        </Section>

        <Section title={t('section.health')}>
          <Field label={t('field.preferredTherapist')}>
            <input type="text" className="spa-input" placeholder="Anna N." />
          </Field>
          <Field label={t('field.preferredRoom')}>
            <select className="spa-input">
              <option>{t('room.standard')}</option>
              <option>{t('room.couple')}</option>
              <option>{t('room.vip')}</option>
            </select>
          </Field>
          <Field label={t('field.skinCondition')}>
            <input type="text" className="spa-input" placeholder={t('placeholder.skinCondition')} />
          </Field>
          <Field label={t('field.allergies')}>
            <input type="text" className="spa-input" placeholder={t('placeholder.allergies')} />
          </Field>
        </Section>

        <Section title={t('section.crm')}>
          <Field label={t('field.referralSource')}>
            <select className="spa-input">
              <option>{t('referral.direct')}</option>
              <option>{t('referral.referral')}</option>
              <option>{t('referral.social')}</option>
              <option>{t('referral.walkin')}</option>
            </select>
          </Field>
          <Field label={t('field.notes')} full>
            <textarea className="spa-input h-24 resize-none" placeholder={t('placeholder.notes')} />
          </Field>
        </Section>

        <div className="flex items-center justify-end gap-2 pt-4">
          <button type="button" className="btn-ghost"><X className="h-4 w-4" /> {t('cancel')}</button>
          <button type="submit" className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
      <h3 className="font-serif text-xl text-brand-textmain border-b border-brand-cream pb-3 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">
        {label}{required && <span className="text-brand-rose ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
