'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface NotifItem {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  severity: 'info' | 'warn' | 'danger' | 'success';
  deepLink: string | null;
  createdAt: string;
  unread: boolean;
}

interface InboxRes { items: NotifItem[]; total: number; unread: number; }

const SEVERITY_BG: Record<string, string> = {
  info:    'bg-blue-100 text-blue-700',
  warn:    'bg-amber-100 text-amber-700',
  danger:  'bg-rose-100 text-rose-700',
  success: 'bg-emerald-100 text-emerald-700'
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function InboxBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Poll unread count every 60s; replaced by realtime push later.
  const fetchInbox = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<InboxRes>('/v1/notifications?size=20');
      setItems(res.items);
      setUnread(res.unread);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInbox();
    const id = setInterval(fetchInbox, 60_000);
    return () => clearInterval(id);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api(`/v1/notifications/${id}/read`, { method: 'POST' });
      setItems(s => s.map(n => n.id === id ? { ...n, unread: false } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch { /* ignore */ }
  };

  const markAll = async () => {
    try {
      await api('/v1/notifications/read-all', { method: 'POST' });
      setItems(s => s.map(n => ({ ...n, unread: false })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative rounded-full border border-brand-cream p-2 hover:border-brand-gold transition"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-brand-textmuted" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft z-50">
          <header className="flex items-center justify-between px-4 py-3 border-b border-brand-cream bg-brand-cream/30">
            <h3 className="font-serif text-sm tracking-widest text-brand-textmain">THÔNG BÁO</h3>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs text-brand-gold hover:underline">
                <CheckCheck className="h-3 w-3" /> Đánh dấu đã đọc
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-brand-textmuted">
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="p-8 text-center text-sm text-brand-textmuted">
                {error ? 'API offline — chưa có thông báo' : 'Không có thông báo'}
              </p>
            ) : (
              <ul className="divide-y divide-brand-cream/60">
                {items.map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => { markRead(n.id); if (n.deepLink) window.location.href = n.deepLink; }}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-cream/30',
                        n.unread && 'bg-brand-gold/5'
                      )}
                    >
                      <span className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 text-[10px] font-medium uppercase',
                        SEVERITY_BG[n.severity]
                      )}>
                        {n.kind.split('.')[1]?.charAt(0).toUpperCase() ?? 'N'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cn('text-sm truncate', n.unread ? 'font-medium' : 'text-brand-textmuted')}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-brand-textmuted whitespace-nowrap">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        {n.body && <p className="text-xs text-brand-textmuted truncate mt-0.5">{n.body}</p>}
                      </div>
                      {n.unread && (
                        <Check className="h-3 w-3 text-brand-gold flex-shrink-0 mt-1" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
