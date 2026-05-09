import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Upload, FolderPlus, Image as ImageIcon, Film, FileText, HardDrive, Folder } from 'lucide-react';

type AssetType = 'image' | 'video' | 'document';

// TODO(Phase B): wire to backend - replace with /v1/media endpoint.
const FOLDERS = [
  { name: 'Banner', count: 24 },
  { name: 'Dịch vụ', count: 86 },
  { name: 'Blog', count: 142 },
  { name: 'Nhân viên', count: 38 },
  { name: 'Khuyến mãi', count: 17 }
];

const ASSETS: { id: string; name: string; type: AssetType; size: string }[] = [
  { id: 'a-1', name: 'spa-banner-01.jpg', type: 'image', size: '1.4 MB' },
  { id: 'a-2', name: 'massage-room.jpg', type: 'image', size: '980 KB' },
  { id: 'a-3', name: 'gioi-thieu.mp4', type: 'video', size: '24 MB' },
  { id: 'a-4', name: 'menu-2026.pdf', type: 'document', size: '420 KB' },
  { id: 'a-5', name: 'team-photo.jpg', type: 'image', size: '2.1 MB' },
  { id: 'a-6', name: 'tu-van-da.mp4', type: 'video', size: '18 MB' },
  { id: 'a-7', name: 'logo-kaori.png', type: 'image', size: '78 KB' },
  { id: 'a-8', name: 'gia-cua-the.pdf', type: 'document', size: '310 KB' }
];

export default async function ContentMediaPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contentMedia');

  const total = ASSETS.length;
  const images = ASSETS.filter(a => a.type === 'image').length;
  const videos = ASSETS.filter(a => a.type === 'video').length;
  const documents = ASSETS.filter(a => a.type === 'document').length;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <ImageIcon className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><FolderPlus className="h-4 w-4" /> {t('newFolder')}</button>
          <button className="btn-primary"><Upload className="h-4 w-4" /> {t('upload')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-5 mb-6">
        <Kpi label={t('kpi.totalAssets')} value={String(total)} Icon={ImageIcon} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.totalSize')} value="48 MB" Icon={HardDrive} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.images')} value={String(images)} Icon={ImageIcon} accent="text-purple-600" bg="bg-purple-50" />
        <Kpi label={t('kpi.videos')} value={String(videos)} Icon={Film} accent="text-rose-600" bg="bg-rose-50" />
        <Kpi label={t('kpi.documents')} value={String(documents)} Icon={FileText} accent="text-emerald-600" bg="bg-emerald-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-4 mb-6">
        <article className="kpi-card">
          <h2 className="font-serif text-base text-brand-textmain mb-3">{t('sections.folders')}</h2>
          <ul className="space-y-1.5">
            {FOLDERS.map(f => (
              <li key={f.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-brand-ivory/40 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-brand-textmain">
                  <Folder className="h-4 w-4 text-brand-gold" /> {f.name}
                </span>
                <span className="text-[11px] text-brand-textmuted tabular-nums">{f.count}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="kpi-card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base text-brand-textmain">{t('sections.assets')}</h2>
            <div className="flex gap-1">
              {(['all', 'image', 'video', 'document'] as const).map(f => (
                <button key={f} className="rounded-full border border-brand-cream bg-white px-3 py-1 text-[11px]">
                  {t(`filters.${f}` as 'filters.all')}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {ASSETS.map(a => (
              <article key={a.id} className="rounded-xl border border-brand-cream/70 overflow-hidden">
                <div className="aspect-square bg-brand-ivory/60 flex items-center justify-center">
                  {a.type === 'image' && <ImageIcon className="h-10 w-10 text-brand-gold" />}
                  {a.type === 'video' && <Film className="h-10 w-10 text-rose-500" />}
                  {a.type === 'document' && <FileText className="h-10 w-10 text-emerald-600" />}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-brand-textmain truncate">{a.name}</p>
                  <p className="text-[10px] text-brand-textmuted">{a.size}</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </>
  );
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
