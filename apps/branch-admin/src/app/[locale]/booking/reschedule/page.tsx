import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, AlertTriangle, CheckCircle2, Calendar, Save } from 'lucide-react';

export default async function BookingReschedulePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('bookingReschedule');

  // TODO(Phase B): wire to backend when endpoint ships
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'];
  const selectedSlot = '14:00';

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost">{t('cancel')}</button>
          <button className="btn-primary"><Save className="h-4 w-4" /> {t('confirmReschedule')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('currentSchedule')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('cols.customer')} value="Lê Thị Hương" />
              <Field label={t('cols.service')} value="Massage cổ vai gáy (60 phút)" />
              <Field label={t('cols.staff')} value="Anna Nguyễn" />
              <Field label={t('cols.dateTime')} value="10/03/2026 · 10:00 — 11:00" />
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-gold" /> {t('selectNewSlot')}
            </h2>

            <div className="flex gap-2 mb-4 flex-wrap">
              {[t('today'), t('tomorrow'), '14/03', '15/03', '16/03'].map((d, i) => (
                <button
                  key={i}
                  className={`rounded-full px-4 py-1.5 text-xs border transition ${
                    i === 1
                      ? 'bg-brand-gold border-brand-gold text-white'
                      : 'border-brand-cream text-brand-textmain hover:border-brand-gold'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="grid gap-2 grid-cols-3 md:grid-cols-5">
              {slots.map(s => (
                <button
                  key={s}
                  className={`rounded-lg border py-2 text-xs font-mono transition ${
                    s === selectedSlot
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-goldhover'
                      : 'border-brand-cream bg-white text-brand-textmain hover:border-brand-gold'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex gap-3 items-start text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">{t('conflictTitle')}</p>
                <p className="text-xs text-red-700/80 mt-0.5">{t('conflictMsg')}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('staffRoom')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('newStaff')}</label>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
                  <option>Anna Nguyễn</option>
                  <option>Elena Rodriguez</option>
                  <option>Maria Tran</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('newRoom')}</label>
                <select className="w-full rounded-xl border border-brand-cream px-3 py-2 text-sm">
                  <option>Phòng VIP 2</option>
                  <option>Phòng Massage 1</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-brand-cream/60">
            <h2 className="font-serif text-lg text-brand-textmain mb-4 border-b border-brand-cream/50 pb-2">{t('summary')}</h2>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-brand-cream bg-brand-ivory/40 p-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">{t('original')}</p>
                <p className="font-medium text-brand-textmain">10/03/2026 · 10:00</p>
                <p className="text-xs text-brand-textmuted">Anna Nguyễn · Phòng VIP 2</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="rounded-xl border border-brand-gold bg-brand-gold/10 p-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-goldhover mb-1">{t('new')}</p>
                <p className="font-medium text-brand-textmain">14/03/2026 · 14:00</p>
                <p className="text-xs text-brand-textmuted">Anna Nguyễn · Phòng VIP 2</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-brand-cream/60">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-2">{t('notify')}</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked /> {t('notifySms')}
              </label>
              <label className="flex items-center gap-2 text-sm mt-1">
                <input type="checkbox" defaultChecked /> {t('notifyZalo')}
              </label>
              <label className="flex items-center gap-2 text-sm mt-1">
                <input type="checkbox" /> {t('notifyEmail')}
              </label>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex gap-2 items-center text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {t('refundNote')}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-0.5">{label}</p>
      <p className="font-medium text-brand-textmain text-sm">{value}</p>
    </div>
  );
}
