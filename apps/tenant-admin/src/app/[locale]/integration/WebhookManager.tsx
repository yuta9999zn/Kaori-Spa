'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plug, Plus, Power, ChevronRight, Check, X, Clock, AlertCircle } from 'lucide-react';
import { api, ApiError, ctx } from '@/lib/api';
import { cn } from '@/lib/cn';

interface WebhookDto {
  id: string;
  name: string;
  targetUrl: string;
  eventFilters: string[];
  active: boolean;
  createdAt: string;
}

interface DeliveryRow {
  id: string;
  topic: string;
  status: 'pending' | 'succeeded' | 'failed' | 'retrying';
  attempt: number;
  lastStatusCode: number | null;
  createdAt: string;
  deliveredAt: string | null;
}

const SEED: WebhookDto[] = [
  { id: 's1', name: 'Zalo OA fanout',  targetUrl: 'https://zalo.example.com/kaori/hook',
    eventFilters: ['kaori.booking.created.v1', 'kaori.booking.cancelled.v1'],
    active: true, createdAt: new Date().toISOString() },
  { id: 's2', name: 'Make.com automation', targetUrl: 'https://hook.eu1.make.com/xxxxx',
    eventFilters: ['*'], active: false, createdAt: new Date().toISOString() }
];

const COMMON_FILTERS = [
  '*', 'kaori.booking.created.v1', 'kaori.booking.cancelled.v1',
  'kaori.booking.completed.v1', 'kaori.payment.completed.v1', 'kaori.audit.event.v1'
];

const STATUS_BG: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  retrying:  'bg-amber-100 text-amber-700',
  succeeded: 'bg-emerald-100 text-emerald-700',
  failed:    'bg-rose-100 text-rose-700'
};

export default function WebhookManager() {
  const [list, setList] = useState<WebhookDto[]>(SEED);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await api<WebhookDto[]>(`/v1/webhooks?tenantId=${ctx.tenantId}`);
      setList(r);
      setError(null);
    } catch (e) { setError((e as ApiError).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  const toggle = async (id: string) => {
    try { await api(`/v1/webhooks/${id}/toggle`, { method: 'POST' }); await refresh(); }
    catch (e) { alert((e as ApiError).message); }
  };

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
            <Plug className="h-6 w-6 text-brand-gold" />
            Webhooks
          </h1>
          <p className="text-sm text-brand-textmuted">
            Push domain events sang hệ thống bên ngoài (Zalo, Make.com, n8n…)
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus className="h-4 w-4" /> Tạo mới
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          API offline — demo data.
        </div>
      )}

      {showForm && <CreateForm onCreated={() => { setShowForm(false); refresh(); }} />}

      {loading ? (
        <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" /></div>
      ) : (
        <ul className="space-y-3">
          {list.map(w => (
            <li key={w.id} className={cn('card-soft', !w.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{w.name}</h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest',
                      w.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500')}>
                      {w.active ? 'Active' : 'Tạm dừng'}
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
                  <button onClick={() => toggle(w.id)} className="text-brand-textmuted hover:text-brand-gold p-1.5" aria-label="Toggle">
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDrawerId(drawerId === w.id ? null : w.id)}
                    className="text-brand-textmuted hover:text-brand-gold p-1.5" aria-label="Inspect">
                    <ChevronRight className={cn('h-4 w-4 transition-transform', drawerId === w.id && 'rotate-90')} />
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
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">Delivery gần đây</p>
      {rows === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-textmuted" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-brand-textmuted">Chưa có delivery nào</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {rows.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {d.status === 'succeeded' && <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" />}
                {d.status === 'failed'    && <X className="h-3 w-3 text-rose-600 flex-shrink-0" />}
                {(d.status === 'pending' || d.status === 'retrying') && <Clock className="h-3 w-3 text-amber-600 flex-shrink-0" />}
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

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [filters, setFilters] = useState<string[]>(['*']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (f: string) => {
    setFilters(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api('/v1/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: ctx.tenantId,
          name, targetUrl,
          eventFilters: filters
        })
      });
      onCreated();
    } catch (e) { setError((e as ApiError).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card-soft mb-6 space-y-3">
      <h3 className="font-serif text-base">Tạo webhook</h3>
      <Field label="Tên (mô tả ngắn)">
        <input value={name} onChange={e => setName(e.target.value)} className="fi" />
      </Field>
      <Field label="URL HTTPS *">
        <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
          className="fi font-mono" placeholder="https://your-service.example.com/hook" />
      </Field>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1.5">
          Event filters (* = mọi event)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-mono transition',
                filters.includes(f)
                  ? 'bg-brand-gold text-white'
                  : 'bg-brand-cream/60 text-brand-textmuted hover:bg-brand-cream'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !targetUrl || !name || filters.length === 0}
          className="btn-primary disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Tạo
        </button>
      </div>
      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 8px 12px;
              font-size: 14px; background: #faf9f6; outline: none; transition: border 0.2s; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</span>
      {children}
    </label>
  );
}
