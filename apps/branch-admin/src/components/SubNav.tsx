'use client';

import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/cn';

export interface SubNavItem {
  href: string;
  label: string;
}

export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname();

  // Active = href is the longest matching prefix of pathname among siblings.
  // Without this, the parent route (e.g. /booking) would also light up on
  // /booking/calendar because /booking is a prefix of every subpath.
  const activeHref = items
    .filter(it => pathname === it.href || pathname.startsWith(it.href + '/'))
    .reduce<string | null>((best, it) => (best && best.length >= it.href.length ? best : it.href), null);

  return (
    <nav className="mb-6 -mx-1 flex gap-1 overflow-x-auto border-b border-brand-cream pb-px">
      {items.map(it => {
        const active = it.href === activeHref;
        return (
          <Link
            key={it.href}
            href={it.href as never}
            className={cn(
              'whitespace-nowrap rounded-t-lg px-4 py-2 text-sm transition border-b-2 -mb-px',
              active
                ? 'border-brand-gold text-brand-gold font-medium bg-brand-cream/30'
                : 'border-transparent text-brand-textmuted hover:text-brand-textmain hover:bg-brand-cream/20'
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
