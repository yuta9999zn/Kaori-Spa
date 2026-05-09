'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FolderPlus, Image as ImageIcon, Film, FileText, HardDrive, Folder, Loader2 } from 'lucide-react';
import { useContentPosts, type ContentPostListItem } from '@/lib/hooks';

type AssetType = 'image' | 'video' | 'document';

interface MediaItem {
  id: string;
  name: string;
  type: AssetType;
  url: string;
}

/** Heuristically classify a cover URL by its extension. We treat anything that
 *  isn't obviously a video/document as an image (cover art is the common case). */
function classify(url: string): AssetType {
  const u = url.toLowerCase();
  if (/\.(mp4|webm|mov|m4v|avi)(\?|$)/.test(u)) return 'video';
  if (/\.(pdf|docx?|xlsx?|pptx?|txt)(\?|$)/.test(u)) return 'document';
  return 'image';
}

// TODO(Phase B): swap to a real /v1/media endpoint that returns asset rows
// (mime, size, folder). For now we re-use content-service post covers.

export default function ContentMediaView() {
  const t = useTranslations('contentMedia');
  const { data, loading, error } = useContentPosts({ type: 'article', size: 100 });
  const [filter, setFilter] = useState<'all' | AssetType>('all');

  const items: MediaItem[] = useMemo(() => {
    return (data?.items ?? [])
      .filter((p: ContentPostListItem): p is ContentPostListItem & { coverUrl: string } => !!p.coverUrl)
      .map(p => ({
        id: p.id,
        name: p.title?.vi ?? p.title?.en ?? p.slug,
        type: classify(p.coverUrl),
        url: p.coverUrl
      }));
  }, [data]);

  const filtered = filter === 'all' ? items : items.filter(a => a.type === filter);

  const total = items.length;
  const images = items.filter(a => a.type === 'image').length;
  const videos = items.filter(a => a.type === 'video').length;
  const documents = items.filter(a => a.type === 'document').length;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <ImageIcon className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><FolderPlus className="h-4 w-4" /> {t('newFolder')}</button>
          <button className="btn-primary"><Upload className="h-4 w-4" /> {t('upload')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-5 mb-6">
        <Kpi label={t('kpi.totalAssets')} value={String(total)} Icon={ImageIcon} accent="text-brand-gold" bg="bg-brand-gold/10" />
        {/* TODO(Phase B): totalSize requires per-asset metadata */}
        <Kpi label={t('kpi.totalSize')} value="—" Icon={HardDrive} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.images')} value={String(images)} Icon={ImageIcon} accent="text-purple-600" bg="bg-purple-50" />
        <Kpi label={t('kpi.videos')} value={String(videos)} Icon={Film} accent="text-rose-600" bg="bg-rose-50" />
        <Kpi label={t('kpi.documents')} value={String(documents)} Icon={FileText} accent="text-emerald-600" bg="bg-emerald-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-4 mb-6">
        <article className="kpi-card">
          <h2 className="font-serif text-base text-brand-textmain mb-3">{t('sections.folders')}</h2>
          {/* TODO(Phase B): folders not modelled — show single placeholder. */}
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-brand-ivory/40 cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-brand-textmain">
                <Folder className="h-4 w-4 text-brand-gold" /> Blog
              </span>
              <span className="text-[11px] text-brand-textmuted tabular-nums">{total}</span>
            </li>
          </ul>
        </article>

        <article className="kpi-card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base text-brand-textmain">{t('sections.assets')}</h2>
            <div className="flex gap-1">
              {(['all', 'image', 'video', 'document'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-[11px] border ${
                    filter === f
                      ? 'bg-brand-gold text-white border-brand-gold'
                      : 'border-brand-cream bg-white'
                  }`}
                >
                  {t(`filters.${f}` as 'filters.all')}
                </button>
              ))}
            </div>
          </div>
          {loading && (
            <div className="py-10 text-center">
              <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
            </div>
          )}
          {!loading && error && (
            <div className="py-10 text-center text-sm text-rose-600">{error.message}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-brand-textmuted">Chưa có ảnh / video</div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map(a => (
                <article key={a.id} className="rounded-xl border border-brand-cream/70 overflow-hidden">
                  <div className="aspect-square bg-brand-ivory/60 flex items-center justify-center overflow-hidden">
                    {a.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                    ) : a.type === 'video' ? (
                      <Film className="h-10 w-10 text-rose-500" />
                    ) : (
                      <FileText className="h-10 w-10 text-emerald-600" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-brand-textmain truncate">{a.name}</p>
                    <p className="text-[10px] text-brand-textmuted truncate">{a.type}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}

function Kpi({
  label, value, Icon, accent, bg
}: {
  label: string; value: string; accent: string; bg: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
