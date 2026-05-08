'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flower2, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';
import { cn } from '@/lib/cn';

const NAV: Array<{ href: '/' | '/services' | '/branches' | '/booking' | '/about' | '/contact'; key: 'home' | 'services' | 'branches' | 'booking' | 'about' | 'contact' }> = [
  { href: '/', key: 'home' },
  { href: '/services', key: 'services' },
  { href: '/branches', key: 'branches' },
  { href: '/booking', key: 'booking' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' }
];

export default function Header() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-cream/60 bg-brand-ivory/85 backdrop-blur">
      <div className="container-prose flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Flower2 className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-base tracking-[0.2em] text-brand-textmain">
              {tBrand('tenant').toUpperCase()}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-brand-textmuted">
              on {tBrand('platform')}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'transition',
                  active
                    ? 'text-brand-gold'
                    : 'text-brand-textmuted hover:text-brand-textmain'
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/booking" className="btn-primary !py-2 !px-5 !text-xs">
            {t('booking')}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="md:hidden rounded-full border border-brand-cream p-2 text-brand-textmain"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-brand-cream/60 bg-white">
          <div className="container-prose py-4 flex flex-col gap-3">
            {NAV.map(item => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-brand-textmain"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="pt-2 border-t border-brand-cream/60 flex items-center justify-between">
              <LocaleSwitcher />
              <Link href="/booking" className="btn-primary !py-2 !px-4 !text-xs" onClick={() => setOpen(false)}>
                {t('booking')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
