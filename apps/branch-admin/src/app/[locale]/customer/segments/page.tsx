import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Plus, Tag, Users } from 'lucide-react';

type Segment = {
  id: string;
  name: string;
  type: 'auto' | 'manual';
  count: number;
  trend: 'up' | 'down' | 'flat';
};

type TagItem = {
  name: string;
  color: string;
  count: number;
};

export default async function CustomerSegmentsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  const t = await getTranslations('customerSegments');

  // TODO(Phase B): wire to backend when endpoint ships
  const segments: Segment[] = [
    { id: 'SEG-001', name: 'High Spenders', type: 'auto', count: 240, trend: 'up' },
    { id: 'SEG-002', name: 'Active Regulars', type: 'auto', count: 850, trend: 'up' },
    { id: 'SEG-003', name: 'Lost Clients (>90d)', type: 'auto', count: 450, trend: 'down' },
    { id: 'SEG-004', name: 'Holiday VIP Invitees', type: 'manual', count: 45, trend: 'flat' }
  ];

  const tags: TagItem[] = [
    { name: 'VIP', color: 'bg-amber-50 text-amber-700 border-amber-200', count: 120 },
    { name: 'New', color: 'bg-green-50 text-green-700 border-green-200', count: 340 },
    { name: 'Allergy', color: 'bg-red-50 text-red-700 border-red-200', count: 35 },
    { name: 'Birthday Month', color: 'bg-pink-50 text-pink-700 border-pink-200', count: 80 }
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
          <button className="btn-ghost"><Tag className="h-4 w-4" /> {t('createTag')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('createSegment')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.totalSegments')} value="8" />
        <KpiTile label={t('kpi.totalTags')} value="14" />
        <KpiTile label={t('kpi.taggedCustomers')} value="2,400" hint="(74%)" accent="gold" />
        <KpiTile label={t('kpi.largestSegment')} value="Active Regulars" small accent="green" />
        <KpiTile label={t('kpi.inactiveSegment')} value="Lost Clients" small accent="rose" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('segments')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-brand-ivory/20 text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.segment')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.type')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.count')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.trend')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {segments.map(s => (
                <tr key={s.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3">
                    <p className="font-serif text-brand-textmain">{s.name}</p>
                    <p className="text-[10px] font-mono text-brand-textmuted">{s.id}</p>
                  </td>
                  <td className="px-4 py-3"><TypeBadge tp={s.type} label={t(`type.${s.type}`)} /></td>
                  <td className="px-4 py-3 text-center font-serif text-lg">{s.count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${s.trend === 'up' ? 'text-green-600' : s.trend === 'down' ? 'text-red-500' : 'text-brand-textmuted'}`}>
                      {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-brand-gold hover:underline">{t('view')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3"><Tag className="h-4 w-4 mr-2 text-brand-gold" /> {t('tags')}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag.name} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${tag.color}`}>
                  {tag.name} <span className="opacity-60">({tag.count})</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3"><Users className="h-4 w-4 mr-2 text-brand-gold" /> {t('quickRule')}</h3>
            <p className="text-xs text-brand-textmuted mb-3">{t('ruleHint')}</p>
            <div className="space-y-2 text-sm">
              <div className="rounded-xl border border-brand-cream bg-brand-ivory/40 p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('preview')}</p>
                <p className="font-serif text-2xl text-brand-textmain">~120</p>
                <p className="text-[10px] text-brand-textmuted">{t('matchingCustomers')}</p>
              </div>
              <button className="btn-primary w-full justify-center">{t('createSegment')}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, hint, accent, small }: { label: string; value: string; hint?: string; accent?: 'gold' | 'green' | 'rose'; small?: boolean }) {
  const cls = accent === 'gold' ? 'text-brand-gold' : accent === 'green' ? 'text-green-600' : accent === 'rose' ? 'text-brand-rose' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cls}`}>{label}</p>
      <p className={`font-serif text-brand-textmain ${small ? 'text-base truncate' : 'text-2xl'}`}>{value}{hint && <span className="text-xs ml-1 font-sans text-brand-textmuted">{hint}</span>}</p>
    </div>
  );
}

function TypeBadge({ tp, label }: { tp: Segment['type']; label: string }) {
  const cls = tp === 'auto' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
