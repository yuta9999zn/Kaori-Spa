import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Package, Zap, Crown } from 'lucide-react';

type Pkg = {
  id: string;
  name: string;
  used: number;
  total: number;
  expiry: string;
  price: string;
  status: 'active' | 'expired' | 'completed';
};

export default async function CustomerMembershipPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customerMembership');

  // TODO(Phase B): wire to backend when endpoint ships
  const active: Pkg[] = [
    { id: 'PKG-1024', name: 'Relaxation Package', used: 5, total: 10, expiry: '12/12/2026', price: '$300.00', status: 'active' },
    { id: 'PKG-1018', name: 'Laser Hair Removal', used: 3, total: 6, expiry: '30/06/2026', price: '$380.00', status: 'active' }
  ];
  const history: Pkg[] = [
    { id: 'PKG-0810', name: 'Spring Detox Bundle', used: 5, total: 5, expiry: '10/03/2025', price: '$250.00', status: 'completed' },
    { id: 'PKG-0780', name: 'Holiday Special', used: 2, total: 4, expiry: '31/12/2024', price: '$200.00', status: 'expired' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">JD</div>
          <div>
            <h1 className="font-serif text-3xl text-brand-textmain">John Doe</h1>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Zap className="h-4 w-4" /> {t('useSession')}</button>
          <button className="btn-primary"><Package className="h-4 w-4" /> {t('addPackage')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.activePackages')} value="2" />
        <KpiTile label={t('kpi.sessionsRemaining')} value="5" hint={t('ofTotal', { total: 16 })} accent="gold" />
        <KpiTile label={t('kpi.expiredPackages')} value="1" />
        <KpiTile label={t('kpi.totalValue')} value="$680.00" />
        <KpiTile label={t('kpi.membershipDiscount')} value="10%" hint={t('allServices')} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
              <h2 className="font-serif text-lg text-brand-textmain">{t('activePackages')}</h2>
            </div>
            <ul className="divide-y divide-brand-cream/60">
              {active.map(p => (
                <li key={p.id} className="px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-serif text-brand-textmain text-base">{p.name}</p>
                      <p className="text-[10px] font-mono text-brand-textmuted">{p.id}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                      {t('status.active')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{t('sessionUsage')}</p>
                      <p className="font-serif text-brand-gold text-base font-bold">{p.used} / {p.total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{t('expiry')}</p>
                      <p className="font-medium text-brand-textmain">{p.expiry}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{t('price')}</p>
                      <p className="font-serif text-brand-textmain">{p.price}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
              <h2 className="font-serif text-lg text-brand-textmain">{t('packageHistory')}</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.package')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('cols.price')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.usage')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.endDate')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {history.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-serif text-brand-textmain">{p.name}</td>
                    <td className="px-4 py-3 text-right font-serif">{p.price}</td>
                    <td className="px-4 py-3 text-center text-brand-textmuted">{p.used}/{p.total}</td>
                    <td className="px-4 py-3 text-brand-textmuted">{p.expiry}</td>
                    <td className="px-4 py-3"><StatusBadge s={p.status} label={t(`status.${p.status}`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-gold to-brand-rose p-6 shadow-premium text-white">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-serif uppercase tracking-widest">Kaori</h4>
              <Crown className="h-5 w-5" />
            </div>
            <p className="font-serif text-xl tracking-wider mb-1">John Doe</p>
            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-4">{t('validThru')} 12/26</p>
            <div className="text-[10px] uppercase tracking-widest opacity-80">{t('memberLevel')}</div>
            <p className="font-serif text-2xl">Gold Member</p>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h5 className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted border-b border-brand-cream pb-2 mb-3">{t('activeBenefits')}</h5>
            <ul className="space-y-2 text-sm text-brand-textmain">
              <li>{t('benefit.discount')}</li>
              <li>{t('benefit.priority')}</li>
              <li>{t('benefit.birthday')}</li>
              <li>{t('benefit.refer')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: 'gold' }) {
  const labelCls = accent === 'gold' ? 'text-brand-gold' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
      {hint && <p className="text-[10px] text-brand-textmuted mt-1">{hint}</p>}
    </div>
  );
}

function StatusBadge({ s, label }: { s: Pkg['status']; label: string }) {
  const cls =
    s === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
