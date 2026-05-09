import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { ImageIcon, Save, X, Plus } from 'lucide-react';

export default async function ServiceFormPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  const t = await getTranslations('serviceForm');

  // TODO(Phase B): wire to backend when endpoint ships
  const staffPool = [
    { id: 'st-1', initials: 'AN', name: 'Anna Nguyen', specialty: 'Massage' },
    { id: 'st-2', initials: 'ER', name: 'Elena Rossi', specialty: 'Triệt lông' },
    { id: 'st-3', initials: 'MC', name: 'Mai Chi', specialty: 'Facial' }
  ];

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
          <button className="btn-ghost">{t('saveDraft')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('publish')}</button>
        </div>
      </header>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section title={t('sections.basic')}>
            <Field label={t('fields.name')} required>
              <input className="spa-input" placeholder="Triệt lông toàn thân nữ" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('fields.code')}>
                <input className="spa-input font-mono" placeholder="SRV-001" />
              </Field>
              <Field label={t('fields.category')} required>
                <select className="spa-input">
                  <option>{t('cat.massage')}</option>
                  <option>{t('cat.facial')}</option>
                  <option>{t('cat.hair_removal')}</option>
                  <option>{t('cat.package')}</option>
                </select>
              </Field>
            </div>
            <Field label={t('fields.shortDesc')}>
              <textarea rows={2} className="spa-input" placeholder={t('fields.shortDescPh')} />
            </Field>
          </Section>

          <Section title={t('sections.pricing')}>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('fields.price')} required>
                <div className="flex items-center rounded-xl border border-brand-cream bg-white">
                  <span className="px-3 text-brand-textmuted text-sm">₫</span>
                  <input type="number" className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="850000" />
                </div>
              </Field>
              <Field label={t('fields.discount')}>
                <input type="number" className="spa-input" placeholder="0" />
              </Field>
              <Field label={t('fields.duration')} required>
                <input type="number" className="spa-input" placeholder="75" />
              </Field>
            </div>
            <Field label={t('fields.bufferTime')}>
              <input type="number" className="spa-input" placeholder="15" />
            </Field>
          </Section>

          <Section title={t('sections.staff')}>
            <p className="text-xs text-brand-textmuted">{t('fields.staffHint')}</p>
            <div className="space-y-2">
              {staffPool.map(s => (
                <label key={s.id} className="flex items-center gap-3 rounded-xl border border-brand-cream px-3 py-2 hover:bg-brand-ivory/40 cursor-pointer">
                  <input type="checkbox" className="rounded border-brand-cream" />
                  <div className="h-8 w-8 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs">{s.initials}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-textmain">{s.name}</p>
                    <p className="text-[10px] text-brand-textmuted">{s.specialty}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          <Section title={t('sections.media')}>
            <div className="rounded-2xl border-2 border-dashed border-brand-cream p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-2">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-base text-brand-textmain">{t('media.upload')}</h4>
              <p className="text-xs text-brand-textmuted">{t('media.hint')}</p>
            </div>
            <Field label={t('fields.longDesc')}>
              <textarea rows={5} className="spa-input" placeholder={t('fields.longDescPh')} />
            </Field>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title={t('sections.advanced')}>
            <Field label={t('fields.gender')}>
              <select className="spa-input">
                <option>{t('gender.any')}</option>
                <option>{t('gender.female')}</option>
                <option>{t('gender.male')}</option>
              </select>
            </Field>
            <Field label={t('fields.minAge')}>
              <input type="number" className="spa-input" placeholder="16" />
            </Field>
            <label className="flex items-center justify-between text-sm">
              <span>{t('flags.requireRoom')}</span>
              <input type="checkbox" defaultChecked className="rounded border-brand-cream" />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>{t('flags.allowOnline')}</span>
              <input type="checkbox" defaultChecked className="rounded border-brand-cream" />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>{t('flags.featured')}</span>
              <input type="checkbox" className="rounded border-brand-cream" />
            </label>
          </Section>

          <Section title={t('sections.tags')}>
            <div className="flex flex-wrap gap-2">
              {['Best seller', 'Mới', 'Khuyến mãi', 'Cao cấp'].map(tag => (
                <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-brand-cream bg-brand-ivory/40">{tag}</span>
              ))}
              <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-brand-cream text-brand-textmuted hover:text-brand-gold">
                <Plus className="h-3 w-3" /> {t('addTag')}
              </button>
            </div>
          </Section>
        </aside>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5">
      <h3 className="font-serif text-lg text-brand-textmain mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted block mb-1">
        {label}{required && <span className="text-brand-gold ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
