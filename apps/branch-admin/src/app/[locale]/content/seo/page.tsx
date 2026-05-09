import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Search, Download, Plus, FileText, Activity, AlertTriangle, Award, Eye } from 'lucide-react';

type SeoStatus = 'good' | 'warning' | 'critical';

// TODO(Phase B): wire to backend - replace with /v1/seo endpoint.
const TREND = [62, 64, 67, 70, 72, 75, 78, 80, 81, 83, 85, 86];

const KEYWORDS = [
  { keyword: 'spa quận 1', rank: 3, visits: 4_200 },
  { keyword: 'massage thư giãn',  rank: 5, visits: 3_600 },
  { keyword: 'triệt lông toàn thân', rank: 7, visits: 2_800 },
  { keyword: 'chăm sóc da hà nội',   rank: 12, visits: 1_900 },
  { keyword: 'liệu trình giảm béo',  rank: 18, visits: 1_400 }
];

const PAGES: { page: string; score: number; visits: number; status: SeoStatus }[] = [
  { page: '/dich-vu/massage',           score: 92, visits: 12_400, status: 'good' },
  { page: '/dich-vu/triet-long',        score: 88, visits: 9_800,  status: 'good' },
  { page: '/dich-vu/cham-soc-da',       score: 74, visits: 6_200,  status: 'warning' },
  { page: '/blog/cach-cham-soc-da-mun', score: 68, visits: 4_100,  status: 'warning' },
  { page: '/lien-he',                   score: 52, visits: 1_800,  status: 'critical' },
  { page: '/ve-chung-toi',              score: 48, visits: 1_200,  status: 'critical' }
];

export default async function ContentSeoPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('content');
  const t = await getTranslations('contentSeo');

  const total = PAGES.length;
  const avg = Math.round(PAGES.reduce((s, p) => s + p.score, 0) / total);
  const issues = PAGES.filter(p => p.status !== 'good').length;
  const top = KEYWORDS.filter(k => k.rank <= 5).length;
  const visits = PAGES.reduce((s, p) => s + p.visits, 0);
  const maxT = Math.max(...TREND);

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Search className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('exportPdf')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('newPage')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-5 mb-6">
        <Kpi label={t('kpi.totalPages')} value={String(total)} Icon={FileText} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.avgScore')} value={String(avg)} Icon={Activity} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.issues')} value={String(issues)} Icon={AlertTriangle} accent="text-amber-600" bg="bg-amber-50" />
        <Kpi label={t('kpi.topRanking')} value={String(top)} Icon={Award} accent="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label={t('kpi.monthlyVisits')} value={visits.toLocaleString()} Icon={Eye} accent="text-purple-600" bg="bg-purple-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.scoreTrend')}</h2>
          <div className="grid grid-cols-12 gap-1.5 h-40 items-end">
            {TREND.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-brand-textmuted tabular-nums">{v}</span>
                <div className="w-full rounded-t bg-brand-gold/70" style={{ height: `${(v / maxT) * 100}%` }} />
                <span className="text-[9px] text-brand-textmuted">{i + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.topKeywords')}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                <th className="text-left pb-2 font-medium">{t('columns.keyword')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.rank')}</th>
                <th className="text-right pb-2 font-medium">{t('columns.visits')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {KEYWORDS.map(k => (
                <tr key={k.keyword}>
                  <td className="py-2 truncate">{k.keyword}</td>
                  <td className="py-2 text-right tabular-nums text-brand-gold">{k.rank}</td>
                  <td className="py-2 text-right tabular-nums">{k.visits.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <section className="kpi-card">
        <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('sections.pages')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <th className="text-left py-2 px-3 font-medium">{t('columns.page')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.score')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('columns.visits')}</th>
                <th className="text-center py-2 px-3 font-medium">{t('columns.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {PAGES.map(p => (
                <tr key={p.page}>
                  <td className="py-2.5 px-3 font-mono text-xs text-brand-textmain">{p.page}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-brand-cream overflow-hidden">
                        <div className="h-full bg-brand-gold" style={{ width: `${p.score}%` }} />
                      </div>
                      <span className="tabular-nums">{p.score}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{p.visits.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center"><StatusBadge s={p.status} label={t(`status.${p.status}` as 'status.good')} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function StatusBadge({ s, label }: { s: SeoStatus; label: string }) {
  const cls = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200'
  }[s];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function Kpi({
  label, value, Icon, accent, bg
}: {
  label: string; value: string; accent: string; bg: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
