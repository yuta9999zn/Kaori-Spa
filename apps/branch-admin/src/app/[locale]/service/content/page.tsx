import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, FileText, Image as ImageIcon, Languages, Edit2 } from 'lucide-react';

type ContentItem = {
  id: string;
  service: string;
  title: string;
  type: 'description' | 'benefits' | 'process' | 'faq';
  language: 'vi' | 'en';
  status: 'published' | 'draft' | 'review';
  updatedAt: string;
  author: string;
};

export default async function ServiceContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('serviceContent');

  // TODO(Phase B): wire to backend when endpoint ships
  const items: ContentItem[] = [
    { id: 'cnt-1', service: 'Triệt lông toàn thân nữ', title: '5 lợi ích của triệt lông Diode', type: 'benefits', language: 'vi', status: 'published', updatedAt: '2026-05-07', author: 'Hoang Tu Anh' },
    { id: 'cnt-2', service: 'Massage trị liệu', title: 'Quy trình 75 phút chuẩn 5 sao', type: 'process', language: 'vi', status: 'published', updatedAt: '2026-05-06', author: 'Le Minh Anh' },
    { id: 'cnt-3', service: 'Chăm sóc da Hydrating', title: 'Câu hỏi thường gặp', type: 'faq', language: 'vi', status: 'review', updatedAt: '2026-05-05', author: 'Tran Thu Ha' },
    { id: 'cnt-4', service: 'Triệt lông vùng nách nam', title: 'Mô tả dịch vụ', type: 'description', language: 'en', status: 'draft', updatedAt: '2026-05-04', author: 'Nguyen Van An' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Languages className="h-4 w-4" /> {t('translate')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('newContent')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <Kpi label={t('kpi.total')} value="54" />
        <Kpi label={t('kpi.published')} value="41" tone="green" />
        <Kpi label={t('kpi.draft')} value="9" />
        <Kpi label={t('kpi.review')} value="4" tone="gold" />
        <Kpi label={t('kpi.translation')} value="78%" tone="gold" />
      </section>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('contentList')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.title')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.type')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.lang')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.updated')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('cols.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {items.map(it => (
                  <tr key={it.id} className="hover:bg-brand-ivory/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-textmain">{it.title}</p>
                      <p className="text-[10px] text-brand-textmuted">{it.service}</p>
                    </td>
                    <td className="px-4 py-3 text-brand-textmuted">{t(`type.${it.type}` as 'type.description')}</td>
                    <td className="text-center px-4 py-3 uppercase font-mono text-xs">{it.language}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${it.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : it.status === 'review' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {t(`status.${it.status}` as 'status.published')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{it.updatedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="edit"><Edit2 className="h-4 w-4 text-brand-textmuted" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5 flex flex-col gap-4">
          <h3 className="font-serif text-lg text-brand-textmain">{t('quickEditor')}</h3>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('fields.contentTitle')}</label>
            <input className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" placeholder={t('fields.titlePh')} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('fields.body')}</label>
            <textarea rows={6} className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" placeholder={t('fields.bodyPh')} />
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex-1"><ImageIcon className="h-3.5 w-3.5" /> {t('addImage')}</button>
            <button className="btn-ghost"><FileText className="h-3.5 w-3.5" /> {t('preview')}</button>
          </div>
          <button className="btn-primary">{t('publish')}</button>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'gold' }) {
  const labelCls = tone === 'green' ? 'text-green-600' : tone === 'gold' ? 'text-brand-gold' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}
