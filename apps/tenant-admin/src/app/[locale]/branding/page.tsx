// TODO(M3+): wire when platform-config service ships branding/asset endpoints.
import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Image as ImageIcon, Palette, Type, Layout, Calendar, Mail, Grid, RefreshCw, Check, Upload, Plus, Eye, Flower
} from 'lucide-react';

const colorTokens = [
  { key: 'primary',    hex: '#C9A87C' },
  { key: 'secondary',  hex: '#F4EFEA' },
  { key: 'accent',     hex: '#D9B8B5' },
  { key: 'background', hex: '#FAF9F6' }
] as const;

const headingFonts = ['Cinzel (Serif)', 'Playfair Display (Serif)', 'Cormorant (Serif)', 'Montserrat (Sans-Serif)'];
const bodyFonts    = ['Jost (Sans-Serif)', 'Lato (Sans-Serif)', 'Inter (Sans-Serif)', 'Open Sans (Sans-Serif)'];

export default async function BrandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('branding');

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><RefreshCw className="h-4 w-4" /> {t('actions.reset')}</button>
          <button className="btn-primary"><Check className="h-4 w-4" /> {t('actions.save')}</button>
        </div>
      </header>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Logo + Favicon */}
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
                <div className="rounded-xl border border-brand-cream bg-brand-ivory/40 p-4">
                  <div className="h-24 rounded-lg bg-white border border-brand-cream flex items-center justify-center mb-3">
                    <Flower className="h-7 w-7 text-brand-gold" strokeWidth={1.5} />
                    <span className="font-serif text-lg tracking-widest text-brand-textmain ml-2">NATURAL BEAUTY</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg border border-brand-cream bg-white py-1.5 text-xs font-medium hover:border-brand-gold transition">{t('actions.replace')}</button>
                    <button className="flex-1 rounded-lg border border-brand-cream bg-white py-1.5 text-xs font-medium text-brand-rose hover:border-brand-rose transition">{t('actions.remove')}</button>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('logo.faviconLabel')}</p>
                <p className="text-xs text-brand-textmuted mb-3">{t('logo.faviconHint')}</p>
                <div className="rounded-xl border border-brand-cream bg-brand-ivory/40 p-4">
                  <div className="h-24 rounded-lg bg-white border border-brand-cream flex items-center justify-center mb-3">
                    <Flower className="h-8 w-8 text-brand-gold" strokeWidth={1.5} />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg border border-brand-cream bg-white py-1.5 text-xs font-medium hover:border-brand-gold transition">{t('actions.replace')}</button>
                    <button className="flex-1 rounded-lg border border-brand-cream bg-white py-1.5 text-xs font-medium text-brand-rose hover:border-brand-rose transition">{t('actions.remove')}</button>
                  </div>
                </div>
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
              {colorTokens.map(c => (
                <div key={c.key}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">
                    {t(`colors.${c.key}` as 'colors.primary')}
                  </p>
                  <div className="flex items-center rounded-xl border border-brand-cream bg-brand-ivory p-2 hover:border-brand-gold transition">
                    <span className="h-7 w-7 rounded-full border border-brand-cream shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="ml-3 font-mono text-sm uppercase text-brand-textmain">{c.hex}</span>
                  </div>
                  <p className="text-[10px] text-brand-textmuted mt-2">{t(`colors.${c.key}Hint` as 'colors.primaryHint')}</p>
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
                <select className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm font-serif text-brand-textmain">
                  {headingFonts.map(f => <option key={f}>{f}</option>)}
                </select>
                <p className="font-serif text-2xl text-brand-textmain mt-4 rounded-xl border border-brand-cream bg-brand-ivory/50 p-4 text-center">
                  {t('typography.headingPreview')}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('typography.body')}</p>
                <select className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm text-brand-textmain">
                  {bodyFonts.map(f => <option key={f}>{f}</option>)}
                </select>
                <p className="text-sm text-brand-textmain mt-4 leading-relaxed rounded-xl border border-brand-cream bg-brand-ivory/50 p-4 text-center">
                  {t('typography.bodyPreview')}
                </p>
              </div>
            </div>
          </section>

          {/* Login + Booking */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Layout className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('login.title')}</h3>
              </header>
              <Field label={t('login.welcome')} defaultValue="Chào mừng đến Natural Beauty" />
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mt-4 mb-2">{t('login.background')}</p>
              <button className="w-full h-20 rounded-xl border-2 border-dashed border-brand-cream hover:border-brand-gold bg-brand-ivory/40 text-brand-gold inline-flex flex-col items-center justify-center gap-1 text-xs font-medium transition">
                <Upload className="h-4 w-4" />
                {t('actions.uploadImage')}
              </button>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mt-4 mb-2">{t('login.overlay')}</p>
              <input type="range" defaultValue={40} className="w-full accent-brand-gold cursor-pointer" />
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
              <header className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl text-brand-textmain">{t('booking.title')}</h3>
              </header>
              <Field label={t('booking.pageTitle')} defaultValue="Đặt lịch trực tuyến" />
              <div className="mt-4">
                <Field label={t('booking.tagline')} defaultValue="Tìm sự bình yên trong bạn." />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mt-4 mb-2">{t('booking.banner')}</p>
              <button className="w-full h-24 rounded-xl border-2 border-dashed border-brand-cream hover:border-brand-gold bg-brand-ivory/40 text-brand-gold inline-flex flex-col items-center justify-center gap-1 text-xs font-medium transition">
                <ImageIcon className="h-5 w-5" />
                {t('actions.uploadBanner')}
                <span className="text-[9px] text-brand-textmuted">{t('booking.bannerHint')}</span>
              </button>
            </div>
          </section>

          {/* Email templates */}
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
                <div className="flex items-center justify-between rounded-xl border border-brand-cream bg-brand-ivory/40 px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <Flower className="h-4 w-4 text-brand-gold" />
                    <span className="font-serif text-xs font-bold tracking-widest text-brand-textmain">NATURAL BEAUTY</span>
                  </span>
                  <button className="text-[10px] font-medium text-brand-gold hover:opacity-80">{t('actions.replace')}</button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('email.headerBg')}</p>
                <div className="flex items-center rounded-xl border border-brand-cream bg-brand-ivory/40 p-2">
                  <span className="h-6 w-6 rounded-md border border-brand-cream bg-white" />
                  <span className="ml-3 font-mono text-xs uppercase text-brand-textmain">#FFFFFF</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('email.footer')}</p>
                <textarea
                  defaultValue="© 2026 Natural Beauty Spa. Mọi quyền được bảo lưu. Vui lòng đến trước giờ hẹn 15 phút."
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-xs text-brand-textmain h-20 resize-none outline-none focus:border-brand-gold focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* Asset library */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                  <Grid className="h-5 w-5" />
                </span>
                <h2 className="font-serif text-2xl text-brand-textmain">{t('assets.title')}</h2>
              </div>
              <button className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> {t('actions.uploadMedia')}</button>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[Flower, ImageIcon, ImageIcon].map((Icon, i) => (
                <div key={i} className="aspect-square rounded-xl border border-brand-cream bg-brand-cream/30 flex items-center justify-center group relative overflow-hidden">
                  <Icon className="h-10 w-10 text-brand-gold opacity-50" strokeWidth={1} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white">
                    <Eye className="h-4 w-4 mb-1" />
                    <span className="text-[10px]">{t('actions.view')}</span>
                  </div>
                </div>
              ))}
              <button className="aspect-square rounded-xl border-2 border-dashed border-brand-cream hover:border-brand-gold bg-brand-ivory text-brand-textmuted hover:text-brand-gold transition flex flex-col items-center justify-center">
                <Plus className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">{t('actions.addNew')}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right column: live preview */}
        <div className="xl:col-span-1">
          <section className="sticky top-8 rounded-2xl border border-brand-cream bg-brand-cream/20 p-6">
            <h3 className="font-serif text-xl text-brand-textmain mb-1">{t('preview.title')}</h3>
            <p className="text-xs text-brand-textmuted mb-5">{t('preview.subtitle')}</p>

            <div className="flex gap-1 rounded-full border border-brand-cream bg-white p-1 mb-5">
              <button className="flex-1 rounded-full bg-brand-gold/10 text-brand-gold py-1.5 text-xs font-medium">{t('preview.tabBooking')}</button>
              <button className="flex-1 rounded-full text-brand-textmuted hover:text-brand-textmain py-1.5 text-xs font-medium">{t('preview.tabDashboard')}</button>
              <button className="flex-1 rounded-full text-brand-textmuted hover:text-brand-textmain py-1.5 text-xs font-medium">{t('preview.tabEmail')}</button>
            </div>

            <div className="relative rounded-2xl border border-brand-cream bg-white overflow-hidden h-[440px] flex flex-col shadow-soft">
              <div className="flex items-center justify-between bg-white border-b border-brand-cream px-4 py-3">
                <div className="flex items-center gap-2">
                  <Flower className="h-4 w-4 text-brand-gold" />
                  <span className="font-serif text-[10px] font-bold tracking-widest uppercase text-brand-textmain">Natural Beauty</span>
                </div>
              </div>
              <div className="h-28 bg-brand-cream flex items-center justify-center shrink-0">
                <div className="text-center">
                  <h4 className="font-serif text-sm text-brand-textmain">{t('booking.pageTitle')}</h4>
                  <p className="text-[9px] italic text-brand-textmuted mt-1">{t('booking.tagline')}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-brand-ivory p-4">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-textmuted mb-3">{t('preview.selectService')}</p>
                <div className="space-y-2">
                  {[{ n: 'Signature Massage', d: '60 min • $120' }, { n: 'Hydrating Facial', d: '45 min • $95' }].map(s => (
                    <div key={s.n} className="rounded-xl border border-brand-cream bg-white px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-brand-textmain">{s.n}</p>
                        <p className="text-[9px] text-brand-rose font-medium mt-0.5">{s.d}</p>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                        <Plus className="h-3 w-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-full bg-brand-gold text-white text-[10px] text-center font-medium py-2.5 shadow-md">
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

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1 w-full bg-brand-ivory border border-brand-cream rounded-xl px-3 py-2 text-sm text-brand-textmain outline-none focus:border-brand-gold focus:bg-white"
      />
    </label>
  );
}
