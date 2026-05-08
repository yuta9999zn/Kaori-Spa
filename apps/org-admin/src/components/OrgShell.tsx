'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Building2, Users, ShieldCheck, Sparkles,
  FileText, BarChart3, Settings, LogOut, Flower2, Menu, X
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';
import { logout, useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';

type NavKey = 'dashboard' | 'branch' | 'member' | 'role' | 'service' | 'content' | 'report' | 'settings';

const NAV: Array<{ href: string; key: NavKey; Icon: typeof LayoutDashboard }> = [
  { href: '/', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/branch', key: 'branch', Icon: Building2 },
  { href: '/member', key: 'member', Icon: Users },
  { href: '/role', key: 'role', Icon: ShieldCheck },
  { href: '/service', key: 'service', Icon: Sparkles },
  { href: '/content', key: 'content', Icon: FileText },
  { href: '/report', key: 'report', Icon: BarChart3 },
  { href: '/settings', key: 'settings', Icon: Settings }
];

export default function OrgShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const tPortal = useTranslations('portal');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const allowedRoles = (n: { roles?: string[] }) =>
    !n.roles || (user?.roles ?? []).some(r => n.roles!.includes(r));

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-brand-cream">
        <Flower2 className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
        <div className="leading-none">
          <div className="font-serif text-base tracking-[0.18em]">{tBrand('tenant').toUpperCase()}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-brand-textmuted mt-1">{tPortal('subtitle')}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, key, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={key}>
                <Link href={href as '/' | '/branch' | '/member' | '/role' | '/service' | '/content' | '/report' | '/settings'}
                  onClick={onNavigate}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    active ? 'bg-brand-gold/10 text-brand-gold font-medium' : 'text-brand-textmuted hover:bg-brand-cream/40 hover:text-brand-textmain')}>
                  <Icon className="h-4 w-4" /> {t(key)}
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
          <LogOut className="h-4 w-4" /> {t('logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-brand-ivory">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-brand-cream bg-white">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-brand-cream"><Sidebar onNavigate={() => setOpen(false)} /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-brand-cream bg-white/85 backdrop-blur">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button onClick={() => setOpen(o => !o)} className="lg:hidden rounded-full border border-brand-cream p-2">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3 ml-auto"><LocaleSwitcher /></div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
