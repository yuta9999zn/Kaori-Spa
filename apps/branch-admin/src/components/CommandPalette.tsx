'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, Loader2, Search, Sparkles, User, X } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { api, ctx, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Hit {
  kind: 'customer' | 'booking' | 'service';
  id: string;
  label: string;
  secondary: string;
  href: string;
}

const KIND_ICON: Record<Hit['kind'], typeof User> = {
  customer: User,
  booking:  Calendar,
  service:  Sparkles
};

const KIND_LABEL: Record<Hit['kind'], string> = {
  customer: 'Khách hàng',
  booking:  'Booking',
  service:  'Dịch vụ'
};

/**
 * cmd/ctrl-K palette accessible from the header search button. On mobile,
 * acts as a full-screen sheet instead of a modal so the on-screen keyboard
 * doesn't push the input out of view.
 */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(''); setHits([]); setError(null); setActiveIdx(0); }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) { setHits([]); setError(null); return; }
    const id = setTimeout(async () => {
      setBusy(true); setError(null);
      try {
        const params = new URLSearchParams({
          tenantId: ctx.tenantId, branchId: ctx.branchId, q: q.trim()
        });
        const r = await api<Hit[]>(`/v1/search?${params}`);
        setHits(r);
        setActiveIdx(0);
      } catch (e) {
        setError((e as ApiError).message);
        setHits([]);
      } finally { setBusy(false); }
    }, 220);
    return () => clearTimeout(id);
  }, [q, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')           onClose();
    else if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(hits.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter')      {
      const hit = hits[activeIdx];
      if (hit) navigate(hit);
    }
  };

  const navigate = (hit: Hit) => {
    onClose();
    router.push(hit.href as '/');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 sm:pt-24 pt-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-none sm:rounded-2xl shadow-premium border border-brand-cream overflow-hidden h-screen sm:h-auto sm:max-h-[60vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-cream bg-brand-cream/30">
          <Search className="h-5 w-5 text-brand-textmuted flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm khách hàng, booking, dịch vụ…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-brand-textmuted"
          />
          {busy && <Loader2 className="h-4 w-4 animate-spin text-brand-textmuted" />}
          <button onClick={onClose} className="text-brand-textmuted hover:text-brand-textmain">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && <p className="p-4 text-sm text-rose-600">{error}</p>}
          {!busy && q.trim().length >= 2 && hits.length === 0 && (
            <p className="p-8 text-center text-sm text-brand-textmuted">Không có kết quả</p>
          )}
          {q.trim().length < 2 && (
            <p className="p-8 text-center text-xs text-brand-textmuted">
              Gõ ít nhất 2 ký tự<br/>
              <kbd className="font-mono bg-brand-cream/50 px-1.5 py-0.5 rounded text-[10px] mt-2 inline-block">↑↓</kbd>{' '}
              di chuyển,{' '}
              <kbd className="font-mono bg-brand-cream/50 px-1.5 py-0.5 rounded text-[10px]">Enter</kbd>{' '}
              chọn
            </p>
          )}
          <ul>
            {hits.map((hit, i) => {
              const Icon = KIND_ICON[hit.kind];
              return (
                <li key={hit.kind + hit.id}>
                  <button
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => navigate(hit)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition',
                      i === activeIdx ? 'bg-brand-gold/10' : 'hover:bg-brand-cream/30'
                    )}
                  >
                    <span className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0',
                      hit.kind === 'customer' ? 'bg-blue-100 text-blue-700' :
                      hit.kind === 'booking'  ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                    )}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{hit.label}</p>
                      <p className="text-xs text-brand-textmuted truncate">{hit.secondary}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                      {KIND_LABEL[hit.kind]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
