import { setRequestLocale, getTranslations } from 'next-intl/server';
import { HeartPulse, FilePlus, AlertTriangle, ShieldAlert } from 'lucide-react';

type Note = {
  id: string;
  date: string;
  category: 'allergy' | 'injury' | 'preference' | 'progress';
  staff: string;
  content: string;
};

export default async function CustomerHealthNotesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customerHealthNotes');

  // TODO(Phase B): wire to backend when endpoint ships
  const allergies = ['Phấn hoa', 'Latex', 'Aspirin'];
  const conditions = [t('conditions.lowBP'), t('conditions.recentSurgery')];
  const notes: Note[] = [
    { id: 'CN-1024', date: '10/03/2026', category: 'allergy', staff: 'Anna N.', content: t('mock.allergyNote') },
    { id: 'CN-0985', date: '14/02/2026', category: 'injury', staff: 'Elena R.', content: t('mock.injuryNote') },
    { id: 'CN-0812', date: '05/01/2026', category: 'preference', staff: 'Sarah M.', content: t('mock.preferenceNote') }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">JD</div>
          <div>
            <h1 className="font-serif text-3xl text-brand-textmain">John Doe</h1>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><HeartPulse className="h-4 w-4" /> {t('editHealth')}</button>
          <button className="btn-primary"><FilePlus className="h-4 w-4" /> {t('addNote')}</button>
        </div>
      </header>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6">
        <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide flex items-center gap-2 mb-2">
          <ShieldAlert className="h-4 w-4" /> {t('criticalAlerts')}
        </h3>
        <ul className="text-sm text-red-800 list-disc pl-5 space-y-1">
          <li>{t('alert.allergy', { items: allergies.join(', ') })}</li>
          <li>{t('alert.condition', { item: conditions[0] })}</li>
        </ul>
      </div>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
        <Box label={t('skinType')} value="Da hỗn hợp - nhạy cảm" />
        <Box label={t('medicalHistory')} value={t('mock.medicalHistory')} />
        <Box label={t('lastIntakeUpdate')} value="01/03/2026" sub="Anna N." />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 flex items-center justify-between bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('clinicalNotes')}</h2>
            <select className="rounded-full border border-brand-cream bg-white px-3 py-1.5 text-xs">
              <option>{t('categoryAll')}</option>
              <option>{t('category.allergy')}</option>
              <option>{t('category.injury')}</option>
              <option>{t('category.preference')}</option>
              <option>{t('category.progress')}</option>
            </select>
          </div>
          <ul className="divide-y divide-brand-cream/60">
            {notes.map(n => (
              <li key={n.id} className="px-4 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge cat={n.category} label={t(`category.${n.category}`)} />
                    <span className="text-[10px] font-mono text-brand-textmuted">{n.id}</span>
                  </div>
                  <span className="text-xs text-brand-textmuted">{n.date}</span>
                </div>
                <p className="text-sm text-brand-textmain">{n.content}</p>
                <p className="text-[10px] text-brand-textmuted mt-2">{t('byStaff', { name: n.staff })}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('contraindications')}</h3>
            <div className="flex flex-wrap gap-2">
              {allergies.map(a => (
                <span key={a} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />{a}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('wellnessAttributes')}</h3>
            <dl className="space-y-2 text-sm">
              <Row label={t('skinType')} value="Da hỗn hợp" />
              <Row label={t('massagePressure')} value={t('pressure.medium')} />
              <Row label={t('sensitivities')} value={t('mock.sensitivities')} />
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}

function Box({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">{label}</p>
      <p className="text-sm text-brand-textmain font-medium">{value}</p>
      {sub && <p className="text-[10px] text-brand-textmuted mt-1">{sub}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-brand-textmuted">{label}</dt>
      <dd className="text-brand-textmain font-medium">{value}</dd>
    </div>
  );
}

function CategoryBadge({ cat, label }: { cat: Note['category']; label: string }) {
  const cls =
    cat === 'allergy' ? 'bg-red-50 text-red-700 border-red-200' :
    cat === 'injury' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    cat === 'preference' ? 'bg-purple-50 text-purple-700 border-purple-200' :
    'bg-blue-50 text-blue-700 border-blue-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
