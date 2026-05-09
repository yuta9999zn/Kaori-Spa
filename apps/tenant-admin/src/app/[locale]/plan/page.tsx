import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Download,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  CheckCircle,
  BarChart,
  Infinity as InfinityIcon,
  Info,
  FileText,
  CreditCard,
  Receipt,
  Check
} from 'lucide-react';

type TierKey = 'starter' | 'professional' | 'enterprise';

type UsageMetric = {
  key: string;
  label: string;
  value: string;
  limit: string;
  percent: number;
  unlimited?: boolean;
  tone?: 'gold' | 'rose';
};

type Invoice = {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending';
};

type Tier = {
  key: TierKey;
  price: string;
  features: string[];
  current?: boolean;
};

export default async function PlanPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('plan');

  // TODO(Phase B): wire to backend (billing-service subscription + usage)
  const features: string[] = [
    t('current.features.branches', { count: 5 }),
    t('current.features.staff', { count: 50 }),
    t('current.features.customers'),
    t('current.features.analytics'),
    t('current.features.support')
  ];

  const usage: UsageMetric[] = [
    { key: 'staff', label: t('usage.staff'), value: '18', limit: '50', percent: 36, tone: 'gold' },
    { key: 'branches', label: t('usage.branches'), value: '3', limit: '5', percent: 60, tone: 'gold' },
    { key: 'storage', label: t('usage.storage'), value: '12 GB', limit: '50 GB', percent: 24, tone: 'rose' },
    { key: 'bookings', label: t('usage.bookings'), value: '1,240', limit: t('usage.unlimited'), percent: 100, unlimited: true, tone: 'gold' }
  ];

  const invoices: Invoice[] = [
    { id: 'INV-1023', date: '15/07/2026', amount: '1.890.000 ₫', status: 'paid' },
    { id: 'INV-1022', date: '15/06/2026', amount: '1.890.000 ₫', status: 'paid' },
    { id: 'INV-1021', date: '15/05/2026', amount: '1.890.000 ₫', status: 'paid' }
  ];

  const tiers: Tier[] = [
    {
      key: 'starter',
      price: t('tiers.starter.price'),
      features: [
        t('tiers.starter.f1'),
        t('tiers.starter.f2'),
        t('tiers.starter.f3'),
        t('tiers.starter.f4')
      ]
    },
    {
      key: 'professional',
      price: t('tiers.professional.price'),
      features: [
        t('tiers.professional.f1'),
        t('tiers.professional.f2'),
        t('tiers.professional.f3'),
        t('tiers.professional.f4'),
        t('tiers.professional.f5')
      ],
      current: true
    },
    {
      key: 'enterprise',
      price: t('tiers.enterprise.price'),
      features: [
        t('tiers.enterprise.f1'),
        t('tiers.enterprise.f2'),
        t('tiers.enterprise.f3'),
        t('tiers.enterprise.f4'),
        t('tiers.enterprise.f5')
      ]
    }
  ];

  return (
    <>
      <div className="text-xs text-brand-textmuted font-medium flex items-center gap-2 mb-4">
        <span>{t('breadcrumb.dashboard')}</span>
        <span>/</span>
        <span>{t('breadcrumb.settings')}</span>
        <span>/</span>
        <span className="text-brand-gold">{t('title')}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between bg-white p-8 rounded-3xl shadow-soft border border-brand-cream/60 relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-brand-gold/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-serif text-3xl text-brand-textmain tracking-wide">{t('title')}</h1>
          <p className="text-brand-textmuted mt-2 text-sm max-w-lg">{t('subtitle')}</p>
        </div>
        <div className="flex space-x-3 mt-6 md:mt-0 relative z-10">
          <button className="px-5 py-2.5 bg-brand-ivory text-brand-textmain border border-brand-cream hover:border-brand-gold hover:bg-white rounded-full text-sm font-medium transition shadow-sm flex items-center">
            <Download className="w-4 h-4 mr-2 text-brand-textmuted" /> {t('actions.downloadInvoice')}
          </button>
          <button className="px-6 py-2.5 bg-brand-gold text-white rounded-full hover:bg-brand-goldhover transition shadow-premium text-sm font-medium flex items-center">
            <ArrowUpCircle className="w-4 h-4 mr-2" /> {t('actions.upgrade')}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 overflow-hidden flex flex-col">
          <div className="h-32 bg-gradient-to-br from-brand-ivory to-brand-gold/10 p-8 flex items-center justify-between border-b border-brand-cream/50">
            <div>
              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
                {t('current.activeBadge')}
              </span>
              <h2 className="font-serif text-3xl text-brand-textmain">{t('professional')}</h2>
            </div>
            <div className="text-right">
              <div className="flex items-end justify-end">
                <span className="text-5xl font-serif text-brand-textmain font-medium leading-none">
                  {t('tiers.professional.priceShort')}
                </span>
              </div>
              <p className="text-sm text-brand-textmuted">{t('current.perMonth')}</p>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-brand-textmain mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-brand-gold" />
                {t('current.nextBilling')}: <span className="ml-1 text-brand-textmuted font-normal">15/08/2026</span>
              </p>
              <div className="h-px bg-brand-cream w-full my-6" />
              <h3 className="text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-4">
                {t('current.featuresTitle')}
              </h3>
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center text-sm text-brand-textmain">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-brand-gold shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-brand-cream flex justify-between items-center">
              <button className="text-sm font-medium text-brand-rose hover:text-red-600 transition">
                {t('actions.cancel')}
              </button>
              <button className="px-6 py-2.5 bg-brand-ivory text-brand-textmain border border-brand-cream hover:border-brand-gold rounded-full text-sm font-medium transition shadow-sm">
                {t('actions.changePlan')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 p-8 flex flex-col">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center mr-4 text-brand-gold">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('usage.title')}</h2>
              <p className="text-xs text-brand-textmuted mt-1">{t('usage.subtitle')}</p>
            </div>
          </div>
          <div className="space-y-7 flex-1">
            {usage.map(m => (
              <div key={m.key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-brand-textmain flex items-center">
                    {m.label}
                    {m.unlimited && <InfinityIcon className="w-4 h-4 ml-2 text-brand-gold" />}
                  </span>
                  <span className="text-brand-textmuted">
                    <span className="text-brand-textmain font-medium">{m.value}</span>
                    {m.unlimited ? ` (${m.limit})` : ` / ${m.limit}`}
                  </span>
                </div>
                <div className="w-full bg-brand-ivory rounded-full h-2.5 border border-brand-cream overflow-hidden">
                  {m.unlimited ? (
                    <div className="bg-gradient-to-r from-brand-gold/40 via-brand-gold to-brand-gold/40 h-full w-full opacity-50" />
                  ) : (
                    <div
                      className={`${m.tone === 'rose' ? 'bg-brand-rose' : 'bg-brand-gold'} h-full rounded-full`}
                      style={{ width: `${m.percent}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-brand-cream/30 rounded-xl border border-brand-cream flex items-start">
            <Info className="w-5 h-5 text-brand-gold shrink-0 mr-3 mt-0.5" />
            <p className="text-xs text-brand-textmuted leading-relaxed">{t('usage.scaleHint')}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl p-8 shadow-soft border border-brand-cream/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center mr-4 text-brand-gold">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('billing.title')}</h2>
            </div>
            <button className="text-sm font-medium text-brand-gold hover:text-brand-goldhover transition">
              {t('actions.edit')}
            </button>
          </div>
          <div className="space-y-4">
            <InfoRow label={t('billing.companyName')} value="Natural Beauty JSC" />
            <InfoRow
              label={t('billing.address')}
              value={'Tầng 12, Toà nhà Sunshine\n23 Nguyễn Thị Minh Khai, Quận 1\nTP. Hồ Chí Minh, Việt Nam'}
            />
            <InfoRow label={t('billing.taxId')} value="0312-345-678" mono />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-soft border border-brand-cream/60 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center mr-4 text-brand-gold">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('payment.title')}</h2>
            </div>
          </div>
          <div className="relative w-full max-w-sm mx-auto h-48 bg-gradient-to-tr from-brand-textmain to-[#2A2622] rounded-2xl shadow-lg p-6 flex flex-col justify-between text-white overflow-hidden mb-6">
            <div className="flex justify-between items-center">
              <CreditCard className="w-8 h-8 opacity-80" />
              <span className="font-bold italic text-lg opacity-90 tracking-wider">VISA</span>
            </div>
            <div className="space-y-4">
              <div className="flex space-x-4 font-mono text-xl tracking-widest opacity-90">
                <span>****</span>
                <span>****</span>
                <span>****</span>
                <span>4242</span>
              </div>
              <div className="flex justify-between items-end text-xs font-medium uppercase tracking-wider opacity-70">
                <div>
                  <p className="text-[8px] mb-0.5">{t('payment.holder')}</p>
                  <p>Sarah Miller</p>
                </div>
                <div>
                  <p className="text-[8px] mb-0.5">{t('payment.expires')}</p>
                  <p>12/28</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-auto flex space-x-3">
            <button className="flex-1 py-3 bg-brand-ivory text-brand-textmain border border-brand-cream hover:border-brand-gold rounded-xl text-sm font-medium transition shadow-sm">
              {t('payment.addBank')}
            </button>
            <button className="flex-1 py-3 bg-white text-brand-textmain border border-brand-cream hover:border-brand-gold rounded-xl text-sm font-medium transition shadow-sm">
              {t('payment.updateCard')}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 overflow-hidden mb-12">
        <div className="p-6 border-b border-brand-cream/50 bg-brand-ivory/30 flex justify-between items-center">
          <div className="flex items-center">
            <Receipt className="w-5 h-5 text-brand-gold mr-3" />
            <h2 className="font-serif text-xl text-brand-textmain">{t('invoices.title')}</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted bg-brand-ivory/50 border-b border-brand-cream">
                <th className="py-4 px-6 font-semibold">{t('invoices.cols.id')}</th>
                <th className="py-4 px-6 font-semibold">{t('invoices.cols.date')}</th>
                <th className="py-4 px-6 font-semibold">{t('invoices.cols.amount')}</th>
                <th className="py-4 px-6 font-semibold">{t('invoices.cols.status')}</th>
                <th className="py-4 px-6 font-semibold text-right">{t('invoices.cols.action')}</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-brand-cream/50">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-brand-ivory/40 transition">
                  <td className="py-4 px-6 font-mono text-brand-textmain">{inv.id}</td>
                  <td className="py-4 px-6 text-brand-textmuted">{inv.date}</td>
                  <td className="py-4 px-6 font-medium text-brand-textmain">{inv.amount}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-50 border border-green-200">
                      {t(`invoices.status.${inv.status}`)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-brand-gold hover:text-brand-goldhover font-medium text-sm flex items-center justify-end ml-auto">
                      <Download className="w-4 h-4 mr-1" /> {t('invoices.pdf')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl text-brand-textmain mb-2">{t('compare.title')}</h2>
          <p className="text-brand-textmuted">{t('compare.subtitle')}</p>
          <div className="inline-flex bg-white rounded-full p-1 border border-brand-cream shadow-sm mt-6">
            <button className="px-6 py-2 rounded-full text-sm font-medium text-brand-textmuted hover:text-brand-textmain transition">
              {t('compare.monthly')}
            </button>
            <button className="px-6 py-2 rounded-full text-sm font-medium bg-brand-gold/10 text-brand-gold">
              {t('compare.yearly')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map(tier => (
            <TierCard
              key={tier.key}
              name={t(tier.key)}
              tagline={t(`tiers.${tier.key}.tagline`)}
              price={tier.price}
              perMonth={t('current.perMonth')}
              features={tier.features}
              current={tier.current}
              currentLabel={t('compare.currentBadge')}
              activeLabel={t('compare.active')}
              ctaPrimary={tier.key === 'enterprise' ? t('compare.upgradeEnterprise') : undefined}
              ctaSecondary={tier.key === 'starter' ? t('compare.downgrade') : undefined}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-brand-ivory rounded-2xl p-5 border border-brand-cream">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">{label}</p>
      <p className={`text-sm text-brand-textmain leading-relaxed whitespace-pre-line ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function TierCard({
  name,
  tagline,
  price,
  perMonth,
  features,
  current,
  currentLabel,
  activeLabel,
  ctaPrimary,
  ctaSecondary
}: {
  name: string;
  tagline: string;
  price: string;
  perMonth: string;
  features: string[];
  current?: boolean;
  currentLabel: string;
  activeLabel: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}) {
  const containerCls = current
    ? 'border-2 border-brand-gold shadow-premium relative md:-translate-y-4'
    : 'border border-brand-cream hover:shadow-soft';
  return (
    <div className={`bg-white rounded-3xl p-8 ${containerCls} transition-shadow flex flex-col h-full`}>
      {current && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-gold text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
          {currentLabel}
        </div>
      )}
      <h3 className="font-serif text-xl text-brand-textmain mb-2">{name}</h3>
      <p className="text-xs text-brand-textmuted h-8 mb-4">{tagline}</p>
      <div className="mb-8">
        <span className={`font-serif ${current ? 'text-4xl text-brand-gold' : 'text-3xl text-brand-textmain'}`}>{price}</span>
        <span className="text-brand-textmuted text-sm"> / {perMonth}</span>
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className={`flex items-start text-sm text-brand-textmain ${current ? 'font-medium' : ''}`}>
            <Check className="w-4 h-4 mr-3 text-brand-gold shrink-0 mt-0.5" /> {f}
          </li>
        ))}
      </ul>
      {current ? (
        <button className="w-full py-3 bg-brand-gold/10 text-brand-gold cursor-default rounded-full font-medium shadow-sm flex justify-center items-center">
          <CheckCircle className="w-4 h-4 mr-2" /> {activeLabel}
        </button>
      ) : ctaPrimary ? (
        <button className="w-full py-3 bg-brand-gold text-white hover:bg-brand-goldhover rounded-full font-medium transition shadow-md">
          {ctaPrimary}
        </button>
      ) : (
        <button className="w-full py-3 bg-brand-ivory text-brand-textmain border border-brand-cream hover:border-brand-gold rounded-full font-medium transition shadow-sm">
          {ctaSecondary}
        </button>
      )}
    </div>
  );
}
