import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Star, Gift, SlidersHorizontal, ArrowUpRight, ArrowDownLeft, Crown, Check } from 'lucide-react';

type TxType = 'earned' | 'redeemed' | 'manual' | 'expired';

type Tx = {
  id: string;
  date: string;
  type: TxType;
  source: string;
  delta: number;
  balance: number;
  notes: string;
};

export default async function CustomerLoyaltyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  const t = await getTranslations('customerLoyalty');

  // TODO(Phase B): wire to backend when endpoint ships
  const txns: Tx[] = [
    { id: 'LP-1024', date: '10/03/2026', type: 'earned', source: 'BK-10425', delta: 20, balance: 320, notes: t('rules.standardRate') },
    { id: 'LP-0985', date: '14/02/2026', type: 'redeemed', source: t('rewards.discount'), delta: -100, balance: 300, notes: t('redeemFor10') },
    { id: 'LP-0812', date: '05/01/2026', type: 'manual', source: t('managerDiscretion'), delta: 50, balance: 400, notes: t('referralBonus') },
    { id: 'LP-0750', date: '31/12/2025', type: 'expired', source: t('systemAuto'), delta: -15, balance: 350, notes: t('expiredNote') }
  ];

  const rewards = [
    { name: t('rewards.discount'), sub: t('rewards.applyAtCheckout'), pts: 100, available: true },
    { name: t('rewards.essentialOil'), sub: t('rewards.retailProduct'), pts: 150, available: true },
    { name: t('rewards.facial'), sub: t('rewards.facialDuration'), pts: 500, available: false }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">JD</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl text-brand-textmain">John Doe</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                <Crown className="w-3 h-3 mr-1" /> {t('goldMember')}
              </span>
            </div>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><SlidersHorizontal className="h-4 w-4" /> {t('adjust')}</button>
          <button className="btn-primary"><Gift className="h-4 w-4" /> {t('redeem')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiTile label={t('kpi.balance')} value="320" icon={<Star className="h-4 w-4" />} accent />
        <KpiTile label={t('kpi.totalEarned')} value="1,540" />
        <KpiTile label={t('kpi.totalRedeemed')} value="1,220" />
        <KpiTile label={t('kpi.expiringSoon')} value="40" hint={t('kpi.next30d')} warn />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 flex items-center justify-between bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('history')}</h2>
            <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
              <option>{t('typeAll')}</option>
              <option>{t('type.earned')}</option>
              <option>{t('type.redeemed')}</option>
              <option>{t('type.manual')}</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.date')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.typeSource')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.change')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.balance')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {txns.map(x => (
                  <tr key={x.id} className="hover:bg-brand-ivory/30">
                    <td className="px-4 py-3">
                      <p className="text-brand-textmain">{x.date}</p>
                      <p className="text-[10px] font-mono text-brand-textmuted">{x.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TxTypeBadge type={x.type} label={t(`type.${x.type}`)} />
                      <p className="text-[10px] text-brand-textmuted mt-1">{x.source}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold inline-flex items-center justify-center ${x.delta > 0 ? 'text-green-600' : 'text-brand-textmain'}`}>
                        {x.delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> : <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />}
                        {x.delta > 0 ? `+${x.delta}` : x.delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-serif">{x.balance}</td>
                    <td className="px-4 py-3 text-xs text-brand-textmuted">{x.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#4A443E] text-white p-6 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif uppercase tracking-widest text-brand-gold text-sm">{t('loyaltyCard')}</h3>
              <Star className="h-5 w-5 text-brand-gold" />
            </div>
            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">{t('availablePoints')}</p>
            <div className="flex items-end gap-3">
              <span className="font-serif text-5xl text-brand-gold font-bold">320</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 mb-1.5">{t('valueApprox', { value: '$32.00' })}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3">
              <Gift className="h-4 w-4 mr-2 text-brand-gold" /> {t('rewardCatalog')}
            </h3>
            <div className="space-y-3">
              {rewards.map(r => (
                <div key={r.name} className={`rounded-xl border border-brand-cream p-3 flex items-center justify-between ${r.available ? 'bg-brand-ivory/40 hover:border-brand-gold cursor-pointer' : 'opacity-60'}`}>
                  <div>
                    <p className="text-sm font-medium text-brand-textmain">{r.name}</p>
                    <p className="text-[10px] text-brand-textmuted mt-0.5">{r.sub}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${r.available ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {r.pts} {t('pts')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/30 p-5">
            <h4 className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-3">{t('howEarned')}</h4>
            <ul className="text-sm text-brand-textmain space-y-2">
              <li className="flex items-start"><Check className="h-4 w-4 text-brand-gold mr-2 mt-0.5" />{t('rules.standardRate')}</li>
              <li className="flex items-start"><Check className="h-4 w-4 text-brand-gold mr-2 mt-0.5" />{t('rules.retailBonus')}</li>
              <li className="flex items-start"><Check className="h-4 w-4 text-brand-gold mr-2 mt-0.5" />{t('rules.expiry')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, hint, accent, warn, icon }: { label: string; value: string; hint?: string; accent?: boolean; warn?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5 ${accent ? 'text-brand-gold' : warn ? 'text-brand-rose' : 'text-brand-textmuted'}`}>
        {icon}{label}
      </p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
      {hint && <p className="text-[10px] text-brand-textmuted mt-1">{hint}</p>}
    </div>
  );
}

function TxTypeBadge({ type, label }: { type: TxType; label: string }) {
  const cls =
    type === 'earned' ? 'bg-green-50 text-green-700 border-green-200' :
    type === 'redeemed' ? 'bg-brand-gold/10 text-brand-goldhover border-brand-gold/30' :
    type === 'manual' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
