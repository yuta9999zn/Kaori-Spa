import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Users, UserPlus, Activity, Award } from 'lucide-react';

type StaffActivity = {
  id: string;
  staff: string;
  initials: string;
  action: string;
  time: string;
};

type Performer = {
  initials: string;
  name: string;
  revenue: string;
  highlight?: boolean;
};

export default async function StaffOverviewPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('staff');
  const t = await getTranslations('staffOverview');

  // TODO(Phase B): wire to backend when endpoint ships
  const activities: StaffActivity[] = [
    { id: '1', staff: 'Anna N.', initials: 'AN', action: t('activity.checkedIn'), time: '08:30' },
    { id: '2', staff: 'Marcus C.', initials: 'MC', action: t('activity.completedShift'), time: '07:45' },
    { id: '3', staff: 'Elena R.', initials: 'ER', action: t('activity.onLeave'), time: t('today') }
  ];
  const topPerformers: Performer[] = [
    { initials: 'AN', name: 'Anna N.', revenue: '$5,200', highlight: true },
    { initials: 'ER', name: 'Elena R.', revenue: '$4,850' },
    { initials: 'MC', name: 'Marcus C.', revenue: '$4,100' }
  ];
  const branches = [
    { name: 'Quận 1', count: 14 },
    { name: 'Quận 7', count: 10 },
    { name: 'Thủ Đức', count: 8 }
  ];

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Users className="h-4 w-4" /> {t('viewAll')}</button>
          <button className="btn-primary"><UserPlus className="h-4 w-4" /> {t('addStaff')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiTile label={t('kpi.totalStaff')} value="32" />
        <KpiTile label={t('kpi.workingToday')} value="21" accent="green" />
        <KpiTile label={t('kpi.onLeave')} value="3" accent="rose" />
        <KpiTile label={t('kpi.newThisMonth')} value="2" accent="gold" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
          <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('workforceDistribution')}</h3>
          <ul className="space-y-2 mt-2 text-sm">
            <DistRow label={t('role.therapist')} count={18} />
            <DistRow label={t('role.receptionist')} count={6} />
            <DistRow label={t('role.manager')} count={4} />
            <DistRow label={t('role.support')} count={4} />
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
          <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('staffByBranch')}</h3>
          <ul className="space-y-2 mt-2 text-sm">
            {branches.map(b => (
              <li key={b.name} className="flex items-center justify-between">
                <span className="text-brand-textmain">{b.name}</span>
                <span className="font-serif text-xl text-brand-gold">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
          <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3"><Activity className="h-4 w-4 mr-2 text-brand-gold" /> {t('todayStatus')}</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-semibold text-green-600 mb-2">{t('checkedIn')}</h4>
              <div className="flex -space-x-2">
                {['MC', 'TL', 'AN'].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full bg-white border border-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">{i}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-semibold text-brand-rose mb-2">{t('onLeaveToday')}</h4>
              <div className="flex -space-x-2">
                {['ER'].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full bg-white border border-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">{i}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('recentActivity')}</h2>
          </div>
          <ul className="divide-y divide-brand-cream/60">
            {activities.map(a => (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">{a.initials}</div>
                <div className="flex-1">
                  <p className="text-sm text-brand-textmain"><span className="font-medium">{a.staff}</span> · {a.action}</p>
                </div>
                <span className="text-xs text-brand-textmuted">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
          <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-2"><Award className="h-4 w-4 mr-2 text-brand-gold" /> {t('topPerformers')}</h3>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-3">{t('thisMonth')}</p>
          <ul className="space-y-3">
            {topPerformers.map((p, idx) => (
              <li key={p.name} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center font-serif text-sm text-brand-textmain shadow-sm ${p.highlight ? 'border-2 border-brand-gold' : 'border border-brand-cream'}`}>{p.initials}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-textmain">{p.name}</p>
                  <p className="text-[10px] text-brand-textmuted">#{idx + 1}</p>
                </div>
                <p className={`font-serif font-semibold ${p.highlight ? 'text-brand-gold' : 'text-brand-textmain'}`}>{p.revenue}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: 'gold' | 'green' | 'rose' }) {
  const cls = accent === 'gold' ? 'text-brand-gold' : accent === 'green' ? 'text-green-600' : accent === 'rose' ? 'text-brand-rose' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cls}`}>{label}</p>
      <p className="font-serif text-3xl text-brand-textmain">{value}</p>
    </div>
  );
}

function DistRow({ label, count }: { label: string; count: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-brand-textmain">{label}</span>
      <span className="font-serif text-xl text-brand-gold">{count}</span>
    </li>
  );
}
