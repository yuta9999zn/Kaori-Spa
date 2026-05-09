'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Sparkles, Waves, Flower, Clock, MoreVertical, Loader2 } from 'lucide-react';
import { useCatalog, type CatalogService } from '@/lib/hooks';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

type Cat = 'massage' | 'facial' | 'hair_removal' | 'package';
type Icon = 'waves' | 'sparkles' | 'flower';

function bucketOf(s: CatalogService): { cat: Cat; icon: Icon } {
  if (s.combo) return { cat: 'package', icon: 'sparkles' };
  if (s.region === 'beauty' || s.region === 'face') return { cat: 'facial', icon: 'flower' };
  if (['arm', 'chest', 'belly', 'back', 'vio', 'leg', 'full_body'].includes(s.region)) {
    return { cat: 'hair_removal', icon: 'sparkles' };
  }
  return { cat: 'massage', icon: 'waves' };
}

export default function ServiceListView() {
  const t = useTranslations('serviceList');
  const { data, loading, error } = useCatalog(ORG_ID);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'' | Cat>('');

  const cards = useMemo(() => {
    return (data ?? []).filter(s => {
      const { cat: bucket } = bucketOf(s);
      if (cat && bucket !== cat) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = `${s.code} ${s.name?.vi ?? ''} ${s.name?.en ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, q, cat]);

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
        </div>
      </header>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm w-80">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            className="flex-1 bg-transparent outline-none placeholder-brand-textmuted/60"
            placeholder={t('searchPh')}
          />
        </div>
        <select
          value={cat}
          onChange={e => setCat(e.target.value as '' | Cat)}
          className="rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm"
        >
          <option value="">{t('filterAll')}</option>
          <option value="massage">{t('cat.massage')}</option>
          <option value="facial">{t('cat.facial')}</option>
          <option value="hair_removal">{t('cat.hair_removal')}</option>
          <option value="package">{t('cat.package')}</option>
        </select>
        <select className="rounded-xl border border-brand-cream bg-white px-3 py-1.5 text-sm" defaultValue="popular">
          {/* TODO(Phase B): hook up sort once /v1/services supports it */}
          <option value="popular">{t('sort.popular')}</option>
          <option value="name">{t('sort.name')}</option>
          <option value="priceHigh">{t('sort.priceHigh')}</option>
          <option value="newest">{t('sort.newest')}</option>
        </select>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <Loader2 className="inline h-6 w-6 animate-spin text-brand-gold" />
        </div>
      )}
      {!loading && error && (
        <div className="py-20 text-center text-sm text-rose-600">{error.message}</div>
      )}
      {!loading && !error && cards.length === 0 && (
        <div className="py-20 text-center text-sm text-brand-textmuted">Chưa có dữ liệu</div>
      )}

      {!loading && cards.length > 0 && (
        <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(s => {
            const { cat: bucket, icon } = bucketOf(s);
            const name = s.name?.vi ?? s.name?.en ?? s.code;
            // TODO(Phase B): rating, branches count, description not on dto.
            const rating = 0;
            const branches = 1;
            return (
              <article key={s.id} className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden flex flex-col">
                <div className="h-40 bg-gradient-to-br from-brand-gold/15 via-brand-cream to-brand-rose/15 flex items-center justify-center text-brand-gold">
                  {icon === 'waves'
                    ? <Waves className="h-12 w-12" />
                    : icon === 'sparkles'
                      ? <Sparkles className="h-12 w-12" />
                      : <Flower className="h-12 w-12" />}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg text-brand-textmain leading-tight">{name}</h3>
                    <button className="p-1.5 rounded-lg hover:bg-brand-cream/50 shrink-0" aria-label="more">
                      <MoreVertical className="h-4 w-4 text-brand-textmuted" />
                    </button>
                  </div>
                  <p className="text-xs text-brand-textmuted font-mono">{s.code}</p>
                  <div className="flex items-center justify-between text-xs text-brand-textmuted mt-auto pt-3 border-t border-brand-cream/60">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.durationMin} {t('min')}</span>
                    <span className="text-brand-gold">★ {rating.toFixed(1)}</span>
                    <span className="font-serif text-brand-textmain text-base">{VND(Number(s.basePrice))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      s.active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {t(`status.${s.active ? 'active' : 'inactive'}` as 'status.active')}
                    </span>
                    <span className="text-[10px] text-brand-textmuted">
                      {t('branchesCount', { count: branches })} · {bucket}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
