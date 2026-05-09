'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
  Settings,
  XCircle
} from 'lucide-react';
import {
  markAllRead,
  markRead,
  useNotifications,
  useUnreadCount,
  type NotificationDto
} from '@/lib/hooks';
import { cn } from '@/lib/cn';

type Tab = 'all' | 'unread';

const SEVERITY_STYLE: Record<NotificationDto['severity'], { badge: string; icon: typeof Info }> = {
  info:    { badge: 'bg-blue-50 text-blue-700 ring-blue-200',       icon: Info },
  warning: { badge: 'bg-amber-50 text-amber-700 ring-amber-200',    icon: AlertTriangle },
  error:   { badge: 'bg-rose-50 text-rose-700 ring-rose-200',       icon: XCircle },
  success: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 }
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

export default function NotificationView() {
  const t = useTranslations('notification');
  const [tab, setTab] = useState<Tab>('all');

  const list = useNotifications({ unreadOnly: tab === 'unread', size: 50 });
  const unread = useUnreadCount();

  const items = useMemo<NotificationDto[]>(() => list.data?.items ?? [], [list.data]);
  const unreadCount = unread.data?.count ?? 0;

  const onMarkRead = async (n: NotificationDto) => {
    if (n.readAt) return;
    try {
      await markRead(n.id);
      await Promise.all([list.refetch(), unread.refetch()]);
    } catch {
      /* swallow — UI stays stable */
    }
  };

  const onRowClick = async (n: NotificationDto) => {
    if (!n.readAt) await onMarkRead(n);
    if (n.link && typeof window !== 'undefined') {
      window.location.href = n.link;
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllRead();
      await Promise.all([list.refetch(), unread.refetch()]);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Bell className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-gold mt-1">
            {t('unreadCount', { count: unreadCount })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMarkAll}
            disabled={unreadCount === 0}
            className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck className="h-4 w-4" /> {t('markAllRead')}
          </button>
          <button type="button" className="btn-ghost">
            <Settings className="h-4 w-4" /> {t('settings')}
          </button>
        </div>
      </header>

      <section className="kpi-card mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setTab(f)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition',
                tab === f
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-goldhover'
                  : 'border-brand-cream bg-white text-brand-textmuted hover:border-brand-gold/60'
              )}
            >
              {f === 'all' ? t('filters.all') : t('onlyUnread')}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-gold/20 px-1 text-[10px] font-medium text-brand-goldhover">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="kpi-card">
        {list.loading && items.length === 0 ? (
          <div className="py-10 text-center text-brand-textmuted">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : list.error ? (
          <p className="text-center text-sm text-rose-600 py-8">
            {list.error.message || 'API offline'}
          </p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-brand-textmuted py-8">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-brand-cream/60">
            {items.map(n => {
              const isUnread = n.readAt == null;
              const style = SEVERITY_STYLE[n.severity] ?? SEVERITY_STYLE.info;
              const Icon = style.icon;
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 py-3 px-3 -mx-3 rounded-lg cursor-pointer transition',
                    isUnread ? 'bg-brand-gold/5 hover:bg-brand-gold/10' : 'hover:bg-brand-cream/30'
                  )}
                  onClick={() => void onRowClick(n)}
                >
                  <div
                    className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ring-1',
                      style.badge
                    )}
                    aria-label={n.severity}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-brand-textmain">
                        {n.title}
                        {isUnread && (
                          <span className="inline-block ml-2 h-1.5 w-1.5 rounded-full bg-brand-gold align-middle" />
                        )}
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-brand-textmuted">
                          {n.type}
                        </span>
                      </p>
                      <span className="text-[11px] text-brand-textmuted shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-xs text-brand-textmuted mt-1 whitespace-pre-line">
                        {n.body}
                      </p>
                    )}
                  </div>
                  {isUnread && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); void onMarkRead(n); }}
                      className="text-[11px] text-brand-gold hover:underline shrink-0 inline-flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> {t('markRead')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
