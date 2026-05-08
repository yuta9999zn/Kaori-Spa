import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Phone, MapPin } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  return (
    <section className="container-prose py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl text-brand-textmain mb-2">{t('title')}</h1>
        <p className="text-brand-textmuted">{t('subtitle')}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ContactForm />

        <aside className="card-soft h-fit space-y-6 text-sm">
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-1 text-brand-gold" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-0.5">
                {t('hotline')}
              </p>
              <a href="tel:19000000" className="text-brand-textmain hover:text-brand-gold">
                {t('hotlineNumber')}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-1 text-brand-gold" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-0.5">
                {t('address')}
              </p>
              <p className="text-brand-textmain">{t('addressValue')}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
