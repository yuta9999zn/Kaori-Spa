'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Link2, Globe, ShieldCheck, Lock, Check, RefreshCw, Loader2, AlertCircle
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import { TENANT_ID, useDomainConfig, saveDomainConfig, type DomainConfigDto } from '@/lib/hooks';

const SUBDOMAIN_SUFFIX = '.kaoriplatform.com';

interface FormState {
  subdomain: string;
  customDomain: string;
  forceHttps: boolean;
  redirectOldUrl: boolean;
  requireLogin: boolean;
}

function fromDto(d: DomainConfigDto | null): FormState {
  return {
    subdomain: d?.subdomain ?? '',
    customDomain: d?.customDomain ?? '',
    forceHttps: d?.forceHttps ?? true,
    redirectOldUrl: d?.redirectOldUrl ?? false,
    requireLogin: d?.requireLogin ?? false
  };
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - Date.now()) / 86400000));
}

export default function DomainConfigView() {
  const t = useTranslations('domain');
  const { data, error, loading, refetch } = useDomainConfig();
  const [form, setForm] = useState<FormState>(fromDto(null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasInit, setHasInit] = useState(false);

  // Hydrate form once when first data lands.
  useEffect(() => {
    if (data && !hasInit) {
      setForm(fromDto(data));
      setHasInit(true);
    }
  }, [data, hasInit]);

  const onCancel = () => {
    setForm(fromDto(data));
    setSaveError(null);
  };

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveDomainConfig(TENANT_ID, {
        subdomain: form.subdomain.trim(),
        customDomain: form.customDomain.trim() || null,
        forceHttps: form.forceHttps,
        redirectOldUrl: form.redirectOldUrl,
        requireLogin: form.requireLogin
      });
      await refetch();
    } catch (e) {
      setSaveError((e as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const sslStatus = (data?.sslStatus ?? '').toLowerCase();
  const sslOk = sslStatus === 'active';
  const renewDays = daysUntil(data?.sslExpiresAt ?? null);

  const isMissing = error?.code === 'NOT_FOUND' || (!loading && !data && !error);

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost" disabled={saving || loading}>
            {t('actions.cancel')}
          </button>
          <button onClick={() => void onSave()} className="btn-primary" disabled={saving || loading || !form.subdomain.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t('actions.save')}
          </button>
        </div>
      </header>

      {loading && !data && (
        <div className="rounded-2xl border border-brand-cream bg-white p-8 text-center mb-6">
          <Loader2 className="inline h-6 w-6 animate-spin text-brand-gold" />
        </div>
      )}

      {error && error.code !== 'NOT_FOUND' && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error.message}
        </div>
      )}

      {isMissing && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {/* No domain config yet — admin can fill the form below to create one. */}
          —
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {saveError}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Platform subdomain */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Link2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl text-brand-textmain">{t('subdomain.title')}</h2>
                <p className="text-xs text-brand-textmuted mt-0.5">{t('subdomain.subtitle')}</p>
              </div>
            </header>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted font-semibold mb-1.5">
                  {t('subdomain.label')}
                </label>
                <div className="flex rounded-xl overflow-hidden border border-brand-cream focus-within:border-brand-gold transition">
                  <input
                    value={form.subdomain}
                    onChange={e => setForm(s => ({ ...s, subdomain: e.target.value }))}
                    className="flex-1 bg-brand-ivory px-3 py-2 text-sm font-medium text-brand-textmain outline-none"
                  />
                  <span className="flex items-center px-3 bg-brand-cream/50 text-brand-textmuted text-sm font-mono">
                    {SUBDOMAIN_SUFFIX}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Custom domain */}
          <section className="rounded-2xl border-2 border-brand-gold/20 bg-white p-6 shadow-soft">
            <header className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl text-brand-textmain">{t('custom.title')}</h2>
                  <p className="text-xs text-brand-textmuted mt-0.5">{t('custom.subtitle')}</p>
                </div>
              </div>
              {form.customDomain && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {t('custom.connected')}
                </span>
              )}
            </header>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted font-semibold mb-1.5">
                  {t('custom.label')}
                </label>
                <div className="flex rounded-xl overflow-hidden border border-brand-cream focus-within:border-brand-gold transition">
                  <span className="flex items-center px-3 bg-brand-ivory border-r border-brand-cream text-brand-textmuted text-xs font-mono">
                    <Lock className="h-3 w-3 mr-1" /> https://
                  </span>
                  <input
                    value={form.customDomain}
                    onChange={e => setForm(s => ({ ...s, customDomain: e.target.value }))}
                    placeholder="booking.example.com"
                    className="flex-1 bg-white px-3 py-2 text-sm font-mono font-medium text-brand-textmain outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SSL + Security */}
          <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('ssl.title')}</h3>
              </header>
              <div className="rounded-xl border border-brand-cream bg-brand-ivory/50 px-4 py-5 text-center mb-4">
                <p className="text-xs text-brand-textmuted">{t('ssl.statusLabel')}</p>
                <p className={`font-serif text-2xl mt-1 ${sslOk ? 'text-emerald-600' : 'text-brand-textmuted'}`}>
                  {sslOk ? t('ssl.statusValue') : (data?.sslStatus ?? '—')}
                </p>
                {renewDays !== null && (
                  <p className="text-xs text-brand-textmuted mt-1.5">
                    {t('ssl.renewIn', { days: renewDays })}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('security.title')}</h3>
              </header>
              <ul className="space-y-4">
                <ToggleRow
                  on={form.forceHttps}
                  onChange={v => setForm(s => ({ ...s, forceHttps: v }))}
                  label={t('security.forceHttps')}
                  hint={t('security.forceHttpsHint')}
                />
                <ToggleRow
                  on={form.redirectOldUrl}
                  onChange={v => setForm(s => ({ ...s, redirectOldUrl: v }))}
                  label={t('security.redirectOld')}
                  hint={t('security.redirectOldHint')}
                />
                <ToggleRow
                  on={form.requireLogin}
                  onChange={v => setForm(s => ({ ...s, requireLogin: v }))}
                  label={t('security.protection')}
                  hint={t('security.protectionHint')}
                />
              </ul>
            </div>
          </section>
        </div>

        {/* Right column: preview / guide stays informational */}
        <div className="xl:col-span-1 space-y-6">
          <section className="rounded-2xl border border-brand-cream bg-brand-cream/20 p-6">
            <h3 className="font-serif text-xl text-brand-textmain mb-1">{t('guide.title')}</h3>
            <p className="text-xs text-brand-textmuted mb-5">{t('guide.subtitle')}</p>
            <ol className="space-y-5">
              {(['1', '2', '3'] as const).map((n, i) => (
                <li key={n} className="relative pl-8">
                  <span className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center">
                    {n}
                  </span>
                  <p className="text-sm font-medium text-brand-textmain mb-1">
                    {t(`guide.step${i + 1}Title` as 'guide.step1Title')}
                  </p>
                  <p className="text-xs text-brand-textmuted leading-relaxed">
                    {i === 1 ? `CNAME → domains.kaoriplatform.com` : t(`guide.step${i + 1}Desc` as 'guide.step1Desc')}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-brand-cream bg-brand-ivory p-6 shadow-soft">
            <h3 className="font-serif text-xl text-brand-textmain mb-1">{t('preview.title')}</h3>
            <p className="text-xs text-brand-textmuted mb-3">{t('preview.subtitle')}</p>
            <div className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-xs font-mono">
              {form.customDomain
                ? <span className="text-brand-gold">https://{form.customDomain}</span>
                : <span className="text-brand-textmuted">https://{form.subdomain || '—'}{SUBDOMAIN_SUFFIX}</span>}
            </div>
            <p className="mt-3 text-center text-[10px] text-brand-textmuted inline-flex items-center justify-center gap-1 w-full">
              <RefreshCw className="h-3 w-3" /> {t('actions.save')}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

function ToggleRow({ on, onChange, label, hint }: {
  on: boolean; onChange: (v: boolean) => void; label: string; hint: string;
}) {
  return (
    <li className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-brand-textmain">{label}</p>
        <p className="text-[10px] text-brand-textmuted mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`inline-flex h-6 w-11 items-center rounded-full transition ${on ? 'bg-brand-gold' : 'bg-brand-cream'}`}
        aria-label={label}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </li>
  );
}
