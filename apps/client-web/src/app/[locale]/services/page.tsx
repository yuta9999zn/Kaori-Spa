import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import ServicesGrid from '@/components/ServicesGrid';

export default async function ServicesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('services');

  return (
    <section className="container-prose py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl text-brand-textmain mb-2">{t('title')}</h1>
        <p className="text-brand-textmuted">{t('subtitle')}</p>
      </header>
      <ServicesGrid locale={locale as Locale} />
    </section>
  );
}
