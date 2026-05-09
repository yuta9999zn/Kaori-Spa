import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Info,
  Globe,
  Tag,
  Calendar,
  Users,
  Sparkles,
  PieChart,
  Check,
  Building,
  Store,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// TODO(Phase B): wire to backend — POST /v1/roles via auth-service when ready.
// Form is read-only mock right now (no client-side state yet).

const SCOPES = [
  { value: 'tenant', Icon: Building, selected: false },
  { value: 'branch', Icon: Store,    selected: true  }
] as const;

const ASSIGN_TOGGLES = [
  { key: 'multiBranch',  enabled: false },
  { key: 'analytics',    enabled: true  },
  { key: 'dashboard',    enabled: true  },
  { key: 'booking',      enabled: true  }
] as const;

const PREVIEW_MODULES = [
  { key: 'bookings',  Icon: Calendar  },
  { key: 'customers', Icon: Users     },
  { key: 'services',  Icon: Sparkles  },
  { key: 'reports',   Icon: PieChart  }
] as const;

export default async function RoleFormPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('roleForm');

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      {/* Breadcrumbs */}
      <nav className="text-xs text-brand-textmuted flex items-center gap-2">
        <span>{t('crumbs.dashboard')}</span>
        <span>/</span>
        <span>{t('crumbs.roles')}</span>
        <span>/</span>
        <span className="text-brand-gold">{t('crumbs.create')}</span>
      </nav>

      {/* Page header */}
      <header className="kpi-card !p-8">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <p className="mt-2 text-sm text-brand-textmuted max-w-lg">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT: form fields */}
        <div className="xl:col-span-2 space-y-8">
          {/* Role information */}
          <section className="kpi-card !p-8">
            <header className="flex items-center gap-3 border-b border-brand-cream/60 pb-4 mb-6">
              <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Info className="h-5 w-5" /></span>
              <h2 className="font-serif text-xl text-brand-textmain">{t('info.title')}</h2>
            </header>
            <div className="space-y-5 text-sm">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">{t('info.name')}</label>
                <input
                  type="text"
                  defaultValue={t('info.namePlaceholder')}
                  className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-4 py-2.5 text-sm text-brand-textmain"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">{t('info.description')}</label>
                <textarea
                  defaultValue={t('info.descriptionPlaceholder')}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-brand-cream bg-brand-ivory px-4 py-2.5 text-sm text-brand-textmain"
                />
              </div>
            </div>
          </section>

          {/* Role scope */}
          <section className="kpi-card !p-8">
            <header className="flex items-center gap-3 border-b border-brand-cream/60 pb-4 mb-6">
              <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Globe className="h-5 w-5" /></span>
              <h2 className="font-serif text-xl text-brand-textmain">{t('scope.title')}</h2>
            </header>
            <p className="mb-5 text-sm text-brand-textmuted">{t('scope.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCOPES.map(s => (
                <article
                  key={s.value}
                  className={`rounded-2xl border-2 p-5 transition ${
                    s.selected
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-transparent bg-brand-ivory'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <s.Icon className="h-5 w-5 text-brand-textmain" />
                      <span className="font-serif text-base font-medium text-brand-textmain">
                        {t(`scope.options.${s.value}.label` as 'scope.options.tenant.label')}
                      </span>
                    </div>
                    {s.selected && <Check className="h-5 w-5 text-brand-gold" />}
                  </div>
                  <p className="pl-8 text-xs text-brand-textmuted leading-relaxed">
                    {t(`scope.options.${s.value}.desc` as 'scope.options.tenant.desc')}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Category tag */}
          <section className="kpi-card !p-8">
            <header className="flex items-center gap-3 border-b border-brand-cream/60 pb-4 mb-6">
              <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Tag className="h-5 w-5" /></span>
              <h2 className="font-serif text-xl text-brand-textmain">{t('category.title')}</h2>
            </header>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">{t('category.label')}</label>
              <select
                defaultValue="management"
                className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-4 py-2.5 text-sm text-brand-textmain"
              >
                <option value="management">{t('category.options.management')}</option>
                <option value="operations">{t('category.options.operations')}</option>
                <option value="marketing">{t('category.options.marketing')}</option>
                <option value="support">{t('category.options.support')}</option>
                <option value="custom">{t('category.options.custom')}</option>
              </select>
            </div>
          </section>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button className="btn-ghost">{t('actions.cancel')}</button>
            <button className="btn-primary">{t('actions.save')} <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* RIGHT: settings + preview */}
        <div className="xl:col-span-1 space-y-8">
          {/* Assignment settings */}
          <section className="kpi-card !p-6">
            <h2 className="font-serif text-lg text-brand-textmain border-b border-brand-cream/60 pb-3 mb-4">
              {t('assignment.title')}
            </h2>
            <ul className="space-y-5 text-sm">
              {ASSIGN_TOGGLES.map((tg, idx) => (
                <li
                  key={tg.key}
                  className={idx === ASSIGN_TOGGLES.length - 1 ? '' : 'border-b border-brand-cream/60 pb-4'}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-brand-textmain">
                        {t(`assignment.toggles.${tg.key}.label` as 'assignment.toggles.multiBranch.label')}
                      </p>
                      <p className="mt-1 text-[10px] text-brand-textmuted leading-tight">
                        {t(`assignment.toggles.${tg.key}.hint` as 'assignment.toggles.multiBranch.hint')}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${tg.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                      {tg.enabled ? t('assignment.on') : t('assignment.off')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Permission preview */}
          <section className="rounded-3xl border border-brand-cream/60 bg-brand-cream/20 p-6 shadow-inner">
            <h2 className="font-serif text-lg text-brand-textmain mb-1">{t('preview.title')}</h2>
            <p className="text-[10px] text-brand-textmuted leading-relaxed mb-5">{t('preview.subtitle')}</p>
            <ul className="space-y-3">
              {PREVIEW_MODULES.map(m => (
                <li key={m.key} className="flex items-center justify-between rounded-xl border border-brand-cream bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                      <m.Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-brand-textmain">
                      {t(`preview.modules.${m.key}` as 'preview.modules.bookings')}
                    </span>
                  </div>
                  <Check className="h-4 w-4 text-emerald-500" />
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-brand-cream/60 pt-4 text-center">
              <span className="inline-flex items-center text-xs font-medium text-brand-gold">
                {t('preview.advancedMatrix')} <ExternalLink className="ml-1.5 h-3 w-3" />
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
