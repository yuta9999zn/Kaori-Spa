import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Save, X, Plus, Bed, Settings, ShieldCheck, Sparkles } from 'lucide-react';

export default async function RoomFormPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('roomForm');
  const tRoom = await getTranslations('room');

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><X className="h-4 w-4" /> {t('cancel')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section title={t('sections.basic')} hint={t('sections.basicHint')} Icon={Settings}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t('fields.name')}><input type="text" placeholder="Phòng 101" className="spa-input" /></Field>
              <Field label={t('fields.code')}><input type="text" placeholder="R-101" className="spa-input" /></Field>
              <Field label={t('fields.floor')}>
                <select className="spa-input"><option>1</option><option>2</option><option>3</option></select>
              </Field>
              <Field label={t('fields.type')}>
                <select className="spa-input">
                  <option>{tRoom('type.normal')}</option>
                  <option>{tRoom('type.vip')}</option>
                  <option>{tRoom('type.couple')}</option>
                  <option>{tRoom('type.laser')}</option>
                </select>
              </Field>
              <Field label={t('fields.description')}>
                <textarea rows={2} placeholder="..." className="spa-input md:col-span-2" />
              </Field>
            </div>
          </Section>

          <Section title={t('sections.gender')} hint={t('sections.genderHint')} Icon={ShieldCheck}>
            <div className="flex gap-3">
              {(['any', 'female', 'male'] as const).map(g => (
                <label key={g} className="inline-flex items-center gap-2 rounded-full border border-brand-cream px-3 py-1.5 text-xs cursor-pointer">
                  <input type="radio" name="gender" defaultChecked={g === 'any'} />
                  {t(`gender.${g}` as 'gender.any')}
                </label>
              ))}
            </div>
          </Section>

          <Section title={t('sections.beds')} hint={t('sections.bedsHint')} Icon={Bed}>
            <ul className="space-y-2">
              {[1, 2].map(i => (
                <li key={i} className="grid gap-3 md:grid-cols-3 rounded-xl border border-brand-cream/70 p-3">
                  <Field label={t('fields.bedName')}>
                    <input type="text" defaultValue={`Giường ${i}`} className="spa-input" />
                  </Field>
                  <Field label={tRoom('bedType.standard')}>
                    <select className="spa-input">
                      <option>{tRoom('bedType.standard')}</option>
                      <option>{tRoom('bedType.massage')}</option>
                      <option>{tRoom('bedType.laser')}</option>
                      <option>{tRoom('bedType.vip')}</option>
                    </select>
                  </Field>
                  <Field label={t('fields.bedDefaultStatus')}>
                    <select className="spa-input">
                      <option>{tRoom('status.active')}</option>
                      <option>{tRoom('status.maintenance')}</option>
                    </select>
                  </Field>
                </li>
              ))}
            </ul>
            <button className="btn-ghost text-xs mt-3"><Plus className="h-3.5 w-3.5" /> {t('fields.addBed')}</button>
          </Section>

          <Section title={t('sections.services')} hint={t('sections.servicesHint')} Icon={Sparkles}>
            <div className="flex flex-wrap gap-2">
              {['massage', 'facial', 'hair_removal', 'package', 'body'].map(s => (
                <label key={s} className="inline-flex items-center gap-2 rounded-full border border-brand-cream px-3 py-1.5 text-xs cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  {s}
                </label>
              ))}
            </div>
          </Section>

          <Section title={t('sections.rules')} hint={t('sections.rulesHint')} Icon={Settings}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t('fields.openTime')}><input type="time" defaultValue="09:00" className="spa-input" /></Field>
              <Field label={t('fields.closeTime')}><input type="time" defaultValue="21:00" className="spa-input" /></Field>
              <Field label={t('fields.cleanupMin')}><input type="number" defaultValue="15" className="spa-input" /></Field>
              <Field label={t('fields.minLeadMin')}><input type="number" defaultValue="30" className="spa-input" /></Field>
              <label className="inline-flex items-center gap-2 mt-3 md:col-span-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">{t('fields.showOnline')}</span>
              </label>
            </div>
          </Section>
        </div>

        <aside className="lg:col-span-1">
          <article className="kpi-card sticky top-4">
            <h2 className="font-serif text-base text-brand-textmain mb-3">{t('sections.preview')}</h2>
            <div className="rounded-xl border border-brand-cream/70 p-4 bg-brand-ivory/30">
              <p className="font-serif text-lg text-brand-textmain">Phòng 101</p>
              <p className="text-xs text-brand-textmuted">VIP · Tầng 1 · 2 giường</p>
              <p className="mt-3 text-xs text-brand-textmuted">09:00 - 21:00</p>
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}

function Section({
  title, hint, Icon, children
}: {
  title: string; hint: string; Icon: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <article className="kpi-card">
      <header className="mb-4">
        <h2 className="font-serif text-lg text-brand-textmain flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand-gold" /> {title}
        </h2>
        <p className="text-xs text-brand-textmuted mt-1">{hint}</p>
      </header>
      {children}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-brand-textmuted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
