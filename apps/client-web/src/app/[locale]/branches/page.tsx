import { setRequestLocale, getTranslations } from 'next-intl/server';
import { MapPin, Phone, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { branches } from '@/data/branches';
import { pickText } from '@/lib/format';

export default async function BranchesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('branches');
  const l = locale as Locale;

  return (
    <section className="container-prose py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl text-brand-textmain mb-2">{t('title')}</h1>
        <p className="text-brand-textmuted">{t('subtitle')}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {branches.map(b => (
          <article key={b.code} className="card-soft">
            <div className="aspect-[16/7] mb-5 rounded-2xl bg-gradient-to-br from-brand-rose via-brand-cream to-brand-gold/40" />
            <h2 className="font-serif text-2xl text-brand-textmain mb-4">
              {pickText(b.name, l)}
            </h2>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-gold" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-0.5">
                    {t('address')}
                  </p>
                  <p className="text-brand-textmain">{pickText(b.address, l)}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-gold" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-0.5">
                    {t('phone')}
                  </p>
                  <a href={`tel:${b.phone}`} className="text-brand-textmain hover:text-brand-gold">
                    {b.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-gold" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-0.5">
                    {t('openHours')}
                  </p>
                  <p className="text-brand-textmain">
                    Mon–Sat 09:00 – 20:00 · Sun 10:00 – 19:00
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={{ pathname: '/booking', query: { branch: b.code } }}
                className="btn-primary !py-2 !px-5 !text-xs"
              >
                {t('bookHere')}
              </Link>
              <a
                href={b.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !py-2 !px-5 !text-xs"
              >
                {t('directions')}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
