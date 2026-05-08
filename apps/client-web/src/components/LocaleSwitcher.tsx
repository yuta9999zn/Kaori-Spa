'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { locales, localeLabels, type Locale, usePathname, useRouter } from '@/i18n/routing';
import { useState, useRef, useEffect } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const change = (next: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
      setOpen(false);
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Language"
        disabled={isPending}
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-brand-cream px-3 py-2 text-sm text-brand-textmuted transition hover:border-brand-gold hover:text-brand-gold disabled:opacity-50"
      >
        <Globe className="h-4 w-4" />
        <span>{localeLabels[locale].flag}</span>
        <span className="uppercase tracking-wider text-xs">{locale}</span>
      </button>

      {open && (
        <ul className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
          {locales.map(l => (
            <li key={l}>
              <button
                type="button"
                onClick={() => change(l)}
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-brand-cream/40"
              >
                <span className="flex items-center gap-2">
                  <span>{localeLabels[l].flag}</span>
                  <span>{localeLabels[l].native}</span>
                </span>
                {l === locale && <Check className="h-4 w-4 text-brand-gold" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
