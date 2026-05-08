'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, Plug, Plus, Power, ChevronRight, Check, X, Clock
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useWebhooks, toggleWebhook } from '@/lib/hooks';

interface DeliveryRow {
  id: string;
  topic: string;
  status: 'pending' | 'succeeded' | 'failed' | 'retrying';
  attempt: number;
  lastStatusCode: number | null;
  createdAt: string;
  deliveredAt: string | null;
}

const STATUS_BG: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  retrying:  'bg-amber-100 text-amber-700',
  succeeded: 'bg-emerald-100 text-emerald-700',
  failed:    'bg-rose-100 text-rose-700'
};

export default function IntegrationView() {
  const t = useTranslations('integration');
  const { data, error, loading, refetch } = useWebhooks();
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onToggle = async (id: string) => {
    setBusyId(id);
    try {
      await toggleWebhook(id);
      await refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
            <Plug className="h-6 w-6 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
        </div>
        {/* TODO(M3+): wire create-webhook modal once the Add flow is
            specified — for now keep the affordance but mark it disabled. */}
        <button
          disabled
          title={t('actions.addDisabledHint')}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> {t('actions.add')}
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {t('errors.load')} ({error.message})
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" />
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="text-sm text-brand-textmuted text-center py-8">{t('empty')}</p>
      ) : (
        <ul className="space-y-3">
          {data!.map(w => (
            <li key={w.id} className={cn('card-soft', !w.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{w.name}</h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest',
                      w.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500')}>
                      {w.active ? t('status.active') : t('status.paused')}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-brand-textmuted truncate">{w.targetUrl}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.eventFilters.map(f => (
                      <span key={f} className="rounded-full bg-brand-cream/60 px-2 py-0.5 text-[10px] font-mono">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onToggle(w.id)}
                    disabled={busyId === w.id}
                    className="text-brand-textmuted hover:text-brand-gold p-1.5 disabled:opacity-50"
                    aria-label={t('actions.toggle')}
                  >
                    {busyId === w.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Power className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setDrawerId(drawerId === w.id ? null : w.id)}
                    className="text-brand-textmuted hover:text-brand-gold p-1.5"
                    aria-label="Inspect"
                  >
                    <ChevronRight className={cn('h-4 w-4 transition-transform',
                      drawerId === w.id && 'rotate-90')} />
                  </button>
                </div>
              </div>

              {drawerId === w.id && <DeliveriesDrawer webhookId={w.id} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DeliveriesDrawer({ webhookId }: { webhookId: string }) {
  const t = useTranslations('integration');
  const [rows, setRows] = useState<DeliveryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<DeliveryRow[]>(`/v1/webhooks/${webhookId}/deliveries`)
      .then(r => { if (!cancelled) setRows(r); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, [webhookId]);

  return (
    <div className="mt-3 pt-3 border-t border-brand-cream/60">
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">
        {t('deliveries.title')}
      </p>
      {rows === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-textmuted" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-brand-textmuted">{t('deliveries.empty')}</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {rows.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {d.status === 'succeeded' && <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" />}
                {d.status === 'failed'    && <X className="h-3 w-3 text-rose-600 flex-shrink-0" />}
                {(d.status === 'pending' || d.status === 'retrying') && (
                  <Clock className="h-3 w-3 text-amber-600 flex-shrink-0" />
                )}
                <span className="font-mono truncate">{d.topic}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-textmuted whitespace-nowrap">
                <span>#{d.attempt}</span>
                {d.lastStatusCode != null && <span className="font-mono">{d.lastStatusCode}</span>}
                <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-widest', STATUS_BG[d.status])}>
                  {d.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
