import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Save, Eye, Upload, Tag, Image as ImageIcon, CalendarClock, Search } from 'lucide-react';

export default async function ContentFormPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contentForm');

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Eye className="h-4 w-4" /> {t('preview')}</button>
          <button className="btn-ghost"><Save className="h-4 w-4" /> {t('save')}</button>
          <button className="btn-primary"><Upload className="h-4 w-4" /> {t('publish')}</button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <article className="kpi-card">
            <input
              type="text"
              defaultValue=""
              placeholder={t('fields.titlePlaceholder')}
              className="w-full font-serif text-2xl text-brand-textmain bg-transparent border-0 outline-none placeholder:text-brand-textmuted"
            />
            <hr className="my-3 border-brand-cream/60" />
            <textarea
              rows={16}
              placeholder={t('fields.contentPlaceholder')}
              className="w-full text-sm text-brand-textmain bg-transparent border-0 outline-none resize-none placeholder:text-brand-textmuted"
            />
          </article>

          <article className="kpi-card">
            <h2 className="font-serif text-base text-brand-textmain mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-brand-gold" /> {t('sections.seo')}
            </h2>
            <div className="grid gap-3">
              <Field label={t('fields.slug')}>
                <input type="text" defaultValue="bai-viet-moi" className="spa-input" />
              </Field>
              <Field label={t('fields.metaTitle')}>
                <input type="text" placeholder="..." className="spa-input" />
              </Field>
              <Field label={t('fields.metaDesc')}>
                <textarea rows={3} placeholder="..." className="spa-input" />
              </Field>
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="kpi-card">
            <h2 className="font-serif text-base text-brand-textmain mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand-gold" /> {t('sections.publish')}
            </h2>
            <div className="grid gap-3">
              <Field label={t('fields.scheduledAt')}>
                <input type="datetime-local" className="spa-input" />
              </Field>
              <Field label={t('fields.author')}>
                <select className="spa-input">
                  <option>Trần Mỹ Duyên</option>
                  <option>Nguyễn Văn An</option>
                </select>
              </Field>
            </div>
          </article>

          <article className="kpi-card">
            <h2 className="font-serif text-base text-brand-textmain mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand-gold" /> {t('sections.media')}
            </h2>
            <div className="aspect-video rounded-xl border-2 border-dashed border-brand-cream flex items-center justify-center text-xs text-brand-textmuted">
              {t('fields.featured')}
            </div>
          </article>

          <article className="kpi-card">
            <h2 className="font-serif text-base text-brand-textmain mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-gold" /> {t('sections.taxonomy')}
            </h2>
            <div className="grid gap-3">
              <Field label={t('fields.postType')}>
                <select className="spa-input">
                  <option>{t('postType.news')}</option>
                  <option>{t('postType.service')}</option>
                  <option>{t('postType.product')}</option>
                  <option>{t('postType.blog')}</option>
                </select>
              </Field>
              <Field label={t('fields.category')}>
                <select className="spa-input"><option>Massage</option><option>Triệt lông</option></select>
              </Field>
              <Field label={t('fields.targetService')}>
                <select className="spa-input"><option>—</option></select>
              </Field>
              <Field label={t('fields.tags')}>
                <input type="text" placeholder="spa, beauty" className="spa-input" />
              </Field>
            </div>
          </article>
        </aside>
      </div>
    </>
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
