'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

interface BranchOption {
  id: string;
  orgId: string;
  code: string;
  name: Record<string, string>;
  address: Record<string, string>;
  active: boolean;
}

const ACTIVE_KEY = 'kaori.activeBranch';

const SEED: BranchOption[] = [
  { id: 'nb-575', orgId: 'nb', code: 'nb-kim-ma-575',
    name: { vi: '575 Kim Mã' }, address: { vi: '575 Kim Mã, Ba Đình' }, active: true },
  { id: 'nb-625', orgId: 'nb', code: 'nb-kim-ma-625',
    name: { vi: '625 Kim Mã' }, address: { vi: '625 Kim Mã, Ba Đình' }, active: true }
];

export default function BranchSwitcher() {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>(SEED);
  const [active, setActive] = useState<BranchOption | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<BranchOption[]>('/v1/me/branches')
      .then(list => {
        if (cancelled) return;
        if (list.length > 0) setBranches(list);
        const stored = localStorage.getItem(ACTIVE_KEY);
        const found = list.find(b => b.id === stored) ?? list[0] ?? branches[0];
        setActive(found);
      })
      .catch(() => {
        const stored = localStorage.getItem(ACTIVE_KEY);
        const found = SEED.find(b => b.id === stored) ?? SEED[0];
        setActive(found);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (b: BranchOption) => {
    setActive(b);
    localStorage.setItem(ACTIVE_KEY, b.id);
    setOpen(false);
    // The simplest, safest way to re-fetch every screen with the new
    // branch context. App-state-aware refresh is a future improvement.
    window.location.reload();
  };

  if (loading || !active) {
    return <div className="hidden lg:flex items-center gap-2 rounded-full border border-brand-cream px-3 py-2 text-sm text-brand-textmuted">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="hidden lg:flex items-center gap-2 rounded-full border border-brand-cream px-3 py-2 text-sm hover:border-brand-gold transition"
      >
        <Building2 className="h-4 w-4 text-brand-gold" />
        <span className="text-brand-textmain truncate max-w-[160px]">{active.name.vi}</span>
        <ChevronDown className="h-4 w-4 text-brand-textmuted" />
      </button>

      {open && (
        <ul className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft z-50">
          <li className="px-4 py-2 text-[10px] uppercase tracking-widest text-brand-textmuted bg-brand-cream/30 border-b border-brand-cream">
            Chọn chi nhánh
          </li>
          {branches.map(b => (
            <li key={b.id}>
              <button
                onClick={() => pick(b)}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm hover:bg-brand-cream/40 flex items-center justify-between gap-3',
                  active.id === b.id && 'bg-brand-gold/10'
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-textmain truncate">{b.name.vi}</p>
                  <p className="text-xs text-brand-textmuted truncate">{b.address.vi}</p>
                </div>
                {active.id === b.id && <Check className="h-4 w-4 text-brand-gold flex-shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
