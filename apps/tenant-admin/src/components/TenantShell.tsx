'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Building, Package, CreditCard, Globe, ScrollText,
  Plug, Sparkles, Settings, LogOut, ShieldCheck, Menu, X, Users, Palette
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';
import { logout } from '@/lib/auth';
import { cn } from '@/lib/cn';

type NavKey = 'dashboard' | 'tenant' | 'members' | 'plan' | 'billing' | 'domain' | 'audit' | 'integration' | 'feature' | 'branding' | 'settings';

const NAV: Array<{ href: string; key: NavKey; Icon: typeof LayoutDashboard }> = [
  { href: '/', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/tenant', key: 'tenant', Icon: Building },
  { href: '/members', key: 'members', Icon: Users },
  { href: '/plan', key: 'plan', Icon: Package },
  { href: '/billing', key: 'billing', Icon: CreditCard },
  { href: '/domain', key: 'domain', Icon: Globe },
  { href: '/audit', key: 'audit', Icon: ScrollText },
  { href: '/integration', key: 'integration', Icon: Plug },
  { href: '/feature', key: 'feature', Icon: Sparkles },
  { href: '/branding', key: 'branding', Icon: Palette },
  { href: '/settings', key: 'settings', Icon: Settings }
];

export default function TenantShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const tPortal = useTranslations('portal');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-brand-cream bg-gradient-to-br from-brand-textmain to-[#6B6460] text-white">
        <ShieldCheck className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
        <div className="leading-none">
          <div className="font-serif text-base tracking-[0.18em]">{tBrand('platform').toUpperCase()}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-1">{tPortal('subtitle')}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, key, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={key}>
                <Link href={href as '/' | '/tenant' | '/members' | '/plan' | '/billing' | '/domain' | '/audit' | '/integration' | '/feature' | '/branding' | '/settings'}
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
            <div className="ml-auto"><LocaleSwitcher /></div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
