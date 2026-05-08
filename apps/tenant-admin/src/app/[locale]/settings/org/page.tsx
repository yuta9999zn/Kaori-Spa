import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Building, MapPin, Sliders, Headphones, Check, Camera, Calendar, Users } from 'lucide-react';

export default async function OrgSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('orgSettings');

  const bookingSettings = [
    { key: 'leadTime',     value: '2 giờ',  type: 'text' },
    { key: 'cancelWindow', value: '24 giờ', type: 'text' },
    { key: 'depositPct',   value: '20%',    type: 'text' },
    { key: 'autoConfirm',  value: true,     type: 'toggle' }
  ] as const;

  const customerModules = [
    { key: 'loyalty',    enabled: true },
    { key: 'membership', enabled: true },
    { key: 'referral',   enabled: false },
    { key: 'feedback',   enabled: true }
  ] as const;

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button className="btn-primary"><Check className="h-4 w-4" /> {t('actions.save')}</button>
      </header>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Building className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('business.title')}</h2>
            </header>

            <div className="flex items-start gap-5 mb-6">
              <div className="relative w-24 h-24 rounded-2xl bg-brand-ivory border-2 border-dashed border-brand-cream flex items-center justify-center text-brand-gold cursor-pointer group">
                <Camera className="h-6 w-6" />
                <span className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 transition" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-textmain mb-1">{t('business.logoTitle')}</p>
                <p className="text-xs text-brand-textmuted mb-3">{t('business.logoHint')}</p>
                <button className="btn-ghost text-xs">{t('business.uploadLogo')}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('business.legalName')} defaultValue="Natural Beauty Co., Ltd." />
              <Field label={t('business.taxCode')} defaultValue="0123456789" />
              <Field label={t('business.email')}    defaultValue="hello@natural-beauty.vn" />
              <Field label={t('business.phone')}    defaultValue="+84 28 1234 5678" />
              <Field label={t('business.website')}  defaultValue="https://natural-beauty.vn" />
              <Field label={t('business.timezone')} defaultValue="Asia/Ho_Chi_Minh" />
            </div>
          </section>

          {/* Headquarters */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('hq.title')}</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label={t('hq.street')} defaultValue="100 Wellness Boulevard" />
              </div>
              <Field label={t('hq.ward')} defaultValue="Bến Nghé" />
              <Field label={t('hq.district')} defaultValue="Quận 1" />
              <Field label={t('hq.city')} defaultValue="TP. Hồ Chí Minh" />
              <Field label={t('hq.country')} defaultValue="Việt Nam" />
            </div>
          </section>

          {/* Global System Settings */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Sliders className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('system.title')}</h2>
            </header>

            <h3 className="text-sm font-semibold text-brand-textmain mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-gold" /> {t('system.bookingGroup')}
            </h3>
            <ul className="divide-y divide-brand-cream/60 mb-6">
              {bookingSettings.map(s => (
                <li key={s.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-textmain">{t(`system.booking.${s.key}` as 'system.booking.leadTime')}</p>
                    <p className="text-[11px] text-brand-textmuted mt-0.5">
                      {t(`system.booking.${s.key}Hint` as 'system.booking.leadTimeHint')}
                    </p>
                  </div>
                  {s.type === 'toggle'
                    ? <Toggle on={Boolean(s.value)} />
                    : <span className="text-sm font-mono text-brand-gold">{String(s.value)}</span>}
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-brand-textmain mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-gold" /> {t('system.customerGroup')}
            </h3>
            <ul className="divide-y divide-brand-cream/60">
              {customerModules.map(m => (
                <li key={m.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-textmain">{t(`system.modules.${m.key}` as 'system.modules.loyalty')}</p>
                    <p className="text-[11px] text-brand-textmuted mt-0.5">
                      {t(`system.modules.${m.key}Hint` as 'system.modules.loyaltyHint')}
                    </p>
                  </div>
                  <Toggle on={m.enabled} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <header className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Headphones className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-xl text-brand-textmain">{t('contact.title')}</h2>
            </header>
            <div className="space-y-3">
              <Field label={t('contact.publicEmail')} defaultValue="hello@natural-beauty.vn" />
              <Field label={t('contact.publicPhone')} defaultValue="1-800-NB-SPA" />
              <Field label={t('contact.facebook')} defaultValue="facebook.com/naturalbeauty" />
              <Field label={t('contact.instagram')} defaultValue="@natural.beauty.spa" />
            </div>
          </section>

          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-xl text-brand-textmain mb-1">{t('preview.title')}</h2>
            <p className="text-xs text-brand-textmuted mb-4">{t('preview.subtitle')}</p>
            <div className="rounded-xl border border-brand-cream bg-brand-ivory/40 p-4">
              <div className="text-center">
                <p className="font-serif text-sm text-brand-textmain">Natural Beauty</p>
                <p className="text-[10px] text-brand-textmuted italic mt-1">{t('preview.tagline')}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-brand-textmuted font-semibold">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1 w-full bg-brand-ivory border border-brand-cream rounded-xl px-3 py-2 text-sm text-brand-textmain outline-none focus:border-brand-gold focus:bg-white"
      />
    </label>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex h-6 w-11 items-center rounded-full transition ${on ? 'bg-brand-gold' : 'bg-brand-cream'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </span>
  );
}
