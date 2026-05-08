'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus, Search, Sparkles, Waves, Flower, HeartHandshake, Droplet, Clock,
  Store, Star, MoreVertical, Filter, Download, Upload, Loader2
} from 'lucide-react';
import { useCatalog } from '@/lib/hooks';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// Map service `region` (from backend) to UI category bucket and icon.
function bucketOf(region: string, combo: boolean): { cat: string; icon: 'waves' | 'sparkles' | 'flower' | 'heart' | 'droplet' } {
  if (combo) return { cat: 'package', icon: 'heart' };
  if (region === 'beauty') return { cat: 'facial', icon: 'flower' };
  if (region === 'face')   return { cat: 'facial', icon: 'flower' };
  if (['arm','chest','belly','back','vio','leg','full_body'].includes(region)) {
    return { cat: 'hair_removal', icon: 'sparkles' };
  }
  return { cat: 'massage', icon: 'waves' };
}

export default function ServiceView() {
  const t = useTranslations('service');
  const { data: services, loading, error } = useCatalog(ORG_ID);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    return (services ?? []).filter(s => {
      const { cat } = bucketOf(s.region, s.combo);
      if (category && cat !== category) return false;
      if (status === 'active' && !s.active) return false;
      if (status === 'inactive' && s.active) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = `${s.code} ${s.name?.vi ?? ''} ${s.name?.en ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [services, q, category, status]);

  const total = (services ?? []).length;
  const active = (services ?? []).filter(s => s.active).length;
  const inactive = total - active;
  const avgDuration = total > 0
    ? Math.round((services ?? []).reduce((s, x) => s + (x.durationMin || 0), 0) / total)
    : 0;

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-lg">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-ghost"><Upload className="h-4 w-4" /> {t('import')}</button>
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('export')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')}    value={total.toString()}    accent="text-brand-textmain" />
        <KpiTile label={t('kpi.active')}   value={active.toString()}   accent="text-emerald-600" />
        <KpiTile label={t('kpi.inactive')} value={inactive.toString()} accent="text-brand-textmain" />
        <KpiTile
          label={t('kpi.mostBooked')}
          value={t('mockMostBooked')} /* TODO(M2): cross-check with /v1/reports/top-services */
          accent="text-brand-gold"
          small
        />
        <KpiTile
          label={t('kpi.avgDuration')}
          value={`${avgDuration} ${t('minShort')}`}
          accent="text-brand-textmain"
        />
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 lg:w-96 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('search')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterCategoryAll')}</option>
            <option value="massage">{t('category.massage')}</option>
            <option value="facial">{t('category.facial')}</option>
            <option value="hair_removal">{t('category.hair_removal')}</option>
            <option value="package">{t('category.package')}</option>
          </select>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterStatusAll')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </select>
          <button className="rounded-xl border border-brand-cream bg-white p-2 text-brand-textmuted hover:text-brand-gold transition">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['name', 'category', 'duration', 'price', 'status'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.name')}
                </th>
              ))}
              <th className="px-4 py-3" />
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
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                Chưa có dữ liệu
              </td></tr>
            )}
            {!loading && filtered.map(r => {
              const { cat, icon } = bucketOf(r.region, r.combo);
              return (
                <tr key={r.id} className="hover:bg-brand-cream/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 rounded-lg bg-brand-cream/60 flex items-center justify-center text-brand-gold">
                        <ServiceIcon icon={icon} />
                      </span>
                      <div>
                        <p className="font-serif text-sm text-brand-textmain leading-tight">{r.name?.vi ?? r.code}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted font-mono">{r.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-textmuted">
                    {(() => {
                      try { return t(`category.${cat}` as 'category.massage'); }
                      catch { return cat; }
                    })()}
                  </td>
                  <td className="px-4 py-3 text-brand-textmuted whitespace-nowrap">
                    <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                    {t('durationMin', { min: r.durationMin })}
                  </td>
                  <td className="px-4 py-3 font-serif text-brand-gold">{VND(Number(r.basePrice))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={r.active ? 'active' : 'inactive'}
                      label={t(`status.${r.active ? 'active' : 'inactive'}` as 'status.active')}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-full p-2 text-brand-textmuted hover:bg-brand-cream/50 hover:text-brand-gold transition">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-3 text-xs text-brand-textmuted">
          <p>{t('paginationSummary', { from: filtered.length === 0 ? 0 : 1, to: filtered.length, total })}</p>
        </div>
      </div>
    </>
  );
}

function KpiTile({
  label, value, accent, small
}: {
  label: string; value: string; accent: string; small?: boolean;
}) {
  return (
    <article className="kpi-card">
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
      <p className={`mt-2 font-serif ${small ? 'text-base truncate' : 'text-2xl'} ${accent}`}>
        {value}
      </p>
    </article>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        map[status] ?? ''
      }`}
    >
      {label}
    </span>
  );
}

function ServiceIcon({ icon }: { icon: 'waves' | 'sparkles' | 'flower' | 'heart' | 'droplet' }) {
  const cls = 'h-5 w-5';
  switch (icon) {
    case 'waves':    return <Waves className={cls} />;
    case 'sparkles': return <Sparkles className={cls} />;
    case 'flower':   return <Flower className={cls} />;
    case 'heart':    return <HeartHandshake className={cls} />;
    case 'droplet':  return <Droplet className={cls} />;
  }
}
