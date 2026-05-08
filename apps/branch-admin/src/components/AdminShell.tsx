'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { logout, useAuth } from '@/lib/auth';
import { useRouter } from '@/i18n/routing';
import RealtimeToasts from './RealtimeToasts';
import BranchSwitcher from './BranchSwitcher';
import InboxBell from './InboxBell';
import MobileBottomBar from './MobileBottomBar';
import SearchTrigger from './SearchTrigger';
import {
  LayoutDashboard, Calendar, UserCheck, Users, Sparkles,
  UserCog, DoorOpen, Boxes, BarChart3, Bell, FileText,
  Settings, LogOut, Flower2, Menu, X, ChevronDown,
  CalendarDays, Clock, Wallet, CalendarRange
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';
import { cn } from '@/lib/cn';

type NavKey = 'dashboard' | 'booking' | 'calendar' | 'checkin' | 'customer' | 'service' | 'staff' | 'shift' | 'attendance' | 'payroll' | 'room' | 'inventory' | 'report' | 'notification' | 'content' | 'settings';

/**
 * Per-route role gate. Empty array = visible to any authenticated user.
 * Reused by AccessGate for in-page protection. Roles match the JWT `roles`
 * claim (BRANCH_MANAGER / RECEPTIONIST / THERAPIST / ACCOUNTANT / …).
 */
const NAV: Array<{ href: string; key: NavKey; Icon: typeof LayoutDashboard; roles?: string[] }> = [
  { href: '/', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/booking', key: 'booking', Icon: Calendar,
    roles: ['BRANCH_MANAGER','RECEPTIONIST','THERAPIST'] },
  { href: '/booking/calendar', key: 'calendar', Icon: CalendarRange,
    roles: ['BRANCH_MANAGER','RECEPTIONIST','THERAPIST'] },
  { href: '/checkin', key: 'checkin', Icon: UserCheck,
    roles: ['BRANCH_MANAGER','RECEPTIONIST'] },
  { href: '/customer', key: 'customer', Icon: Users,
    roles: ['BRANCH_MANAGER','RECEPTIONIST','THERAPIST','ACCOUNTANT'] },
  { href: '/service', key: 'service', Icon: Sparkles,
    roles: ['BRANCH_MANAGER','RECEPTIONIST','THERAPIST'] },
  { href: '/staff', key: 'staff', Icon: UserCog,
    roles: ['BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER'] },
  { href: '/staff/shifts', key: 'shift', Icon: CalendarDays,
    roles: ['BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER'] },
  { href: '/staff/attendance', key: 'attendance', Icon: Clock,
    roles: ['BRANCH_MANAGER','RECEPTIONIST','THERAPIST'] },
  { href: '/staff/payroll', key: 'payroll', Icon: Wallet,
    roles: ['BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','ACCOUNTANT'] },
  { href: '/room', key: 'room', Icon: DoorOpen,
    roles: ['BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER'] },
  { href: '/inventory', key: 'inventory', Icon: Boxes,
    roles: ['BRANCH_MANAGER','RECEPTIONIST'] },
  { href: '/report', key: 'report', Icon: BarChart3,
    roles: ['BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','ACCOUNTANT'] },
  { href: '/notification', key: 'notification', Icon: Bell },
  { href: '/content', key: 'content', Icon: FileText,
    roles: ['BRANCH_MANAGER','MARKETING'] },
  { href: '/settings', key: 'settings', Icon: Settings,
    roles: ['BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER'] }
];

export const NAV_PERMISSIONS = NAV.reduce<Record<string, string[] | undefined>>(
  (acc, n) => { acc[n.href] = n.roles; return acc; },
  {}
);

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const tPortal = useTranslations('portal');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-ivory">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-brand-cream bg-white">
        <SidebarContent currentPath={pathname} />
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-brand-cream">
            <SidebarContent currentPath={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <a href="#main" className="skip-link">Đến nội dung chính</a>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-brand-cream bg-white/85 backdrop-blur">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="lg:hidden rounded-full border border-brand-cream p-2"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex-1 lg:flex-initial lg:hidden flex items-center gap-2 ml-3">
              <Flower2 className="h-5 w-5 text-brand-gold" strokeWidth={1.5} />
              <span className="font-serif tracking-widest text-sm">{tBrand('tenant').toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <SearchTrigger />
              <BranchSwitcher />
              <InboxBell />
              <LocaleSwitcher />
              {user && (
                <div className="hidden lg:flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-sm font-medium text-brand-gold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 p-4 lg:p-8 pb-bottom-bar" tabIndex={-1}>{children}</main>
        <RealtimeToasts />
        <MobileBottomBar onOpenMenu={() => setOpen(true)} />
      </div>
    </div>
  );

  function SidebarContent({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
    return (
      <>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-brand-cream">
          <Flower2 className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-base tracking-[0.18em]">
              {tBrand('tenant').toUpperCase()}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-brand-textmuted mt-0.5">
              {tPortal('subtitle')}
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5">
            {NAV
              .filter(n => !n.roles || (user?.roles ?? []).some(r => n.roles!.includes(r)))
              .map(({ href, key, Icon }) => {
              const active = currentPath === href || (href !== '/' && currentPath.startsWith(href));
              return (
                <li key={key}>
                  <Link
                    href={href as '/' | '/booking' | '/checkin' | '/customer' | '/service' | '/staff' | '/room' | '/inventory' | '/report' | '/notification' | '/content' | '/settings'}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                      active
                        ? 'bg-brand-gold/10 text-brand-gold font-medium'
                        : 'text-brand-textmuted hover:bg-brand-cream/40 hover:text-brand-textmain'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-brand-cream p-3">
          <button
            onClick={async () => { await logout(); router.replace('/login'); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-textmuted hover:bg-brand-cream/40"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </>
    );
  }
}
