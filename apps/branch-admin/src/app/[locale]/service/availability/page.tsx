import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Plus, Calendar, Clock, AlertTriangle, Edit2 } from 'lucide-react';

type Rule = {
  id: string;
  name: string;
  appliesTo: string;
  days: string;
  hours: string;
  capacity: number;
  type: 'standard' | 'premium' | 'maintenance';
  status: 'active' | 'paused';
};

export default async function ServiceAvailabilityPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  const t = await getTranslations('serviceAvailability');

  // TODO(Phase B): wire to backend when endpoint ships
  const rules: Rule[] = [
    { id: 'rule-1', name: 'Quy tắc Massage buổi sáng', appliesTo: 'Massage trị liệu, Massage Thuỵ Điển', days: 'T2 - T6', hours: '09:00 - 12:00', capacity: 4, type: 'standard', status: 'active' },
    { id: 'rule-2', name: 'Premium cuối tuần', appliesTo: 'Triệt lông toàn thân nữ', days: 'T7, CN', hours: '10:00 - 18:00', capacity: 2, type: 'premium', status: 'active' },
    { id: 'rule-3', name: 'Bảo trì máy Diode', appliesTo: 'Tất cả dịch vụ triệt lông', days: '15/05/2026', hours: '14:00 - 17:00', capacity: 0, type: 'maintenance', status: 'paused' },
    { id: 'rule-4', name: 'Slot Hydrating evening', appliesTo: 'Chăm sóc da Hydrating', days: 'T3, T5', hours: '18:00 - 21:00', capacity: 3, type: 'standard', status: 'active' }
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
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('newRule')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <Kpi label={t('kpi.total')} value="45" />
        <Kpi label={t('kpi.active')} value="38" tone="green" />
        <Kpi label={t('kpi.paused')} value="7" />
        <Kpi label={t('kpi.exceptions')} value="12" tone="gold" />
        <Kpi label={t('kpi.conflicts')} value="3" tone="red" />
      </section>

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('ruleList')}</h2>
          </div>
          <ul className="divide-y divide-brand-cream/60">
            {rules.map(r => (
              <li key={r.id} className="p-4 hover:bg-brand-ivory/30 flex items-start gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'premium' ? 'bg-brand-gold/10 text-brand-gold' : r.type === 'maintenance' ? 'bg-red-50 text-red-600' : 'bg-brand-cream/50 text-brand-textmain'}`}>
                  {r.type === 'maintenance' ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-serif text-base text-brand-textmain truncate">{r.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${r.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {t(`status.${r.status}` as 'status.active')}
                    </span>
                  </div>
                  <p className="text-xs text-brand-textmuted mb-2">{t('appliesTo')}: <span className="text-brand-textmain">{r.appliesTo}</span></p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-brand-textmuted">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {r.days}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.hours}</span>
                    <span>{t('capacity')}: <span className="text-brand-textmain font-medium">{r.capacity}</span></span>
                    <span className="text-brand-textmuted">{t(`type.${r.type}` as 'type.standard')}</span>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-brand-cream/50" aria-label="edit"><Edit2 className="h-4 w-4 text-brand-textmuted" /></button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5 flex flex-col gap-3">
          <h3 className="font-serif text-lg text-brand-textmain">{t('builder.title')}</h3>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('builder.ruleName')}</label>
            <input className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" placeholder={t('builder.ruleNamePh')} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('builder.applyTo')}</label>
            <select className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
              <option>{t('builder.allServices')}</option>
              <option>{t('builder.byCategory')}</option>
              <option>{t('builder.specific')}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('builder.from')}</label>
              <input type="time" className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" defaultValue="09:00" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('builder.to')}</label>
              <input type="time" className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" defaultValue="18:00" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted">{t('builder.capacity')}</label>
            <input type="number" defaultValue={2} className="mt-1 w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" />
          </div>
          <button className="btn-primary">{t('builder.save')}</button>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'gold' | 'red' }) {
  const labelCls = tone === 'green' ? 'text-green-600' : tone === 'gold' ? 'text-brand-gold' : tone === 'red' ? 'text-red-600' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}
