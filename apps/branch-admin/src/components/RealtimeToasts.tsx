'use client';

import { useEffect, useState } from 'react';
import { Bell, Calendar, X, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeRooms, defaultBranchRooms } from '@/lib/realtime';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';

interface Toast {
  id: number;
  title: string;
  body: string;
  kind: 'booking' | 'payment' | 'info';
}

let nextId = 1;

export default function RealtimeToasts() {
  const { isAuthed } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { connected, subscribe } = useRealtimeRooms(isAuthed ? defaultBranchRooms() : []);

  useEffect(() => {
    if (!isAuthed) return;
    const off = subscribe((e) => {
      const p = e.payload as Record<string, unknown> | string;
      if (typeof p === 'string') return;

      // Match booking events.
      if (e.topic === 'kaori.booking.created.v1' || (typeof p.bookingId === 'string')) {
        push({
          kind: 'booking',
          title: 'Booking mới',
          body: `${(p.customer as string) ?? 'Khách'} · ${(p.code as string) ?? ''}`
        });
      } else if (e.topic === 'kaori.payment.completed.v1') {
        push({
          kind: 'payment',
          title: 'Thanh toán',
          body: `${(p.amount as string) ?? ''} VND`
        });
      }
    });
    return off;
  }, [isAuthed, subscribe]);

  const push = (t: Omit<Toast, 'id'>) => {
    const id = nextId++;
    setToasts(s => [{ id, ...t }, ...s].slice(0, 4));
    setTimeout(() => dismiss(id), 6000);
  };
  const dismiss = (id: number) => setToasts(s => s.filter(t => t.id !== id));

  if (!isAuthed) return null;

  return (
    <>
      {/* Connection indicator */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest shadow-soft transition',
          connected
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 bg-white text-slate-500'
        )}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? 'Realtime' : 'Offline'}
        </div>
      </div>

      {/* Toast stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div
            key={t.id}
            className="rounded-2xl border border-brand-cream bg-white shadow-soft p-3 flex items-start gap-3 animate-[slideIn_0.2s_ease-out]"
          >
            <span className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0',
              t.kind === 'booking' ? 'bg-brand-gold/15 text-brand-gold' :
              t.kind === 'payment' ? 'bg-emerald-100 text-emerald-700' :
              'bg-slate-100 text-slate-700'
            )}>
              {t.kind === 'booking' ? <Calendar className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-brand-textmain">{t.title}</p>
              <p className="text-xs text-brand-textmuted truncate">{t.body}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-brand-textmuted hover:text-brand-textmain">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
