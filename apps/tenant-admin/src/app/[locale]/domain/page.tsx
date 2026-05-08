import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Link2, Globe, ShieldCheck, Lock, Share2, Clock, Check, RefreshCw,
  Copy, ExternalLink, ChevronRight, ArrowRight, CheckCircle, Flower
} from 'lucide-react';

export default async function DomainPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('domain');

  const security = [
    { key: 'forceHttps',   on: true,  locked: true  },
    { key: 'redirectOld',  on: true,  locked: false },
    { key: 'protection',   on: false, locked: false }
  ] as const;

  const branchLinks = [
    { name: 'Natural Beauty — District 1', url: 'https://booking.naturalbeauty.vn/district-1' },
    { name: 'Natural Beauty — Westside',   url: 'https://booking.naturalbeauty.vn/westside'   }
  ];

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">{t('actions.cancel')}</button>
          <button className="btn-primary"><Check className="h-4 w-4" /> {t('actions.save')}</button>
        </div>
      </header>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Left column */}
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
                <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted font-semibold mb-1.5">{t('subdomain.label')}</label>
                <div className="flex rounded-xl overflow-hidden border border-brand-cream focus-within:border-brand-gold transition">
                  <input
                    defaultValue="natural-beauty"
                    className="flex-1 bg-brand-ivory px-3 py-2 text-sm font-medium text-brand-textmain outline-none"
                  />
                  <span className="flex items-center px-3 bg-brand-cream/50 text-brand-textmuted text-sm font-mono">
                    {t('subdomain.suffix')}
                  </span>
                </div>
              </div>
              <button className="btn-ghost shrink-0">{t('actions.checkAvailability')}</button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
              <CheckCircle className="h-4 w-4" /> {t('subdomain.available')}
            </p>
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {t('custom.connected')}
              </span>
            </header>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted font-semibold mb-1.5">{t('custom.label')}</label>
                <div className="flex rounded-xl overflow-hidden border border-brand-cream focus-within:border-brand-gold transition">
                  <span className="flex items-center px-3 bg-brand-ivory border-r border-brand-cream text-brand-textmuted text-xs font-mono">
                    <Lock className="h-3 w-3 mr-1" /> https://
                  </span>
                  <input
                    defaultValue="booking.naturalbeauty.vn"
                    className="flex-1 bg-white px-3 py-2 text-sm font-mono font-medium text-brand-textmain outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-ghost">{t('actions.disconnect')}</button>
                <button className="btn-primary"><RefreshCw className="h-4 w-4" /> {t('actions.verify')}</button>
              </div>
            </div>
          </section>

          {/* SSL + Security row */}
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
                <p className="font-serif text-2xl text-emerald-600 mt-1">{t('ssl.statusValue')}</p>
                <p className="text-xs text-brand-textmuted mt-1.5 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {t('ssl.renewIn', { days: 245 })}
                </p>
              </div>
              <button className="btn-ghost w-full justify-center">{t('actions.renew')}</button>
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('security.title')}</h3>
              </header>
              <ul className="space-y-4">
                {security.map(s => (
                  <li key={s.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-textmain">{t(`security.${s.key}` as 'security.forceHttps')}</p>
                      <p className="text-[10px] text-brand-textmuted mt-0.5">{t(`security.${s.key}Hint` as 'security.forceHttpsHint')}</p>
                    </div>
                    <span className={`inline-flex h-6 w-11 items-center rounded-full transition ${s.on ? 'bg-brand-gold' : 'bg-brand-cream'} ${s.locked ? 'opacity-70' : ''}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${s.on ? 'translate-x-6' : 'translate-x-1'}`} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Public booking links */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Share2 className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('links.title')}</h2>
            </header>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-brand-cream bg-brand-ivory/60 px-4 py-3 hover:border-brand-gold/50 transition">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmain mb-0.5">{t('links.main')}</p>
                  <p className="font-mono text-sm text-brand-gold">https://booking.naturalbeauty.vn/</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-xl border border-brand-cream bg-white text-brand-textmuted hover:text-brand-gold transition" title={t('links.copy')}><Copy className="h-4 w-4" /></button>
                  <button className="p-2 rounded-xl border border-brand-cream bg-white text-brand-textmuted hover:text-brand-gold transition" title={t('links.open')}><ExternalLink className="h-4 w-4" /></button>
                </div>
              </div>

              {branchLinks.map(b => (
                <div key={b.url} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-brand-cream bg-white px-4 py-3 hover:border-brand-gold/50 transition">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-0.5">{b.name}</p>
                    <p className="font-mono text-sm text-brand-textmain">{b.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-xl border border-brand-cream bg-brand-ivory text-brand-textmuted hover:text-brand-gold transition" title={t('links.copy')}><Copy className="h-4 w-4" /></button>
                    <button className="p-2 rounded-xl border border-brand-cream bg-brand-ivory text-brand-textmuted hover:text-brand-gold transition" title={t('links.open')}><ExternalLink className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column: guide + preview */}
        <div className="xl:col-span-1 space-y-6">
          <section className="rounded-2xl border border-brand-cream bg-brand-cream/20 p-6">
            <h3 className="font-serif text-xl text-brand-textmain mb-1">{t('guide.title')}</h3>
            <p className="text-xs text-brand-textmuted mb-5">{t('guide.subtitle')}</p>

            <ol className="space-y-5">
              <li className="relative pl-8">
                <span className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center">1</span>
                <p className="text-sm font-medium text-brand-textmain mb-1">{t('guide.step1Title')}</p>
                <p className="text-xs text-brand-textmuted leading-relaxed">{t('guide.step1Desc')}</p>
              </li>

              <li className="relative pl-8">
                <span className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center">2</span>
                <p className="text-sm font-medium text-brand-textmain mb-2">{t('guide.step2Title')}</p>
                <div className="rounded-xl border border-brand-cream bg-white px-3 py-2 font-mono text-xs space-y-1.5">
                  <div className="flex justify-between border-b border-brand-cream/60 pb-1">
                    <span className="font-sans text-[9px] uppercase tracking-wider text-brand-textmuted">{t('guide.step2Type')}</span>
                    <span className="text-brand-textmain">CNAME</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-cream/60 pb-1">
                    <span className="font-sans text-[9px] uppercase tracking-wider text-brand-textmuted">{t('guide.step2Host')}</span>
                    <span className="text-brand-textmain">booking</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-[9px] uppercase tracking-wider text-brand-textmuted">{t('guide.step2Value')}</span>
                    <span className="text-brand-gold truncate ml-2">domains.kaoriplatform.com</span>
                  </div>
                </div>
              </li>

              <li className="relative pl-8">
                <span className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center">3</span>
                <p className="text-sm font-medium text-brand-textmain mb-1">{t('guide.step3Title')}</p>
                <p className="text-xs text-brand-textmuted leading-relaxed">{t('guide.step3Desc')}</p>
              </li>
            </ol>

            <div className="mt-5 pt-4 border-t border-brand-cream text-center">
              <a href="#" className="inline-flex items-center text-xs font-medium text-brand-gold hover:opacity-80 transition">
                {t('actions.readDocs')} <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </section>

          {/* Live preview */}
          <section className="rounded-2xl border border-brand-cream bg-brand-ivory p-6 shadow-soft">
            <h3 className="font-serif text-xl text-brand-textmain mb-1">{t('preview.title')}</h3>
            <p className="text-xs text-brand-textmuted mb-5">{t('preview.subtitle')}</p>

            <div className="rounded-2xl border border-brand-cream bg-white overflow-hidden h-[400px] flex flex-col shadow-soft">
              <div className="flex items-center gap-2 bg-brand-ivory border-b border-brand-cream px-3 py-2">
                <span className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </span>
                <div className="flex-1 mx-2 rounded-md bg-white border border-brand-cream px-2 py-1 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span className="font-mono text-[9px] text-brand-textmain">booking.naturalbeauty.vn</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white border-b border-brand-cream px-4 py-3">
                <div className="flex items-center gap-2">
                  <Flower className="h-4 w-4 text-brand-gold" />
                  <span className="font-serif text-[10px] font-bold tracking-widest uppercase text-brand-textmain">Natural Beauty</span>
                </div>
                <ChevronRight className="h-3 w-3 text-brand-textmuted" />
              </div>

              <div className="flex-1 overflow-y-auto bg-brand-ivory p-4">
                <div className="text-center mb-4">
                  <h4 className="font-serif text-sm text-brand-textmain">{t('preview.heading')}</h4>
                  <p className="text-[10px] text-brand-textmuted">{t('preview.selectLocation')}</p>
                </div>
                <div className="space-y-2">
                  {branchLinks.map(b => (
                    <div key={b.url} className="rounded-xl border border-brand-cream bg-white p-3 shadow-sm">
                      <p className="font-serif text-xs text-brand-textmain">{b.name}</p>
                      <p className="text-[9px] text-brand-textmuted mt-0.5 font-mono">{b.url.replace('https://', '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
