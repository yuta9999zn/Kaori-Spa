'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { locales, localeLabels, type Locale, usePathname, useRouter } from '@/i18n/routing';

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={pending} onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-brand-cream px-3 py-1.5 text-xs hover:border-brand-gold disabled:opacity-50">
        <Globe className="h-4 w-4" /> <span>{localeLabels[locale].flag}</span>
        <span className="uppercase tracking-wider">{locale}</span>
      </button>
      {open && (
        <ul className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft z-50">
          {locales.map(l => (
            <li key={l}>
              <button onClick={() => start(() => { router.replace(pathname, { locale: l }); setOpen(false); })}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-brand-cream/40">
                <span className="flex items-center gap-2"><span>{localeLabels[l].flag}</span><span>{localeLabels[l].native}</span></span>
                {l === locale && <Check className="h-4 w-4 text-brand-gold" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
