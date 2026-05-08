'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAuditEvents, type AuditEventDto } from '@/lib/hooks';

const PAGE_SIZE = 20;

function fmtTs(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function entityLabel(e: AuditEventDto): string {
  if (!e.entityType && !e.entityId) return '—';
  const id = e.entityId ?? '?';
  return e.entityType ? `${e.entityType}:${id}` : id;
}

export default function AuditLogView() {
  const t = useTranslations('audit');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  const { data, loading, error } = useAuditEvents({
    action: actionFilter || undefined,
    entityType: entityTypeFilter || undefined,
    page,
    size: PAGE_SIZE
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = total > 0 ? Math.ceil(total / PAGE_SIZE) - 1 : 0;

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
      </header>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(0); }}
            placeholder={t('columns.action')}
            className="bg-transparent text-sm outline-none w-56"
          />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={entityTypeFilter}
            onChange={e => { setEntityTypeFilter(e.target.value); setPage(0); }}
            placeholder={t('columns.entity')}
            className="bg-transparent text-sm outline-none w-56"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['ts', 'actor', 'action', 'entity', 'ip'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.ts')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-rose-600">
                {error.message}
              </td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                —
              </td></tr>
            )}
            {!loading && !error && rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-textmuted whitespace-nowrap">{fmtTs(r.ts)}</td>
                <td className="px-4 py-3">
                  <div className="text-brand-textmain">{r.actorName ?? '—'}</div>
                  {r.actorId ? (
                    <div className="text-[11px] text-brand-textmuted font-mono">{r.actorId.slice(0, 8)}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.action}</td>
                <td className="px-4 py-3 text-brand-textmuted font-mono text-xs">{entityLabel(r)}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{r.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[11px] text-brand-textmuted">
          <span>
            {total > 0
              ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} / ${total}`
              : '0 / 0'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-md border border-brand-cream bg-white px-2 py-1 text-brand-textmain disabled:opacity-40 hover:border-brand-gold"
              aria-label="prev"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono">{page + 1}</span>
            <button
              type="button"
              onClick={() => setPage(p => (p < lastPage ? p + 1 : p))}
              disabled={page >= lastPage || loading}
              className="rounded-md border border-brand-cream bg-white px-2 py-1 text-brand-textmain disabled:opacity-40 hover:border-brand-gold"
              aria-label="next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
