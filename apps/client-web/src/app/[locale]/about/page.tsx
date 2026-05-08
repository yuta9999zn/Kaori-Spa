import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Heart, Award, Lock, Leaf } from 'lucide-react';

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const values = [
    { icon: Heart, key: 'value1' as const },
    { icon: Award, key: 'value2' as const },
    { icon: Lock, key: 'value3' as const },
    { icon: Leaf, key: 'value4' as const }
  ];

  return (
    <section className="container-prose py-12">
      <header className="max-w-2xl mb-12">
        <h1 className="font-serif text-4xl text-brand-textmain mb-4">{t('title')}</h1>
        <p className="text-lg text-brand-textmuted leading-relaxed">{t('lead')}</p>
      </header>

      <div className="grid gap-12 md:grid-cols-2 mb-16">
        <article>
          <h2 className="font-serif text-2xl text-brand-textmain mb-3">{t('missionTitle')}</h2>
          <p className="text-brand-textmuted leading-relaxed">{t('missionText')}</p>
        </article>
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-brand-rose via-brand-cream to-brand-gold/40" />
      </div>

      <h2 className="font-serif text-2xl text-brand-textmain mb-8">{t('valuesTitle')}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, key }) => (
          <article key={key} className="card-soft text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-serif text-lg text-brand-textmain">{t(key)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
