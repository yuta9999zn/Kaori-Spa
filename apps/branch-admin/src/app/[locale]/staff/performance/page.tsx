import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Trophy, TrendingUp, Star, Clock, Users, Calendar } from 'lucide-react';

// TODO(Phase B): wire to backend `GET /v1/staff/performance?branchId=...&period=...`
const MOCK_KPIS = {
  totalServices: 542,
  avgRating: 4.78,
  onTimePct: 0.93,
  uniqueCustomers: 312,
  topPerformer: 'Nguyễn Khánh Linh',
  improvement: 0.12
};

const MOCK_TOP = [
  { id: 's1', name: 'Nguyễn Khánh Linh', nickname: 'miko', services: 142, rating: 4.92, revenue: 84_700_000, badge: 'gold' },
  { id: 's4', name: 'Nguyễn Lan Hương', nickname: 'hương', services: 128, rating: 4.84, revenue: 72_300_000, badge: 'silver' },
  { id: 's2', name: 'Phạm Thị Mai',     nickname: null,    services: 118, rating: 4.78, revenue: 65_100_000, badge: 'bronze' },
  { id: 's3', name: 'Lê Thị Yến',       nickname: 'yến',   services: 96,  rating: 4.65, revenue: 52_400_000, badge: null },
  { id: 's5', name: 'Trần Thị Bích',    nickname: null,    services: 64,  rating: 4.41, revenue: 36_800_000, badge: null }
] as const;

function fmtVnd(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

export default async function StaffPerformancePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('staff');
  const t = await getTranslations('staffPerformance');

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft">
            <option>{t('period.month')}</option>
            <option>{t('period.quarter')}</option>
            <option>{t('period.year')}</option>
          </select>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted flex items-center gap-1"><Calendar className="h-3 w-3" /> {t('kpi.totalServices')}</p>
          <p className="font-serif text-2xl mt-1 tabular-nums">{MOCK_KPIS.totalServices}</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted flex items-center gap-1"><Star className="h-3 w-3" /> {t('kpi.avgRating')}</p>
          <p className="font-serif text-2xl mt-1 text-brand-gold tabular-nums">{MOCK_KPIS.avgRating.toFixed(2)}</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted flex items-center gap-1"><Clock className="h-3 w-3" /> {t('kpi.onTime')}</p>
          <p className="font-serif text-2xl mt-1 text-emerald-700 tabular-nums">{(MOCK_KPIS.onTimePct * 100).toFixed(0)}%</p>
        </article>
        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted flex items-center gap-1"><Users className="h-3 w-3" /> {t('kpi.uniqueCustomers')}</p>
          <p className="font-serif text-2xl mt-1 tabular-nums">{MOCK_KPIS.uniqueCustomers}</p>
        </article>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leaderboard */}
        <div className="lg:col-span-2 rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between border-b border-brand-cream/50 pb-3">
            <h2 className="font-serif text-lg text-brand-textmain flex items-center gap-2">
              <Trophy className="h-4 w-4 text-brand-gold" /> {t('leaderboard.title')}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('leaderboard.subtitle')}</span>
          </div>
          <ul className="space-y-2">
            {MOCK_TOP.map((s, i) => (
              <li key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${
                i < 3 ? 'border-brand-gold/30 bg-brand-gold/5' : 'border-brand-cream/60 bg-brand-ivory/30'
              }`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm ${
                  s.badge === 'gold'   ? 'bg-amber-100 text-amber-700' :
                  s.badge === 'silver' ? 'bg-slate-100 text-slate-600' :
                  s.badge === 'bronze' ? 'bg-orange-100 text-orange-700' :
                                         'bg-brand-cream text-brand-textmuted'
                }`}>{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-textmain">
                    {s.name}
                    {s.nickname && <span className="ml-2 text-xs text-brand-textmuted">"{s.nickname}"</span>}
                  </p>
                  <p className="text-[11px] text-brand-textmuted">
                    {t('leaderboard.servicesCount', { n: s.services })} · {fmtVnd(s.revenue)}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-brand-gold text-brand-gold" />
                    <span className="font-medium text-sm">{s.rating.toFixed(2)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Highlights */}
        <aside className="rounded-2xl border border-brand-gold/30 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg text-brand-textmain mb-4 border-b border-brand-cream/50 pb-3">
            {t('highlight.title')}
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('highlight.topPerformer')}</p>
              <p className="font-serif text-lg text-brand-gold mt-1">{MOCK_KPIS.topPerformer}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('highlight.improvement')}</p>
              <p className="font-serif text-lg text-emerald-700 mt-1">+{(MOCK_KPIS.improvement * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-xl bg-brand-ivory/40 p-3 text-xs text-brand-textmuted">
              {t('highlight.tip')}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
