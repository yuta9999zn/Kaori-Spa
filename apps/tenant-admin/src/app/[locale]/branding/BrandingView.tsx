'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Image as ImageIcon, Palette, Type, Layout, Calendar, Mail, Check, RefreshCw, Loader2, AlertCircle, Flower
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import { TENANT_ID, useBranding, saveBranding, type BrandingDto } from '@/lib/hooks';

const headingFonts = ['Cinzel', 'Playfair Display', 'Cormorant', 'Montserrat'];
const bodyFonts    = ['Jost', 'Lato', 'Inter', 'Open Sans'];

interface FormState {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  loginWelcomeVi: string;
  loginWelcomeEn: string;
  bookingTaglineVi: string;
  bookingTaglineEn: string;
  emailLogoUrl: string;
  emailHeaderBg: string;
  emailFooterVi: string;
  emailFooterEn: string;
}

function fromDto(b: BrandingDto | null): FormState {
  return {
    logoUrl: b?.logoUrl ?? '',
    faviconUrl: b?.faviconUrl ?? '',
    primaryColor: b?.primaryColor ?? '#C9A87C',
    secondaryColor: b?.secondaryColor ?? '#F4EFEA',
    accentColor: b?.accentColor ?? '#D9B8B5',
    backgroundColor: b?.backgroundColor ?? '#FAF9F6',
    headingFont: b?.headingFont ?? headingFonts[0]!,
    bodyFont: b?.bodyFont ?? bodyFonts[0]!,
    loginWelcomeVi: b?.loginWelcome?.vi ?? '',
    loginWelcomeEn: b?.loginWelcome?.en ?? '',
    bookingTaglineVi: b?.bookingTagline?.vi ?? '',
    bookingTaglineEn: b?.bookingTagline?.en ?? '',
    emailLogoUrl: b?.emailLogoUrl ?? '',
    emailHeaderBg: b?.emailHeaderBg ?? '#FFFFFF',
    emailFooterVi: b?.emailFooter?.vi ?? '',
    emailFooterEn: b?.emailFooter?.en ?? ''
  };
}

export default function BrandingView() {
  const t = useTranslations('branding');
  const { data, error, loading, refetch } = useBranding();
  const [form, setForm] = useState<FormState>(fromDto(null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasInit, setHasInit] = useState(false);

  useEffect(() => {
    if (data && !hasInit) {
      setForm(fromDto(data));
      setHasInit(true);
    }
  }, [data, hasInit]);

  const onReset = () => {
    setForm(fromDto(data));
    setSaveError(null);
  };

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveBranding(TENANT_ID, {
        logoUrl: form.logoUrl || null,
        faviconUrl: form.faviconUrl || null,
        primaryColor: form.primaryColor || null,
        secondaryColor: form.secondaryColor || null,
        accentColor: form.accentColor || null,
        backgroundColor: form.backgroundColor || null,
        headingFont: form.headingFont || null,
        bodyFont: form.bodyFont || null,
        loginWelcome: { vi: form.loginWelcomeVi, en: form.loginWelcomeEn },
        bookingTagline: { vi: form.bookingTaglineVi, en: form.bookingTaglineEn },
        emailLogoUrl: form.emailLogoUrl || null,
        emailHeaderBg: form.emailHeaderBg || null,
        emailFooter: { vi: form.emailFooterVi, en: form.emailFooterEn }
      });
      await refetch();
    } catch (e) {
      setSaveError((e as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const colorRow: Array<{ key: 'primary' | 'secondary' | 'accent' | 'background'; field: keyof FormState }> = [
    { key: 'primary',    field: 'primaryColor' },
    { key: 'secondary',  field: 'secondaryColor' },
    { key: 'accent',     field: 'accentColor' },
    { key: 'background', field: 'backgroundColor' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="btn-ghost" disabled={saving || loading}>
            <RefreshCw className="h-4 w-4" /> {t('actions.reset')}
          </button>
          <button onClick={() => void onSave()} className="btn-primary" disabled={saving || loading}>
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

      {saveError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {saveError}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Logo + Favicon URLs */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <ImageIcon className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('logo.title')}</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('logo.primaryLabel')}</p>
                <p className="text-xs text-brand-textmuted mb-3">{t('logo.primaryHint')}</p>
                <input
                  value={form.logoUrl}
                  onChange={e => setForm(s => ({ ...s, logoUrl: e.target.value }))}
                  placeholder="https://cdn.example.com/logo.png"
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm font-mono text-brand-textmain outline-none focus:border-brand-gold focus:bg-white"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('logo.faviconLabel')}</p>
                <p className="text-xs text-brand-textmuted mb-3">{t('logo.faviconHint')}</p>
                <input
                  value={form.faviconUrl}
                  onChange={e => setForm(s => ({ ...s, faviconUrl: e.target.value }))}
                  placeholder="https://cdn.example.com/favicon.ico"
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm font-mono text-brand-textmain outline-none focus:border-brand-gold focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* Brand colors */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Palette className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('colors.title')}</h2>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colorRow.map(({ key, field }) => (
                <div key={key}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">
                    {t(`colors.${key}` as 'colors.primary')}
                  </p>
                  <div className="flex items-center rounded-xl border border-brand-cream bg-brand-ivory p-2 hover:border-brand-gold transition">
                    <input
                      type="color"
                      value={form[field] as string}
                      onChange={e => setForm(s => ({ ...s, [field]: e.target.value }))}
                      className="h-7 w-7 rounded-full border-0 bg-transparent cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={form[field] as string}
                      onChange={e => setForm(s => ({ ...s, [field]: e.target.value }))}
                      className="ml-2 flex-1 bg-transparent font-mono text-sm uppercase text-brand-textmain outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-brand-textmuted mt-2">{t(`colors.${key}Hint` as 'colors.primaryHint')}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Type className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('typography.title')}</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('typography.heading')}</p>
                <select
                  value={form.headingFont}
                  onChange={e => setForm(s => ({ ...s, headingFont: e.target.value }))}
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm font-serif text-brand-textmain"
                >
                  {headingFonts.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <p className="font-serif text-2xl text-brand-textmain mt-4 rounded-xl border border-brand-cream bg-brand-ivory/50 p-4 text-center">
                  {t('typography.headingPreview')}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('typography.body')}</p>
                <select
                  value={form.bodyFont}
                  onChange={e => setForm(s => ({ ...s, bodyFont: e.target.value }))}
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm text-brand-textmain"
                >
                  {bodyFonts.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <p className="text-sm text-brand-textmain mt-4 leading-relaxed rounded-xl border border-brand-cream bg-brand-ivory/50 p-4 text-center">
                  {t('typography.bodyPreview')}
                </p>
              </div>
            </div>
          </section>

          {/* Login + Booking copy */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Layout className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('login.title')}</h3>
              </header>
              <Field label={`${t('login.welcome')} (vi)`}
                value={form.loginWelcomeVi}
                onChange={v => setForm(s => ({ ...s, loginWelcomeVi: v }))} />
              <div className="mt-3">
                <Field label={`${t('login.welcome')} (en)`}
                  value={form.loginWelcomeEn}
                  onChange={v => setForm(s => ({ ...s, loginWelcomeEn: v }))} />
              </div>
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('booking.title')}</h3>
              </header>
              <Field label={`${t('booking.tagline')} (vi)`}
                value={form.bookingTaglineVi}
                onChange={v => setForm(s => ({ ...s, bookingTaglineVi: v }))} />
              <div className="mt-3">
                <Field label={`${t('booking.tagline')} (en)`}
                  value={form.bookingTaglineEn}
                  onChange={v => setForm(s => ({ ...s, bookingTaglineEn: v }))} />
              </div>
            </div>
          </section>

          {/* Email */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('email.title')}</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('email.headerLogo')}</p>
                <input
                  value={form.emailLogoUrl}
                  onChange={e => setForm(s => ({ ...s, emailLogoUrl: e.target.value }))}
                  placeholder="https://cdn.example.com/email-logo.png"
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm font-mono text-brand-textmain outline-none focus:border-brand-gold focus:bg-white"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('email.headerBg')}</p>
                <div className="flex items-center rounded-xl border border-brand-cream bg-brand-ivory p-2">
                  <input
                    type="color"
                    value={form.emailHeaderBg}
                    onChange={e => setForm(s => ({ ...s, emailHeaderBg: e.target.value }))}
                    className="h-6 w-6 rounded-md border-0 bg-transparent cursor-pointer p-0"
                  />
                  <input
                    value={form.emailHeaderBg}
                    onChange={e => setForm(s => ({ ...s, emailHeaderBg: e.target.value }))}
                    className="ml-2 flex-1 bg-transparent font-mono text-xs uppercase text-brand-textmain outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('email.footer')} (vi)</p>
                <textarea
                  value={form.emailFooterVi}
                  onChange={e => setForm(s => ({ ...s, emailFooterVi: e.target.value }))}
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-xs text-brand-textmain h-20 resize-none outline-none focus:border-brand-gold focus:bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('email.footer')} (en)</p>
                <textarea
                  value={form.emailFooterEn}
                  onChange={e => setForm(s => ({ ...s, emailFooterEn: e.target.value }))}
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-xs text-brand-textmain h-20 resize-none outline-none focus:border-brand-gold focus:bg-white"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Preview */}
        <div className="xl:col-span-1">
          <section className="sticky top-8 rounded-2xl border border-brand-cream bg-brand-cream/20 p-6">
            <h3 className="font-serif text-xl text-brand-textmain mb-1">{t('preview.title')}</h3>
            <p className="text-xs text-brand-textmuted mb-5">{t('preview.subtitle')}</p>

            <div className="relative rounded-2xl border border-brand-cream bg-white overflow-hidden h-[420px] flex flex-col shadow-soft">
              <div className="flex items-center justify-between bg-white border-b border-brand-cream px-4 py-3">
                <div className="flex items-center gap-2">
                  <Flower className="h-4 w-4" style={{ color: form.primaryColor }} />
                  <span className="font-serif text-[10px] font-bold tracking-widest uppercase text-brand-textmain">
                    Brand Preview
                  </span>
                </div>
              </div>
              <div className="h-28 flex items-center justify-center shrink-0" style={{ backgroundColor: form.secondaryColor }}>
                <div className="text-center">
                  <h4 className="font-serif text-sm text-brand-textmain">{form.bookingTaglineVi || t('booking.pageTitle')}</h4>
                  <p className="text-[9px] italic text-brand-textmuted mt-1">{form.bookingTaglineEn || ''}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: form.backgroundColor }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-textmuted mb-3">
                  {t('preview.selectService')}
                </p>
              </div>
              <div
                className="absolute bottom-4 left-4 right-4 rounded-full text-white text-[10px] text-center font-medium py-2.5 shadow-md"
                style={{ backgroundColor: form.primaryColor }}
              >
                {t('preview.bookButton')}
              </div>
            </div>

            <p className="mt-3 text-center text-[10px] text-brand-textmuted inline-flex items-center justify-center gap-1 w-full">
              <RefreshCw className="h-3 w-3" /> {t('preview.realtime')}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-brand-ivory border border-brand-cream rounded-xl px-3 py-2 text-sm text-brand-textmain outline-none focus:border-brand-gold focus:bg-white"
      />
    </label>
  );
}
