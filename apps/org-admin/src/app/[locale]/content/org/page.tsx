import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Plus,
  MoreHorizontal,
  Building,
  CheckCircle,
  Edit3,
  Newspaper,
  Award,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Edit2,
  BarChart2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

type ContentType = 'story' | 'leader' | 'press' | 'award';
type ContentStatus = 'published' | 'draft' | 'scheduled' | 'archived';

type CompanyContentRow = {
  id: string;
  title: string;
  subtitle: string;
  contentType: ContentType;
  authorInitials: string;
  authorName: string;
  status: ContentStatus;
  date: string;
  metricLabel: string;
  iconKey: 'image' | 'avatar' | 'press' | 'award';
};

export default async function CompanyContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('orgContent');

  // TODO(Phase B): wire to backend (content-service org scope)
  const rows: CompanyContentRow[] = [
    {
      id: 'cc-1',
      title: 'Di sản & Triết lý của chúng tôi',
      subtitle: '/cong-ty/di-san',
      contentType: 'story',
      authorInitials: 'KT',
      authorName: 'Kaori Team',
      status: 'published',
      date: '15/01/2026',
      metricLabel: '45.2k ' + t('views'),
      iconKey: 'image'
    },
    {
      id: 'cc-2',
      title: 'Sarah Miller',
      subtitle: t('founderCeo'),
      contentType: 'leader',
      authorInitials: 'HR',
      authorName: t('hrDept'),
      status: 'published',
      date: '01/02/2026',
      metricLabel: '-',
      iconKey: 'avatar'
    },
    {
      id: 'cc-3',
      title: '"Top 10 Spa hạng sang Châu Á"',
      subtitle: 'Spa & Wellness Magazine',
      contentType: 'press',
      authorInitials: 'PR',
      authorName: t('prTeam'),
      status: 'scheduled',
      date: '15/03/2026',
      metricLabel: t('externalLink'),
      iconKey: 'press'
    },
    {
      id: 'cc-4',
      title: 'Best Luxury Retreat 2025',
      subtitle: 'International Spa Awards',
      contentType: 'award',
      authorInitials: 'PR',
      authorName: t('prTeam'),
      status: 'draft',
      date: t('unpublished'),
      metricLabel: '-',
      iconKey: 'award'
    }
  ];

  return (
    <>
      <header className="bg-white p-6 md:p-8 rounded-3xl shadow-soft border border-brand-cream/60 relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-brand-gold/5 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
          <div className="flex-1">
            <h1 className="font-serif text-3xl text-brand-textmain tracking-wide mb-2">{t('title')}</h1>
            <p className="text-brand-textmuted text-sm max-w-xl">{t('subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button className="btn-ghost">
              <MoreHorizontal className="w-4 h-4" /> {t('options')}
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4" /> {t('createPost')}
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiTile icon={<Building className="w-3.5 h-3.5" />} label={t('kpi.totalPages')} value="24" />
        <KpiTile icon={<CheckCircle className="w-3.5 h-3.5" />} label={t('kpi.published')} value="18" tone="success" />
        <KpiTile icon={<Edit3 className="w-3.5 h-3.5" />} label={t('kpi.drafts')} value="6" />
        <KpiTile icon={<Newspaper className="w-3.5 h-3.5" />} label={t('kpi.press')} value="8" tone="success" />
        <KpiTile icon={<Award className="w-3.5 h-3.5" />} label={t('kpi.awards')} value="5" tone="gold" />
      </section>

      <div className="bg-white rounded-3xl shadow-soft border border-brand-cream overflow-hidden">
        <div className="p-5 border-b border-brand-cream flex flex-col lg:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textmuted" />
            <input
              type="text"
              placeholder={t('search')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-cream bg-brand-ivory/50 text-sm outline-none focus:border-brand-gold focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 text-xs">
              <option>{t('filter.typeAll')}</option>
              <option>{t('type.story')}</option>
              <option>{t('type.leader')}</option>
              <option>{t('type.press')}</option>
              <option>{t('type.award')}</option>
            </select>
            <select className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 text-xs">
              <option>{t('filter.statusAll')}</option>
              <option>{t('status.published')}</option>
              <option>{t('status.draft')}</option>
              <option>{t('status.scheduled')}</option>
              <option>{t('status.archived')}</option>
            </select>
            <select className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 text-xs">
              <option>{t('filter.dateAny')}</option>
              <option>{t('filter.last7')}</option>
              <option>{t('filter.last30')}</option>
            </select>
            <button
              className="p-2 rounded-lg border border-brand-cream bg-brand-ivory text-brand-textmuted hover:text-brand-gold"
              aria-label={t('advancedFilters')}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream bg-brand-ivory/20">
                <th className="py-3 px-4 font-semibold w-1/3">{t('cols.title')}</th>
                <th className="py-3 px-4 font-semibold">{t('cols.contentType')}</th>
                <th className="py-3 px-4 font-semibold">{t('cols.author')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('cols.status')}</th>
                <th className="py-3 px-4 font-semibold">{t('cols.dateMetrics')}</th>
                <th className="py-3 px-4 font-semibold text-right">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-brand-cream/50 bg-white text-brand-textmain">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-brand-ivory/50 transition group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <ContentIcon iconKey={r.iconKey} initials={r.authorInitials} />
                      <div className="min-w-[200px]">
                        <p className="font-medium text-brand-textmain truncate max-w-xs hover:text-brand-gold transition">
                          {r.title}
                        </p>
                        <p className="text-[10px] text-brand-textmuted mt-0.5 truncate max-w-xs font-mono">{r.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <ContentTypeBadge type={r.contentType} label={t(`type.${r.contentType}`)} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-brand-ivory border border-brand-cream text-[8px] font-serif flex items-center justify-center mr-2">
                        {r.authorInitials}
                      </div>
                      <span className="text-xs text-brand-textmain">{r.authorName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <StatusBadge status={r.status} label={t(`status.${r.status}`)} />
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-xs font-mono text-brand-textmain">{r.date}</p>
                    <p className="text-[10px] text-brand-textmuted mt-0.5 inline-flex items-center gap-1">
                      {r.metricLabel.includes(t('views')) && <Eye className="w-3 h-3" />}
                      {r.metricLabel}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-brand-textmuted hover:text-brand-gold rounded" aria-label={t('actions.preview')}>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-brand-textmuted hover:text-blue-500 rounded" aria-label={t('actions.edit')}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-brand-textmuted hover:text-brand-gold rounded" aria-label={t('actions.analytics')}>
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-brand-textmuted hover:text-red-500 rounded" aria-label={t('actions.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-brand-cream flex justify-between items-center bg-brand-ivory/30">
          <p className="text-xs text-brand-textmuted">
            {t('pagination.showing', { from: 1, to: 4, total: 24 })}
          </p>
          <div className="flex space-x-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-cream text-brand-textmuted bg-white opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-gold bg-brand-gold text-white font-medium">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-cream text-brand-textmain bg-white">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-cream text-brand-textmain bg-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'success' | 'gold';
}) {
  const labelColor =
    tone === 'success' ? 'text-green-600' : tone === 'gold' ? 'text-brand-gold' : 'text-brand-textmuted';
  const valueColor = tone === 'success' ? 'text-green-800' : tone === 'gold' ? 'text-brand-goldhover' : 'text-brand-textmain';
  const bg = tone === 'success' ? 'bg-green-50/50 border-green-200' : tone === 'gold' ? 'bg-brand-gold/5 border-brand-gold/30' : 'bg-white border-brand-cream';
  return (
    <div className={`p-5 rounded-2xl shadow-sm border ${bg}`}>
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5 ${labelColor}`}>
        {icon} {label}
      </p>
      <h3 className={`font-serif text-3xl ${valueColor}`}>{value}</h3>
    </div>
  );
}

function ContentTypeBadge({ type, label }: { type: ContentType; label: string }) {
  const cls =
    type === 'story'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : type === 'leader'
      ? 'bg-slate-100 text-slate-700 border-slate-300'
      : type === 'press'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-orange-50 text-orange-700 border-orange-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status, label }: { status: ContentStatus; label: string }) {
  const cls =
    status === 'published'
      ? 'bg-green-50 text-green-700 border-green-200'
      : status === 'draft'
      ? 'bg-gray-100 text-gray-600 border-gray-200'
      : status === 'scheduled'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-red-50 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}

function ContentIcon({ iconKey, initials }: { iconKey: 'image' | 'avatar' | 'press' | 'award'; initials: string }) {
  if (iconKey === 'avatar') {
    return (
      <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmuted border border-brand-cream">
        {initials}
      </div>
    );
  }
  if (iconKey === 'press') {
    return (
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-green-700 bg-green-50 border border-green-200">
        <Newspaper className="w-5 h-5" />
      </div>
    );
  }
  if (iconKey === 'award') {
    return (
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-orange-700 bg-orange-50 border border-orange-200">
        <Award className="w-5 h-5" />
      </div>
    );
  }
  return <div className="w-12 h-12 rounded-lg bg-brand-cream border border-brand-cream" />;
}
