import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { UserPlus, Save, X, Upload } from 'lucide-react';

// TODO(Phase B): wire to backend `POST /v1/staff` + `PUT /v1/staff/{id}`
export default async function StaffFormPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('staff');
  const t = await getTranslations('staffForm');

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><X className="h-4 w-4" /> {t('cancel')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar */}
        <aside className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <h2 className="font-serif text-base text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">
            {t('section.avatar')}
          </h2>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-cream/50 text-brand-textmuted">
              <Upload className="h-8 w-8" />
            </div>
            <button className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> {t('uploadPhoto')}</button>
            <p className="text-[10px] text-brand-textmuted text-center">{t('uploadHint')}</p>
          </div>
        </aside>

        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-base text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">
              {t('section.identity')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('field.fullName')} required>
                <input className="form-input" placeholder={t('placeholder.fullName')} />
              </Field>
              <Field label={t('field.nickname')}>
                <input className="form-input" placeholder={t('placeholder.nickname')} />
              </Field>
              <Field label={t('field.code')}>
                <input className="form-input" placeholder="KTV-XXX" />
              </Field>
              <Field label={t('field.role')} required>
                <select className="form-input">
                  <option value="senior">{t('role.senior')}</option>
                  <option value="therapist">{t('role.therapist')}</option>
                  <option value="junior">{t('role.junior')}</option>
                  <option value="reception">{t('role.reception')}</option>
                </select>
              </Field>
              <Field label={t('field.dob')}>
                <input type="date" className="form-input" />
              </Field>
              <Field label={t('field.gender')}>
                <select className="form-input">
                  <option value="female">{t('gender.female')}</option>
                  <option value="male">{t('gender.male')}</option>
                  <option value="other">{t('gender.other')}</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-base text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">
              {t('section.contact')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('field.phone')} required>
                <input className="form-input" placeholder="0901 ..." />
              </Field>
              <Field label={t('field.email')}>
                <input type="email" className="form-input" placeholder="staff@kaori.vn" />
              </Field>
              <Field label={t('field.address')} className="md:col-span-2">
                <input className="form-input" placeholder={t('placeholder.address')} />
              </Field>
            </div>
          </section>

          {/* Employment */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-base text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">
              {t('section.employment')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('field.branch')} required>
                <select className="form-input">
                  <option>575 Kim Mã</option>
                  <option>625 Kim Mã</option>
                </select>
              </Field>
              <Field label={t('field.joinedAt')}>
                <input type="date" className="form-input" />
              </Field>
              <Field label={t('field.baseSalary')}>
                <input type="number" className="form-input" placeholder="5000000" />
              </Field>
              <Field label={t('field.commissionPct')}>
                <input type="number" className="form-input" placeholder="20" />
              </Field>
              <Field label={t('field.bio')} className="md:col-span-2">
                <textarea className="form-input min-h-[80px]" placeholder={t('placeholder.bio')} />
              </Field>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          border: 1px solid var(--brand-cream, #ECE3D7);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--brand-gold, #B89968);
        }
      `}</style>
    </>
  );
}

function Field({ label, required, className = '', children }: {
  label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">
        {label}{required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {children}
    </div>
  );
}
