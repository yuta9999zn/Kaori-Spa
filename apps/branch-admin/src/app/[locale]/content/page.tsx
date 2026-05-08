import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  Edit3,
  CalendarClock,
  BarChart2,
  Eye,
  ExternalLink,
  Edit2,
  Trash2,
  MapPin,
  Building,
  Image as ImageIcon,
  SlidersHorizontal
} from 'lucide-react';

type PostStatus = 'published' | 'scheduled' | 'draft' | 'archived';
type PostScope = 'service' | 'branch' | 'product' | 'company' | 'tenant';

type PostRow = {
  title: string;
  slug: string;
  scope: PostScope;
  location: string;
  locationKind: 'branch' | 'global' | 'corporate';
  author: string;
  authorInitials: string;
  seo: number;
  status: PostStatus;
  date: string | null;
  views: number | null;
  hasImage: boolean;
};

export default async function ContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');

  const rows: PostRow[] = [
    {
      title: 'Lợi ích của massage mô sâu',
      slug: '/blog/loi-ich-massage-mo-sau',
      scope: 'service',
      location: t('scopeLocation.global'),
      locationKind: 'global',
      author: 'Nguyễn Thị Mai',
      authorInitials: 'NM',
      seo: 92,
      status: 'published',
      date: '2026-03-05',
      views: 1245,
      hasImage: true
    },
    {
      title: 'Khai trương chi nhánh Kaori Đà Nẵng',
      slug: '/news/khai-truong-da-nang',
      scope: 'branch',
      location: 'Kaori Đà Nẵng',
      locationKind: 'branch',
      author: 'Trần Thị Lan',
      authorInitials: 'TL',
      seo: 82,
      status: 'scheduled',
      date: '2026-05-15',
      views: 0,
      hasImage: true
    },
    {
      title: 'Quy trình triệt lông toàn thân an toàn',
      slug: '/blog/triet-long-an-toan',
      scope: 'service',
      location: t('scopeLocation.global'),
      locationKind: 'global',
      author: 'Lê Thị Hoa',
      authorInitials: 'LH',
      seo: 55,
      status: 'draft',
      date: null,
      views: null,
      hasImage: false
    },
    {
      title: 'Mục tiêu phát triển bền vững 2026',
      slug: '/company/ben-vung-2026',
      scope: 'company',
      location: t('scopeLocation.corporate'),
      locationKind: 'corporate',
      author: 'Kaori Team',
      authorInitials: 'KT',
      seo: 98,
      status: 'published',
      date: '2026-02-10',
      views: 3400,
      hasImage: true
    },
    {
      title: 'Combo chăm sóc da mùa hè',
      slug: '/promo/combo-mua-he',
      scope: 'product',
      location: t('scopeLocation.global'),
      locationKind: 'global',
      author: 'Phạm Thị Yến',
      authorInitials: 'PY',
      seo: 76,
      status: 'published',
      date: '2026-04-22',
      views: 980,
      hasImage: true
    }
  ];

  const total = 245;

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <FileText className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-lg">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-primary">
            <Plus className="h-4 w-4" /> {t('create')}
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.total')} value="245" Icon={FileText} accent="text-brand-textmain" />
        <KpiTile
          label={t('kpi.published')}
          value="180"
          Icon={CheckCircle}
          accent="text-emerald-600"
        />
        <KpiTile label={t('kpi.draft')} value="40" Icon={Edit3} accent="text-brand-textmain" />
        <KpiTile
          label={t('kpi.scheduled')}
          value="25"
          Icon={CalendarClock}
          accent="text-blue-600"
        />
        <KpiTile
          label={t('kpi.avgSeo')}
          value="84"
          subtitle={t('seoLabel.good')}
          subtitleClass="text-emerald-600"
          Icon={BarChart2}
          accent="text-brand-gold"
        />
      </section>

      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 lg:w-96 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('search')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue=""
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterScopeAll')}</option>
            <option value="tenant">{t('scope.tenant')}</option>
            <option value="branch">{t('scope.branch')}</option>
            <option value="service">{t('scope.service')}</option>
            <option value="product">{t('scope.product')}</option>
            <option value="company">{t('scope.company')}</option>
          </select>
          <select
            defaultValue=""
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterStatusAll')}</option>
            <option value="published">{t('status.published')}</option>
            <option value="draft">{t('status.draft')}</option>
            <option value="scheduled">{t('status.scheduled')}</option>
            <option value="archived">{t('status.archived')}</option>
          </select>
          <select
            defaultValue=""
            className="rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
          >
            <option value="">{t('filterDateAny')}</option>
            <option value="7d">{t('filterLast7')}</option>
            <option value="30d">{t('filterLast30')}</option>
          </select>
          <button className="rounded-xl border border-brand-cream bg-white p-2 text-brand-textmuted hover:text-brand-gold transition">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Posts table */}
      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t('columns.post')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('columns.scope')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('columns.author')}</th>
              <th className="text-center px-4 py-3 font-medium">{t('columns.seo')}</th>
              <th className="text-center px-4 py-3 font-medium">{t('columns.status')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('columns.metrics')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.slug} className="hover:bg-brand-cream/20 group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-brand-cream flex items-center justify-center ${
                        r.hasImage ? 'bg-brand-cream' : 'bg-brand-cream/40 text-brand-textmuted'
                      }`}
                    >
                      {r.hasImage ? (
                        <span className="block h-full w-full bg-gradient-to-br from-brand-gold/30 via-brand-rose/30 to-brand-cream" />
                      ) : (
                        <ImageIcon className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-medium text-brand-textmain truncate max-w-xs ${
                          r.status === 'draft' ? 'italic' : ''
                        }`}
                      >
                        {r.title}
                      </p>
                      <p className="text-[10px] text-brand-textmuted mt-0.5 truncate max-w-xs font-mono">
                        {r.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ScopeBadge scope={r.scope} label={t(`scope.${r.scope}` as 'scope.service')} />
                  <p className="text-[10px] text-brand-textmuted mt-1 flex items-center gap-1">
                    {r.locationKind === 'corporate' ? (
                      <Building className="h-3 w-3" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {r.location}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-brand-ivory border border-brand-cream text-[9px] font-serif flex items-center justify-center">
                      {r.authorInitials}
                    </span>
                    <span className="text-xs text-brand-textmain">{r.author}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <SeoScore score={r.seo} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge
                    status={r.status}
                    label={t(`status.${r.status}` as 'status.published')}
                  />
                </td>
                <td className="px-4 py-3">
                  {r.date ? (
                    <p className="text-xs font-mono text-brand-textmain">{r.date}</p>
                  ) : (
                    <p className="text-xs font-mono text-brand-textmuted italic">
                      {t('unpublished')}
                    </p>
                  )}
                  <p className="text-[10px] text-brand-textmuted mt-0.5 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {r.views !== null ? t('viewsCount', { count: r.views }) : '—'}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="rounded p-1.5 text-brand-textmuted hover:text-brand-gold transition"
                      title={t('action.preview')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-brand-textmuted hover:text-blue-500 transition"
                      title={t('action.edit')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-brand-textmuted hover:text-red-500 transition"
                      title={t('action.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-3 text-xs text-brand-textmuted">
          <p>{t('paginationSummary', { from: 1, to: 5, total })}</p>
          <div className="flex items-center gap-1">
            <button className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 opacity-50 cursor-not-allowed">
              {t('prev')}
            </button>
            <button className="h-8 w-8 rounded-lg border border-brand-gold bg-brand-gold text-white font-medium">
              1
            </button>
            <button className="h-8 w-8 rounded-lg border border-brand-cream bg-white text-brand-textmain hover:border-brand-gold hover:text-brand-gold transition font-medium">
              2
            </button>
            <button className="h-8 w-8 rounded-lg border border-brand-cream bg-white text-brand-textmain hover:border-brand-gold hover:text-brand-gold transition font-medium">
              3
            </button>
            <button className="rounded-lg border border-brand-cream bg-white px-3 py-1.5 hover:border-brand-gold transition">
              {t('next')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({
  label,
  value,
  Icon,
  accent,
  subtitle,
  subtitleClass
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  subtitle?: string;
  subtitleClass?: string;
}) {
  return (
    <article className="kpi-card">
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={`mt-2 font-serif text-2xl ${accent} flex items-baseline gap-2`}>
        {value}
        {subtitle ? (
          <span className={`text-xs font-sans ${subtitleClass ?? ''}`}>{subtitle}</span>
        ) : null}
      </p>
    </article>
  );
}

function ScopeBadge({ scope, label }: { scope: PostScope; label: string }) {
  const map: Record<PostScope, string> = {
    tenant: 'bg-purple-50 text-purple-700',
    branch: 'bg-blue-50 text-blue-700',
    service: 'bg-amber-50 text-amber-700',
    product: 'bg-rose-50 text-rose-700',
    company: 'bg-emerald-50 text-emerald-700'
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[scope]}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status, label }: { status: PostStatus; label: string }) {
  const map: Record<PostStatus, string> = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    archived: 'bg-slate-50 text-slate-500 border-slate-200'
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status]}`}
    >
      {label}
    </span>
  );
}

function SeoScore({ score }: { score: number }) {
  const tone =
    score >= 90
      ? 'text-emerald-500'
      : score >= 70
      ? 'text-amber-500'
      : 'text-red-500';
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex h-9 w-9 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#F4EFEA"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={tone}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-brand-textmain">{score}</span>
    </div>
  );
}
