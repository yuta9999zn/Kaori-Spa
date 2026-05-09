import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Upload, Download, RefreshCw, Cable, FileSpreadsheet, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

type HistoryRow = {
  id: string;
  fileName: string;
  source: 'csv' | 'api' | 'manual';
  rows: number;
  succeeded: number;
  failed: number;
  user: string;
  at: string;
  status: 'completed' | 'partial' | 'failed';
};

export default async function ServiceImportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  const t = await getTranslations('serviceImport');

  // TODO(Phase B): wire to backend when endpoint ships
  const history: HistoryRow[] = [
    { id: 'imp-1', fileName: 'services-q1-2026.csv', source: 'csv', rows: 124, succeeded: 120, failed: 4, user: 'Hoang Tu Anh', at: '2026-05-08 14:23', status: 'partial' },
    { id: 'imp-2', fileName: 'pos-sync-natural-beauty', source: 'api', rows: 86, succeeded: 86, failed: 0, user: 'system', at: '2026-05-07 02:00', status: 'completed' },
    { id: 'imp-3', fileName: 'hair-removal-services.xlsx', source: 'csv', rows: 45, succeeded: 45, failed: 0, user: 'Le Minh Anh', at: '2026-05-06 09:12', status: 'completed' },
    { id: 'imp-4', fileName: 'legacy-prices.csv', source: 'csv', rows: 200, succeeded: 0, failed: 200, user: 'Tran Thu Ha', at: '2026-05-05 17:48', status: 'failed' }
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
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('downloadTemplate')}</button>
          <button className="btn-primary"><Upload className="h-4 w-4" /> {t('newImport')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        <Method icon={<FileSpreadsheet className="h-5 w-5" />} title={t('methods.csv.title')} desc={t('methods.csv.desc')} cta={t('methods.csv.cta')} />
        <Method icon={<Cable className="h-5 w-5" />} title={t('methods.api.title')} desc={t('methods.api.desc')} cta={t('methods.api.cta')} />
        <Method icon={<RefreshCw className="h-5 w-5" />} title={t('methods.manual.title')} desc={t('methods.manual.desc')} cta={t('methods.manual.cta')} />
      </section>

      <section className="grid gap-5 grid-cols-1 lg:grid-cols-2 mb-6">
        <div className="rounded-2xl border-2 border-dashed border-brand-cream bg-white p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">
            <Upload className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-lg text-brand-textmain mb-1">{t('quickUpload.title')}</h3>
          <p className="text-xs text-brand-textmuted mb-4">{t('quickUpload.desc')}</p>
          <button className="btn-primary mx-auto">{t('quickUpload.cta')}</button>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5">
          <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('integrations.title')}</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between border-b border-brand-cream/50 pb-3">
              <div>
                <p className="font-medium text-brand-textmain">KiotViet POS</p>
                <p className="text-xs text-brand-textmuted">{t('integrations.lastSync')}: 2026-05-08 02:00</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-green-50 text-green-700 border-green-200">{t('integrations.connected')}</span>
            </li>
            <li className="flex items-center justify-between">
              <div>
                <p className="font-medium text-brand-textmain">Misa CukCuk</p>
                <p className="text-xs text-brand-textmuted">{t('integrations.notConnected')}</p>
              </div>
              <button className="text-xs font-semibold text-brand-gold hover:underline">{t('integrations.connect')}</button>
            </li>
          </ul>
        </div>
      </section>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
          <h2 className="font-serif text-lg text-brand-textmain">{t('history')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.file')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.source')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.rows')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.success')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.failed')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.user')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.time')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {history.map(r => (
                <tr key={r.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.fileName}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{t(`source.${r.source}` as 'source.csv')}</td>
                  <td className="text-center px-4 py-3">{r.rows}</td>
                  <td className="text-center px-4 py-3 text-green-700">{r.succeeded}</td>
                  <td className="text-center px-4 py-3 text-red-600">{r.failed}</td>
                  <td className="px-4 py-3">{r.user}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{r.at}</td>
                  <td className="px-4 py-3">
                    <StatusBadge s={r.status} label={t(`status.${r.status}` as 'status.completed')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Method({ icon, title, desc, cta }: { icon: React.ReactNode; title: string; desc: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5 hover:border-brand-gold transition group">
      <div className="h-10 w-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-serif text-lg text-brand-textmain mb-1 group-hover:text-brand-gold">{title}</h3>
      <p className="text-xs text-brand-textmuted mb-4">{desc}</p>
      <button className="text-xs font-semibold text-brand-gold hover:underline">{cta} →</button>
    </div>
  );
}

function StatusBadge({ s, label }: { s: 'completed' | 'partial' | 'failed'; label: string }) {
  const cls =
    s === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-red-50 text-red-700 border-red-200';
  const Icon = s === 'completed' ? CheckCircle2 : s === 'partial' ? Clock : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
