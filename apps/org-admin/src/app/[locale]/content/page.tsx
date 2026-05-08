import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FileText, Plus, Search, CheckCircle, CalendarClock, Tag, CalendarDays, MapPin, Eye, Pencil, Trash2 } from 'lucide-react';

export default async function ContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');

  const rows = [
    { id: 'CT-2026-001', title: 'Khuyến mãi mùa hè - Triệt lông toàn thân -20%', slug: 'Hiệu lực 10/06 - 30/06',           type: 'promotion',  branch: 'BR-HCM-01 · Quận 1',     status: 'published', date: '2026-05-08', metric: '842 lượt xem' },
    { id: 'CT-2026-002', title: 'Khai trương chi nhánh Đà Nẵng',                slug: 'Sự kiện ngày 15/05/2026',          type: 'event',      branch: 'BR-DN-01 · Đà Nẵng',     status: 'scheduled', date: '2026-05-12', metric: '0 lượt xem' },
    { id: 'CT-2026-003', title: 'Spa làm đẹp uy tín tại Quận 7',                slug: '/branches/natural-beauty-quan-7',  type: 'seo',        branch: 'BR-HCM-02 · Quận 7',     status: 'published', date: '2026-04-20', metric: 'SEO: 94/100' },
    { id: 'CT-2026-004', title: 'Lịch nghỉ lễ 30/4 - 1/5',                       slug: 'Widget hiển thị toàn bộ chi nhánh', type: 'announcement', branch: 'Toàn tổ chức',         status: 'draft',     date: '—',          metric: '—' },
    { id: 'CT-2026-005', title: 'Bí quyết chăm sóc da sau triệt lông',          slug: '/blog/cham-soc-sau-triet-long',    type: 'article',    branch: 'BR-HN-01 · Hà Nội',      status: 'published', date: '2026-03-12', metric: '2.1k lượt xem' },
    { id: 'CT-2026-006', title: 'Combo triệt lông + chăm sóc da mặt',           slug: 'Hiệu lực 01/06 - 15/06',           type: 'promotion',  branch: 'BR-HN-01 · Hà Nội',      status: 'archived',  date: '2026-02-28', metric: '430 lượt xem' }
  ];

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <FileText className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft">
            <span className="text-[10px] uppercase tracking-widest text-brand-textmuted mr-2">{t('branchSelector')}</span>
            <select defaultValue="all" className="bg-transparent text-brand-textmain outline-none">
              <option value="all">Tất cả chi nhánh</option>
              <option value="BR-HCM-01">BR-HCM-01 · Quận 1</option>
              <option value="BR-HCM-02">BR-HCM-02 · Quận 7</option>
              <option value="BR-HN-01">BR-HN-01 · Hà Nội</option>
              <option value="BR-DN-01">BR-DN-01 · Đà Nẵng</option>
            </select>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" /> {t('create')}
          </button>
        </div>
      </header>

      {/* KPI summary */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
        <KpiCard label={t('kpi.posts')}      value="85" Icon={FileText}      accent="text-brand-textmain" bg="bg-brand-ivory" />
        <KpiCard label={t('kpi.published')}  value="64" Icon={CheckCircle}   accent="text-emerald-600"    bg="bg-emerald-50" />
        <KpiCard label={t('kpi.scheduled')}  value="5"  Icon={CalendarClock} accent="text-blue-600"       bg="bg-blue-50" />
        <KpiCard label={t('kpi.promotions')} value="12" Icon={Tag}           accent="text-brand-gold"     bg="bg-brand-gold/10" />
        <KpiCard label={t('kpi.events')}     value="6"  Icon={CalendarDays}  accent="text-brand-rose"     bg="bg-brand-rose/10" />
      </section>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[260px] items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input className="flex-1 bg-transparent text-sm outline-none" placeholder={t('filter.search')} />
        </div>
        <select defaultValue="all" className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold">
          <option value="all">{t('filter.type')}</option>
          {(['promotion', 'event', 'announcement', 'article', 'seo'] as const).map(typ => (
            <option key={typ} value={typ}>{t(`type.${typ}` as 'type.promotion')}</option>
          ))}
        </select>
        <select defaultValue="all" className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold">
          <option value="all">{t('filter.status')}</option>
          {(['published', 'draft', 'scheduled', 'archived'] as const).map(s => (
            <option key={s} value={s}>{t(`status.${s}` as 'status.published')}</option>
          ))}
        </select>
        <select defaultValue="any" className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand-gold">
          <option value="any">{t('filter.date')}</option>
          <option value="7">7 ngày</option>
          <option value="30">30 ngày</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['title', 'type', 'branch', 'status', 'metrics', 'actions'] as const).map(c => (
                <th key={c} className={`px-4 py-3 font-medium ${c === 'status' || c === 'actions' ? 'text-center' : 'text-left'}`}>
                  {t(`columns.${c}` as 'columns.title')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <TypeIcon type={r.type} />
                    <div>
                      <p className="font-medium text-brand-textmain">{r.title}</p>
                      <p className="font-mono text-[11px] text-brand-textmuted">{r.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={r.type} label={t(`type.${r.type}` as 'type.promotion')} />
                </td>
                <td className="px-4 py-3 text-brand-textmuted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.branch}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={r.status} label={t(`status.${r.status}` as 'status.published')} />
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-[11px] text-brand-textmain">{r.date}</p>
                  <p className="text-[11px] text-brand-textmuted">{r.metric}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="rounded p-1.5 text-brand-textmuted hover:text-brand-gold transition" title="Preview">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-brand-textmuted hover:text-blue-600 transition" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-brand-textmuted hover:text-red-600 transition" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function KpiCard({
  label, value, Icon, accent, bg
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-3xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}

function TypeIcon({ type }: { type: string }) {
  const map: Record<string, { Icon: React.ComponentType<{ className?: string }>; bg: string; fg: string }> = {
    promotion:    { Icon: Tag,           bg: 'bg-brand-gold/10', fg: 'text-brand-gold' },
    event:        { Icon: CalendarDays,  bg: 'bg-blue-50',       fg: 'text-blue-600' },
    announcement: { Icon: FileText,      bg: 'bg-brand-cream',   fg: 'text-brand-textmuted' },
    article:      { Icon: FileText,      bg: 'bg-emerald-50',    fg: 'text-emerald-600' },
    seo:          { Icon: Search,        bg: 'bg-brand-rose/10', fg: 'text-brand-rose' }
  };
  const cfg = map[type] ?? map.article!;
  const { Icon, bg, fg } = cfg;
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${fg}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

function TypeBadge({ type, label }: { type: string; label: string }) {
  const map: Record<string, string> = {
    promotion:    'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    event:        'bg-blue-50 text-blue-700 border-blue-200',
    announcement: 'bg-slate-50 text-slate-600 border-slate-200',
    article:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    seo:          'bg-brand-rose/10 text-brand-rose border-brand-rose/30'
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${map[type] ?? ''}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft:     'bg-slate-50 text-slate-600 border-slate-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    archived:  'bg-amber-50 text-amber-700 border-amber-200'
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${map[status] ?? ''}`}>
      {label}
    </span>
  );
}
