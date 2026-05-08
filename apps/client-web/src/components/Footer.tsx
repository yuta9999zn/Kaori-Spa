import { useTranslations } from 'next-intl';
import { Flower2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function Footer() {
  const t = useTranslations('footer');
  const tBrand = useTranslations('brand');

  return (
    <footer className="mt-20 border-t border-brand-cream/60 bg-white">
      <div className="container-prose py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flower2 className="h-5 w-5 text-brand-gold" strokeWidth={1.5} />
            <span className="font-serif tracking-[0.2em] text-brand-textmain">
              {tBrand('tenant').toUpperCase()}
            </span>
          </div>
          <p className="text-brand-textmuted leading-relaxed">{tBrand('tagline')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/services" className="text-brand-textmuted hover:text-brand-gold">
            {t('policy')}
          </Link>
          <Link href="/about" className="text-brand-textmuted hover:text-brand-gold">
            {t('terms')}
          </Link>
          <Link href="/contact" className="text-brand-textmuted hover:text-brand-gold">
            {t('support')}
          </Link>
        </div>

        <div className="text-brand-textmuted">
          <p>{t('rights')}</p>
        </div>
      </div>
    </footer>
  );
}
