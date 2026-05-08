'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Search,
  FileText,
  Eye,
  ExternalLink,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useContentPosts, type ContentPostListItem } from '@/lib/hooks';

type PostStatus = 'published' | 'scheduled' | 'draft' | 'archived';

const PAGE_SIZE = 20;

const TYPE_OPTIONS = ['article', 'promotion', 'event', 'announcement', 'seo'] as const;
const STATUS_OPTIONS: PostStatus[] = ['published', 'scheduled', 'draft', 'archived'];

const STATUS_TONE: Record<PostStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  archived: 'bg-slate-50 text-slate-500 border-slate-200'
};

function pickTitle(title: Record<string, string>, locale: string): string {
  return title[locale] ?? title.vi ?? title.en ?? Object.values(title)[0] ?? '';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export default function ContentList() {
  const t = useTranslations('content');
  const locale = useLocale();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [page, setPage] = useState(0);

  const { data, loading, error } = useContentPosts({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    q: q.trim().length > 0 ? q.trim() : undefined,
    page,
    size: PAGE_SIZE
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = total > 0 ? Math.ceil(total / PAGE_SIZE) - 1 : 0;
  const fromIdx = total > 0 ? page * PAGE_SIZE + 1 : 0;
  const toIdx = total > 0 ? Math.min((page + 1) * PAGE_SIZE, total) : 0;

  const safeStatusLabel = (s: string): string => {
    if ((STATUS_OPTIONS as string[]).includes(s)) {
      return t(`status.${s as PostStatus}` as 'status.published');
    }
    return s;
  };

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <FileText className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-lg">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-primary opacity-50 cursor-not-allowed" disabled>
            <Plus className="h-4 w-4" /> {t('create')}
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 lg:w-96 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('search')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterScopeAll')}</option>
            {TYPE_OPTIONS.map(typ => (
              <option key={typ} value={typ}>{typ}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterStatusAll')}</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{t(`status.${s}` as 'status.published')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts table */}
      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t('columns.post')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('columns.scope')}</th>
              <th className="text-center px-4 py-3 font-medium">{t('columns.status')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('columns.metrics')}</th>
              <th className="px-4 py-3" />
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
            {!loading && !error && rows.map(r => {
              const title = pickTitle(r.title, locale);
              const status = r.status as PostStatus;
              const publishedAt = fmtDate(r.publishedAt);
              const tone = STATUS_TONE[status] ?? STATUS_TONE.draft;
              return (
                <tr key={r.id} className="hover:bg-brand-cream/20 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-brand-cream flex items-center justify-center ${
                          r.coverUrl ? 'bg-brand-cream' : 'bg-brand-cream/40 text-brand-textmuted'
                        }`}
                      >
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`font-medium text-brand-textmain truncate max-w-xs ${
                            status === 'draft' ? 'italic' : ''
                          }`}
                        >
                          {title || r.slug}
                        </p>
                        <p className="text-[10px] text-brand-textmuted mt-0.5 truncate max-w-xs font-mono">
                          /{r.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
                      {safeStatusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {publishedAt ? (
                      <p className="text-xs font-mono text-brand-textmain">{publishedAt}</p>
                    ) : (
                      <p className="text-xs font-mono text-brand-textmuted italic">{t('unpublished')}</p>
                    )}
                    <p className="text-[10px] text-brand-textmuted mt-0.5 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {t('viewsCount', { count: r.viewCount })}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="rounded p-1.5 text-brand-textmuted hover:text-brand-gold transition"
                        title={t('action.preview')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 text-brand-textmuted hover:text-blue-500 transition"
                        title={t('action.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 text-brand-textmuted hover:text-red-500 transition"
                        title={t('action.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-3 text-xs text-brand-textmuted">
          <p>{t('paginationSummary', { from: fromIdx, to: toIdx, total })}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-gold transition flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('prev')}
            </button>
            <span className="font-mono px-2">{page + 1}</span>
            <button
              type="button"
              onClick={() => setPage(p => (p < lastPage ? p + 1 : p))}
              disabled={page >= lastPage || loading}
              className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-gold transition flex items-center gap-1"
            >
              {t('next')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
