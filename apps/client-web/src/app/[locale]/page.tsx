import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Sparkles, ShieldCheck, BadgeDollarSign, ArrowRight, Star } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { branches } from '@/data/branches';
import { services } from '@/data/services';
import { tenant } from '@/data/tenant';
import type { Locale } from '@/i18n/routing';
import { pickText, formatPrice } from '@/lib/format';
import StructuredData from '@/components/StructuredData';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent locale={locale as Locale} />;
}

function HomeContent({ locale }: { locale: Locale }) {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');
  const tBranches = useTranslations('branches');
  const tServices = useTranslations('services');

  const featured = [
    services.find(s => s.code === 'female_combo10_full_body'),
    services.find(s => s.code === 'female_vio_combo'),
    services.find(s => s.code === 'beauty_set_3_vip'),
    services.find(s => s.code === 'male_combo10_face')
  ].filter(Boolean) as typeof services;

  return (
    <>
      <StructuredData locale={locale} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-ivory via-brand-cream to-brand-lavender/40" />
        <div className="container-prose relative grid gap-12 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-light tracking-[0.3em] text-brand-gold uppercase mb-4">
              {t('heroEyebrow')}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight text-brand-textmain mb-5">
              {t('heroTitle')}
            </h1>
            <p className="text-brand-textmuted leading-relaxed mb-8 max-w-lg">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/booking" className="btn-primary">
                {t('ctaBook')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className="btn-ghost">
                {t('ctaServices')}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4 text-xs text-brand-textmuted">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-brand-gold text-brand-gold" /> 4.9 / 5
              </span>
              <span>·</span>
              <span>{tenant.hotline}</span>
              <span>·</span>
              <span>{branches.length} {tNav('branches').toLowerCase()}</span>
            </div>
          </div>

          <div className="relative hidden md:flex items-center justify-center">
            <div className="aspect-[4/5] w-full max-w-md rounded-[3rem] bg-gradient-to-br from-brand-rose via-brand-cream to-brand-gold/40 shadow-premium" />
            <div className="absolute -bottom-6 -left-6 card-soft w-60">
              <p className="text-xs uppercase tracking-widest text-brand-gold mb-1">
                {tServices('filterCombo')}
              </p>
              <p className="font-serif text-lg leading-tight text-brand-textmain">
                {pickText(services.find(s => s.code === 'female_vio_combo')!.name, locale)}
              </p>
              <p className="mt-2 text-sm text-brand-textmuted">
                {formatPrice(600000, locale)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container-prose py-16">
        <h2 className="font-serif text-3xl text-center text-brand-textmain mb-12">
          {t('highlightsTitle')}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Sparkles, key: 'highlight1' },
            { icon: ShieldCheck, key: 'highlight2' },
            { icon: BadgeDollarSign, key: 'highlight3' }
          ].map(({ icon: Icon, key }) => (
            <article key={key} className="card-soft text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-brand-textmain mb-2">
                {t(`${key}.title` as 'highlight1.title')}
              </h3>
              <p className="text-sm text-brand-textmuted leading-relaxed">
                {t(`${key}.desc` as 'highlight1.desc')}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Featured services */}
      <section className="bg-white py-16">
        <div className="container-prose">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif text-3xl text-brand-textmain">{tServices('title')}</h2>
            <Link
              href="/services"
              className="text-sm text-brand-gold hover:underline inline-flex items-center gap-1"
            >
              {tServices('title')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {featured.map(s => (
              <Link
                key={s.code}
                href={{ pathname: '/booking', query: { service: s.code } }}
                className="card-soft group block transition hover:border-brand-gold/60"
              >
                <p className="text-[10px] uppercase tracking-widest text-brand-gold mb-2">
                  {s.isCombo ? tServices('filterCombo') : tServices(`filter${s.gender === 'unisex' ? 'Unisex' : s.gender === 'male' ? 'Men' : 'Women'}` as 'filterAll')}
                </p>
                <h3 className="font-serif text-lg leading-tight text-brand-textmain mb-3 min-h-[3rem]">
                  {pickText(s.name, locale)}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-brand-textmuted text-xs">
                    {tServices('duration', { minutes: s.durationMin })}
                  </span>
                  <span className="font-medium text-brand-gold">
                    {formatPrice(s.basePrice, locale)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Branches preview */}
      <section className="container-prose py-16">
        <h2 className="font-serif text-3xl text-brand-textmain mb-2">{tBranches('title')}</h2>
        <p className="text-brand-textmuted mb-10">{tBranches('subtitle')}</p>
        <div className="grid gap-5 md:grid-cols-2">
          {branches.map(b => (
            <article key={b.code} className="card-soft flex flex-col gap-3">
              <h3 className="font-serif text-xl text-brand-textmain">{pickText(b.name, locale)}</h3>
              <p className="text-sm text-brand-textmuted">{pickText(b.address, locale)}</p>
              <p className="text-sm text-brand-textmuted">{tBranches('phone')}: {b.phone}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={{ pathname: '/booking', query: { branch: b.code } }}
                  className="btn-primary !py-2 !px-4 !text-xs"
                >
                  {tBranches('bookHere')}
                </Link>
                <a
                  href={b.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost !py-2 !px-4 !text-xs"
                >
                  {tBranches('directions')}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
