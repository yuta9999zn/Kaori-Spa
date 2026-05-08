'use client';

import { Calendar, LayoutDashboard, Menu, Plus, Users } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * Bottom navigation for mobile (≤lg breakpoint). Shows the 5 most-used
 * actions for a receptionist: dashboard, today's bookings, quick-create,
 * customers, full menu drawer.
 *
 * The center "+" button is the primary action — opens new booking flow.
 */
export default function MobileBottomBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const items: Array<{ href: string; key: string; Icon: typeof LayoutDashboard; label: string }> = [
    { href: '/',          key: 'home',      Icon: LayoutDashboard, label: 'Trang chủ' },
    { href: '/booking',   key: 'booking',   Icon: Calendar,        label: 'Booking' },
    { href: '/booking/new', key: 'new',     Icon: Plus,            label: 'Tạo mới' },
    { href: '/customer',  key: 'customer',  Icon: Users,           label: 'Khách' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-brand-cream bg-white/95 backdrop-blur safe-area">
      <ul className="grid grid-cols-5 h-16">
        {items.map(({ href, key, Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          const isPrimary = key === 'new';
          return (
            <li key={key}>
              <Link
                href={href as '/' | '/booking' | '/booking/new' | '/customer'}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-full text-[10px]',
                  active ? 'text-brand-gold' : 'text-brand-textmuted'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center',
                  isPrimary && 'h-10 w-10 rounded-full bg-brand-gold text-white shadow-lg -mt-3'
                )}>
                  <Icon className={isPrimary ? 'h-5 w-5' : 'h-5 w-5'} />
                </span>
                {!isPrimary && <span className="truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            onClick={onOpenMenu}
            className="flex flex-col items-center justify-center gap-1 h-full text-[10px] text-brand-textmuted w-full"
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </li>
      </ul>
      <style jsx>{`
        .safe-area { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </nav>
  );
}
