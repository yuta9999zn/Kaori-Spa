import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

type Job = {
  id: string;
  type: 'import' | 'export';
  file: string;
  rows: number;
  status: 'success' | 'failed' | 'partial';
  date: string;
  by: string;
};

export default async function CustomerImportExportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customerImportExport');

  // TODO(Phase B): wire to backend when endpoint ships
  const jobs: Job[] = [
    { id: 'JOB-1024', type: 'import', file: 'customers_q1_2026.csv', rows: 320, status: 'success', date: '10/03/2026', by: 'Sarah M.' },
    { id: 'JOB-1018', type: 'export', file: 'vip_segment_export.xlsx', rows: 240, status: 'success', date: '02/03/2026', by: 'Anna N.' },
    { id: 'JOB-1010', type: 'import', file: 'walkin_feb.csv', rows: 85, status: 'partial', date: '20/02/2026', by: 'Sarah M.' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Download className="h-4 w-4" /> {t('downloadTemplate')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <h2 className="font-serif text-xl text-brand-textmain mb-4 flex items-center gap-2"><Upload className="h-5 w-5 text-brand-gold" /> {t('importSection')}</h2>
          <div className="rounded-xl border-2 border-dashed border-brand-cream bg-brand-ivory/40 p-8 text-center">
            <FileSpreadsheet className="h-10 w-10 text-brand-gold mx-auto mb-2" />
            <p className="text-sm text-brand-textmain font-medium">{t('dropZone')}</p>
            <p className="text-xs text-brand-textmuted mt-1">{t('supportedFormats')}</p>
            <button className="btn-primary mt-4 mx-auto">{t('selectFile')}</button>
          </div>
          <h3 className="font-serif text-base text-brand-textmain mt-5 mb-2">{t('fieldMapping')}</h3>
          <div className="grid grid-cols-12 gap-3 text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted px-2 mb-2">
            <span className="col-span-5">{t('mapping.source')}</span>
            <span className="col-span-2 text-center">→</span>
            <span className="col-span-5">{t('mapping.target')}</span>
          </div>
          <ul className="text-sm divide-y divide-brand-cream/60">
            {[
              ['full_name', 'fullName'],
              ['phone', 'phone'],
              ['email', 'email'],
              ['gender', 'gender']
            ].map(([s, target]) => (
              <li key={s} className="grid grid-cols-12 gap-3 py-2 items-center">
                <span className="col-span-5 font-mono text-xs text-brand-textmain">{s}</span>
                <span className="col-span-2 text-center text-brand-textmuted">→</span>
                <span className="col-span-5 font-mono text-xs text-brand-gold">{target}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <h2 className="font-serif text-xl text-brand-textmain mb-4 flex items-center gap-2"><Download className="h-5 w-5 text-brand-gold" /> {t('exportSection')}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">{t('export.dateRange')}</label>
              <input type="text" placeholder="01/01/2026 - 10/03/2026" className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">{t('export.segment')}</label>
              <select className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm">
                <option>{t('export.allCustomers')}</option>
                <option>VIP</option>
                <option>Active Regulars</option>
                <option>Lost Clients</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">{t('export.format')}</label>
              <div className="grid grid-cols-3 gap-2">
                {['CSV', 'XLSX', 'JSON'].map(f => (
                  <button key={f} className="rounded-xl border border-brand-cream bg-white py-2 text-xs font-medium text-brand-textmain hover:border-brand-gold">{f}</button>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full justify-center">{t('export.run')}</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
          <h2 className="font-serif text-lg text-brand-textmain">{t('previousJobs')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-brand-ivory/20 text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('cols.id')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.type')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.file')}</th>
                <th className="text-center px-4 py-3 font-medium">{t('cols.rows')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.date')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('cols.by')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-brand-ivory/30">
                  <td className="px-4 py-3 font-mono text-xs">{j.id}</td>
                  <td className="px-4 py-3"><span className="capitalize">{t(`type.${j.type}`)}</span></td>
                  <td className="px-4 py-3 text-brand-textmain">{j.file}</td>
                  <td className="px-4 py-3 text-center font-mono">{j.rows}</td>
                  <td className="px-4 py-3"><JobStatusBadge s={j.status} label={t(`status.${j.status}`)} /></td>
                  <td className="px-4 py-3 text-brand-textmuted">{j.date}</td>
                  <td className="px-4 py-3 text-brand-textmuted">{j.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function JobStatusBadge({ s, label }: { s: Job['status']; label: string }) {
  const cls =
    s === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-red-50 text-red-700 border-red-200';
  const Icon = s === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      <Icon className="h-3 w-3 mr-1" />{label}
    </span>
  );
}
