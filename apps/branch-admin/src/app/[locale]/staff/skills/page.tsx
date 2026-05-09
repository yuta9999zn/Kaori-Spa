import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Sparkles, Check, X, Plus, Search } from 'lucide-react';

// TODO(Phase B): wire to backend `GET /v1/staff/skills?branchId=...`
const SERVICES = [
  { id: 'sv1', name: 'Massage cổ vai gáy',     category: 'massage' },
  { id: 'sv2', name: 'Massage Thuỵ Điển',      category: 'massage' },
  { id: 'sv3', name: 'Triệt lông toàn thân',   category: 'hair_removal' },
  { id: 'sv4', name: 'Facial chuyên sâu',      category: 'facial' },
  { id: 'sv5', name: 'Hot stone therapy',      category: 'body' },
  { id: 'sv6', name: 'Aromatherapy',           category: 'massage' }
] as const;

const STAFF = [
  { id: 'st1', name: 'Nguyễn Khánh Linh', skills: ['sv1', 'sv2', 'sv4', 'sv5', 'sv6'] },
  { id: 'st2', name: 'Phạm Thị Mai',     skills: ['sv1', 'sv2', 'sv6'] },
  { id: 'st3', name: 'Lê Thị Yến',       skills: ['sv3', 'sv4'] },
  { id: 'st4', name: 'Nguyễn Lan Hương', skills: ['sv1', 'sv4', 'sv5'] },
  { id: 'st5', name: 'Trần Thị Bích',    skills: ['sv1'] }
] as const;

export default async function StaffSkillsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('staff');
  const t = await getTranslations('staffSkills');

  return (
    <>
      <SubNav items={subNavItems} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Plus className="h-4 w-4" /> {t('addService')}</button>
          <button className="btn-primary"><Check className="h-4 w-4" /> {t('save')}</button>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md shadow-soft">
        <Search className="h-4 w-4 text-brand-textmuted" />
        <input className="flex-1 bg-transparent text-sm outline-none" placeholder={t('search')} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium sticky left-0 bg-brand-cream/40">{t('columns.staff')}</th>
                {SERVICES.map(s => (
                  <th key={s.id} className="px-3 py-3 font-medium text-center min-w-[110px]">
                    <div className="text-brand-textmain">{s.name}</div>
                    <div className="text-[9px] text-brand-textmuted mt-0.5">{t(`category.${s.category}` as 'category.massage')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {STAFF.map(staff => (
                <tr key={staff.id} className="hover:bg-brand-cream/15">
                  <td className="px-4 py-3 font-medium text-brand-textmain sticky left-0 bg-white">{staff.name}</td>
                  {SERVICES.map(s => {
                    const has = (staff.skills as readonly string[]).includes(s.id);
                    return (
                      <td key={s.id} className="px-3 py-3 text-center">
                        {has ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <X className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[11px] text-brand-textmuted">
          {t('legend')}
        </div>
      </div>
    </>
  );
}
