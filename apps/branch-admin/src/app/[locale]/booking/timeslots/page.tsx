import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Clock, CalendarRange, Save, Plus } from 'lucide-react';

export default async function BookingTimeslotsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('bookingTimeslots');

  // TODO(Phase B): wire to backend when endpoint ships
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  const staffShifts = [
    { name: 'Anna Nguyễn', start: '09:00', end: '17:00', breakTime: '12:00–13:00' },
    { name: 'Elena Rodriguez', start: '11:00', end: '21:00', breakTime: '15:00–15:30' },
    { name: 'Maria Trần', start: '09:00', end: '21:00', breakTime: '12:30–13:30 / 18:00–18:30' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Plus className="h-4 w-4" /> {t('addSpecial')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch hours */}
        <section className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
          <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
            <Clock className="h-4 w-4 text-brand-gold" /> {t('branchHours')}
          </h2>
          <div className="space-y-2">
            {days.map(d => (
              <div key={d} className="grid grid-cols-12 items-center gap-3 text-sm">
                <div className="col-span-3 text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted">
                  {t(`days.${d}` as 'days.mon')}
                </div>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="col-span-3 rounded-xl border border-brand-cream px-3 py-2 text-sm font-mono"
                  disabled={d === 'sun'}
                />
                <span className="col-span-1 text-center text-brand-textmuted">—</span>
                <input
                  type="time"
                  defaultValue="21:00"
                  className="col-span-3 rounded-xl border border-brand-cream px-3 py-2 text-sm font-mono"
                  disabled={d === 'sun'}
                />
                <label className="col-span-2 flex items-center gap-2 text-xs">
                  <input type="checkbox" defaultChecked={d !== 'sun'} /> {t('open')}
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Slot config */}
        <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
          <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
            <CalendarRange className="h-4 w-4 text-brand-gold" /> {t('slotConfig')}
          </h2>

          <div className="space-y-4">
            <Field label={t('intervalLabel')}>
              <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
                <option>{t('minutes', { n: '15' })}</option>
                <option>{t('minutes', { n: '30' })}</option>
                <option>{t('minutes', { n: '60' })}</option>
              </select>
            </Field>
            <Field label={t('bufferLabel')}>
              <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
                <option>{t('minutes', { n: '0' })}</option>
                <option>{t('minutes', { n: '10' })}</option>
                <option>{t('minutes', { n: '15' })}</option>
              </select>
            </Field>
            <Field label={t('parallelLabel')} hint={t('parallelHint')}>
              <input type="number" defaultValue={3} className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm" />
            </Field>
          </div>
        </section>
      </div>

      {/* Staff shifts */}
      <section className="mt-6 bg-white rounded-2xl shadow-soft border border-brand-cream/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-cream/50 bg-brand-ivory/30">
          <h2 className="font-serif text-lg text-brand-textmain">{t('staffShifts')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-brand-ivory/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-5 py-3 font-medium">{t('cols.staffName')}</th>
                <th className="text-center px-5 py-3 font-medium">{t('cols.start')}</th>
                <th className="text-center px-5 py-3 font-medium">{t('cols.end')}</th>
                <th className="text-center px-5 py-3 font-medium">{t('cols.break')}</th>
                <th className="text-right px-5 py-3 font-medium">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {staffShifts.map(s => (
                <tr key={s.name} className="hover:bg-brand-ivory/30">
                  <td className="px-5 py-3 font-medium text-brand-textmain">{s.name}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs">{s.start}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs">{s.end}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs text-brand-textmuted">{s.breakTime}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs font-medium text-brand-gold hover:underline">{t('edit')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-brand-textmuted mt-1.5">{hint}</p>}
    </div>
  );
}
