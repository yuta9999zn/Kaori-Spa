import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import BookingFlow from '@/components/booking/BookingFlow';

export default async function BookingPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string; branch?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('booking');

  return (
    <section className="container-prose py-12">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-4xl text-brand-textmain mb-2">{t('title')}</h1>
        <p className="text-brand-textmuted">{t('subtitle')}</p>
      </header>

      <BookingFlow
        locale={locale as Locale}
        initialService={sp.service}
        initialBranch={sp.branch}
      />
    </section>
  );
}
