import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  LayoutGrid, ToggleRight, ToggleLeft, Sparkles, Layers, Zap, RefreshCw, ChevronRight,
  CalendarCheck, Heart, Users, PieChart, FileText, Megaphone, Package, UserPlus,
  Bot, TrendingUp, Map, Globe, Clock, BellRing
} from 'lucide-react';

type ModuleKey = 'booking' | 'services' | 'crm' | 'staff' | 'reports' | 'blog' | 'marketing' | 'inventory' | 'recruitment';
type ModuleStatus = 'enabled' | 'disabled' | 'premium';

const ModuleIcons: Record<ModuleKey, typeof CalendarCheck> = {
  booking:     CalendarCheck,
  services:    Sparkles,
  crm:         Heart,
  staff:       Users,
  reports:     PieChart,
  blog:        FileText,
  marketing:   Megaphone,
  inventory:   Package,
  recruitment: UserPlus
};

const ModuleAccent: Record<ModuleKey, string> = {
  booking:     'text-brand-gold',
  services:    'text-brand-rose',
  crm:         'text-blue-500',
  staff:       'text-emerald-600',
  reports:     'text-indigo-500',
  blog:        'text-brand-textmain',
  marketing:   'text-purple-500',
  inventory:   'text-amber-600',
  recruitment: 'text-gray-500'
};

export default async function FeaturePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('feature');

  const modules: Array<{ key: ModuleKey; status: ModuleStatus; requires?: boolean }> = [
    { key: 'booking',     status: 'enabled' },
    { key: 'services',    status: 'enabled' },
    { key: 'crm',         status: 'enabled' },
    { key: 'staff',       status: 'enabled' },
    { key: 'reports',     status: 'enabled' },
    { key: 'blog',        status: 'enabled' },
    { key: 'marketing',   status: 'disabled', requires: true },
    { key: 'inventory',   status: 'premium' },
    { key: 'recruitment', status: 'disabled' }
  ];

  const kpis = [
    { key: 'total',    value: 9, Icon: LayoutGrid,   tint: 'bg-brand-ivory text-brand-gold border-brand-cream' },
    { key: 'enabled',  value: 6, Icon: ToggleRight,  tint: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { key: 'disabled', value: 3, Icon: ToggleLeft,   tint: 'bg-brand-ivory text-brand-textmuted border-brand-cream' },
    { key: 'addons',   value: 3, Icon: Sparkles,     tint: 'bg-brand-gold text-white border-brand-gold/40' }
  ] as const;

  const statusStyles: Record<ModuleStatus, string> = {
    enabled:  'text-emerald-700 bg-emerald-50 border-emerald-200',
    disabled: 'text-brand-textmuted bg-brand-ivory border-brand-cream',
    premium:  'text-brand-gold bg-brand-gold/10 border-brand-gold/20'
  };

  const addons = [
    { key: 'ai',        Icon: Bot,        cta: 'activate' as const },
    { key: 'analytics', Icon: TrendingUp, cta: 'activate' as const },
    { key: 'multiloc',  Icon: Map,        cta: 'contactSales' as const, wide: true }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-2 max-w-xl">{t('subtitle')}</p>
        </div>
        <button className="btn-ghost"><RefreshCw className="h-4 w-4" /> {t('actions.reset')}</button>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map(({ key, value, Icon, tint }) => (
          <article key={key} className="kpi-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">
                {t(`kpi.${key}` as 'kpi.total')}
              </p>
              <h3 className="font-serif text-2xl text-brand-textmain">{value}</h3>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Left: module grid */}
        <div className="xl:col-span-2 space-y-10">
          <section>
            <h2 className="font-serif text-2xl text-brand-textmain mb-5 flex items-center gap-3">
              <Layers className="h-5 w-5 text-brand-gold" /> {t('section.core')}
            </h2>
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              {modules.map(m => {
                const Icon = ModuleIcons[m.key];
                const accent = ModuleAccent[m.key];
                const isActive = m.status === 'enabled';
                return (
                  <article
                    key={m.key}
                    className={`rounded-2xl border p-5 shadow-soft bg-white flex flex-col transition hover:shadow-premium ${
                      isActive ? 'border-brand-gold/30' : 'border-brand-cream/60'
                    }`}
                  >
                    <header className="flex items-start justify-between mb-3">
                      <span className={accent}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyles[m.status]}`}>
                        {t(`status.${m.status}` as 'status.enabled')}
                      </span>
                    </header>

                    <h3 className="font-serif text-lg text-brand-textmain mb-1">
                      {t(`modules.${m.key}.title` as 'modules.booking.title')}
                    </h3>
                    <p className="text-sm text-brand-textmuted flex-1">
                      {t(`modules.${m.key}.desc` as 'modules.booking.desc')}
                    </p>

                    {m.requires && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-brand-gold/20 bg-brand-gold/10 px-2.5 py-1.5 text-[10px] font-medium text-brand-gold">
                        {t('modules.marketing.requires')}
                      </p>
                    )}

                    <footer className="mt-4 pt-3 border-t border-brand-cream/60 flex items-center justify-between">
                      <button className={`inline-flex items-center text-sm font-medium ${
                        isActive ? 'text-brand-gold hover:opacity-80' : 'text-brand-textmuted hover:text-brand-textmain'
                      } transition`}>
                        {isActive ? t('actions.configure') : t('actions.viewDetails')}
                        {isActive && <ChevronRight className="h-4 w-4 ml-1" />}
                      </button>
                      <span className={`inline-flex h-5 w-9 items-center rounded-full transition ${isActive ? 'bg-brand-gold' : 'bg-brand-cream'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </span>
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-brand-textmain mb-5 flex items-center gap-3">
              <Zap className="h-5 w-5 text-brand-gold" /> {t('section.addons')}
            </h2>
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              {addons.map(({ key, Icon, cta, wide }) => (
                <article
                  key={key}
                  className={`relative overflow-hidden rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-white to-brand-gold/5 p-6 shadow-soft ${wide ? 'md:col-span-2' : ''}`}
                >
                  <Icon className="absolute right-2 top-2 h-28 w-28 text-brand-gold/10 pointer-events-none" />
                  <div className="relative max-w-md">
                    <h3 className="font-serif text-xl text-brand-textmain mb-2">
                      {t(`addons.${key}.title` as 'addons.ai.title')}
                    </h3>
                    <p className="text-sm text-brand-textmuted mb-5">
                      {t(`addons.${key}.desc` as 'addons.ai.desc')}
                    </p>
                    <div className="flex items-center gap-3">
                      <button className="btn-primary">
                        {t(`actions.${cta}` as 'actions.activate')}
                      </button>
                      <button className="text-sm font-medium text-brand-gold hover:opacity-80 transition">
                        {t('actions.learnMore')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Right: preview */}
        <aside className="xl:col-span-1">
          <section className="sticky top-8 rounded-2xl border border-brand-cream bg-brand-cream/20 p-6">
            <header className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl text-brand-textmain">{t('preview.title')}</h3>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-700">
                {t('status.active')}
              </span>
            </header>

            <div className="rounded-2xl border border-brand-cream bg-white p-5 text-center mb-5 shadow-sm">
              <span className="w-14 h-14 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto mb-3">
                <CalendarCheck className="h-7 w-7" />
              </span>
              <h4 className="font-serif text-lg text-brand-textmain">{t('modules.booking.title')}</h4>
              <p className="text-sm text-brand-textmuted mt-1">{t('modules.booking.desc')}</p>
            </div>

            <p className="text-xs uppercase tracking-wider font-bold text-brand-textmain mb-3">{t('preview.capabilities')}</p>
            <div className="space-y-3">
              {[
                { Icon: Globe,    tKey: 'cap1' as const },
                { Icon: Clock,    tKey: 'cap2' as const },
                { Icon: BellRing, tKey: 'cap3' as const }
              ].map(({ Icon, tKey }) => (
                <div key={tKey} className="flex items-start rounded-xl border border-brand-cream bg-white px-3 py-3 shadow-sm">
                  <Icon className="h-4 w-4 text-brand-gold mt-0.5 mr-3 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-brand-textmain">
                      {t(`preview.${tKey}Title` as 'preview.cap1Title')}
                    </p>
                    <p className="text-xs text-brand-textmuted mt-0.5">
                      {t(`preview.${tKey}Desc` as 'preview.cap1Desc')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
