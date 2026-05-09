'use client';

import { Building, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOrgs, type OrgDto } from '@/lib/hooks';

export default function OrgSettingsView() {
  const t = useTranslations('orgSettings');
  const { data, error, loading } = useOrgs();
  const items: OrgDto[] = data?.items ?? [];

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
      </header>

      {/* TODO(M3+): swap this banner for an inline edit form once OrgController
          ships PUT /v1/orgs/{code}. Today the page is read-only. */}
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{t('todoEdit')}</span>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {t('errors.load')} ({error.message})
        </div>
      )}

      <section className="rounded-2xl border border-brand-cream bg-white shadow-soft">
        <header className="px-6 py-4 border-b border-brand-cream/50 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
            <Building className="h-4 w-4" />
          </span>
          <h2 className="font-serif text-xl text-brand-textmain">{t('list.title')}</h2>
        </header>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-sm text-brand-textmuted text-center">{t('list.empty')}</p>
        ) : (
          <ul className="divide-y divide-brand-cream/60">
            {items.map(o => <OrgRow key={o.id} org={o} />)}
          </ul>
        )}
      </section>
    </>
  );
}

function OrgRow({ org }: { org: OrgDto }) {
  const t = useTranslations('orgSettings');
  const displayName =
    org.name?.vi ?? org.name?.en ?? Object.values(org.name ?? {})[0] ?? org.slug;

  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h3 className="font-medium text-brand-textmain">{displayName}</h3>
        <span className="rounded-full bg-brand-gold/10 text-brand-gold px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono">
          {org.code}
        </span>
      </div>
      <dl className="grid gap-2 sm:grid-cols-2 text-xs">
        <Field label={t('fields.slug')} value={org.slug} mono />
        <Field label={t('fields.primaryLocale')} value={org.primaryLocale} mono />
        <Field label={t('fields.id')} value={org.id} mono />
      </dl>
    </li>
  );
}

function Field({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</dt>
      <dd className={`text-brand-textmain ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
