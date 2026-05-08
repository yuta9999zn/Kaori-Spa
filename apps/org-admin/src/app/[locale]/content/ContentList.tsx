'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  FileText,
  Plus,
  Search,
  Tag,
  CalendarDays,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  useBranches,
  useContentPosts,
  createContentPost,
  type ContentPostListItem
} from '@/lib/hooks';

const TYPE_OPTIONS = ['promotion', 'event', 'announcement', 'article', 'seo'] as const;
const STATUS_OPTIONS = ['published', 'draft', 'scheduled', 'archived'] as const;
const PAGE_SIZE = 20;

type PostType = (typeof TYPE_OPTIONS)[number];
type PostStatus = (typeof STATUS_OPTIONS)[number];

const TYPE_BADGE: Record<string, string> = {
  promotion:    'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
  event:        'bg-blue-50 text-blue-700 border-blue-200',
  announcement: 'bg-slate-50 text-slate-600 border-slate-200',
  article:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  seo:          'bg-brand-rose/10 text-brand-rose border-brand-rose/30'
};

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:     'bg-slate-50 text-slate-600 border-slate-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  archived:  'bg-amber-50 text-amber-700 border-amber-200'
};

function pickTitle(title: Record<string, string>, locale: string): string {
  return title[locale] ?? title.vi ?? title.en ?? Object.values(title)[0] ?? '';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export default function ContentList() {
  const t = useTranslations('content');
  const locale = useLocale();
  const [branchId, setBranchId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [page, setPage] = useState(0);

  const { data: branches } = useBranches();
  const { data, loading, error } = useContentPosts({
    branchId: branchId || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    q: q.trim().length > 0 ? q.trim() : undefined,
    page,
    size: PAGE_SIZE
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = total > 0 ? Math.ceil(total / PAGE_SIZE) - 1 : 0;
  const branchById = new Map((branches ?? []).map(b => [b.id, b]));

  const safeTypeLabel = (typ: string): string => {
    if ((TYPE_OPTIONS as readonly string[]).includes(typ)) {
      return t(`type.${typ as PostType}` as 'type.promotion');
    }
    return typ;
  };
  const safeStatusLabel = (s: string): string => {
    if ((STATUS_OPTIONS as readonly string[]).includes(s)) {
      return t(`status.${s as PostStatus}` as 'status.published');
    }
    return s;
  };
  const branchLabel = (id: string | null): string => {
    if (!id) return locale === 'vi' ? 'Toàn tổ chức' : 'All branches';
    const b = branchById.get(id);
    if (!b) return id.slice(0, 8);
    const name = b.name[locale] ?? b.name.vi ?? b.name.en ?? b.code;
    return `${b.code} · ${name}`;
  };

  const handleCreate = () => {
    // TODO(M3): wire create modal. For now log a placeholder so the action
    // surface is at least observable from devtools.
    console.log('[content] create clicked', { createContentPost });
  };

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <FileText className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft">
            <span className="text-[10px] uppercase tracking-widest text-brand-textmuted mr-2">{t('branchSelector')}</span>
            <select
              value={branchId}
              onChange={e => { setBranchId(e.target.value); setPage(0); }}
              className="bg-transparent text-brand-textmain outline-none"
            >
              <option value="">{locale === 'vi' ? 'Tất cả chi nhánh' : 'All branches'}</option>
              {(branches ?? []).map(b => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.name[locale] ?? b.name.vi ?? b.name.en ?? b.code}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="btn-primary opacity-60 cursor-not-allowed"
            disabled
            title="TODO(M3): wire create modal"
          >
            <Plus className="h-4 w-4" /> {t('create')}
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[260px] items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('filter.search')}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold"
        >
          <option value="">{t('filter.type')}</option>
          {TYPE_OPTIONS.map(typ => (
            <option key={typ} value={typ}>{t(`type.${typ}` as 'type.promotion')}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold"
        >
          <option value="">{t('filter.status')}</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{t(`status.${s}` as 'status.published')}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['title', 'type', 'branch', 'status', 'metrics', 'actions'] as const).map(c => (
                <th key={c} className={`px-4 py-3 font-medium ${c === 'status' || c === 'actions' ? 'text-center' : 'text-left'}`}>
                  {t(`columns.${c}` as 'columns.title')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-rose-600">
                {error.message}
              </td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                —
              </td></tr>
            )}
            {!loading && !error && rows.map((r: ContentPostListItem) => {
              const title = pickTitle(r.title, locale);
              return (
                <tr key={r.id} className="hover:bg-brand-cream/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TypeIcon type={r.type} />
                      <div>
                        <p className="font-medium text-brand-textmain">{title || r.slug}</p>
                        <p className="font-mono text-[11px] text-brand-textmuted">/{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${TYPE_BADGE[r.type] ?? ''}`}>
                      {safeTypeLabel(r.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-textmuted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {branchLabel(r.branchId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_BADGE[r.status] ?? ''}`}>
                      {safeStatusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[11px] text-brand-textmain">{fmtDate(r.publishedAt)}</p>
                    <p className="text-[11px] text-brand-textmuted">
                      {r.viewCount.toLocaleString(locale)} {locale === 'vi' ? 'lượt xem' : 'views'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" className="rounded p-1.5 text-brand-textmuted hover:text-brand-gold transition" title="Preview">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded p-1.5 text-brand-textmuted hover:text-blue-600 transition" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded p-1.5 text-brand-textmuted hover:text-red-600 transition" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

function TypeIcon({ type }: { type: string }) {
  const map: Record<string, { Icon: React.ComponentType<{ className?: string }>; bg: string; fg: string }> = {
    promotion:    { Icon: Tag,           bg: 'bg-brand-gold/10', fg: 'text-brand-gold' },
    event:        { Icon: CalendarDays,  bg: 'bg-blue-50',       fg: 'text-blue-600' },
    announcement: { Icon: FileText,      bg: 'bg-brand-cream',   fg: 'text-brand-textmuted' },
    article:      { Icon: FileText,      bg: 'bg-emerald-50',    fg: 'text-emerald-600' },
    seo:          { Icon: Search,        bg: 'bg-brand-rose/10', fg: 'text-brand-rose' }
  };
  const cfg = map[type] ?? map.article!;
  const { Icon, bg, fg } = cfg;
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${fg}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
