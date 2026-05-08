'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useShiftGrid, saveShiftAssignments, type ShiftRow } from '@/lib/hooks';

type ShiftType = 'SANG' | 'TOI' | 'FULL' | 'NGHI' | null;
const TYPES: ShiftType[] = ['SANG', 'TOI', 'FULL', 'NGHI'];

const TYPE_STYLE: Record<NonNullable<ShiftType>, string> = {
  SANG: 'bg-amber-100 text-amber-800 border-amber-300',
  TOI:  'bg-indigo-100 text-indigo-800 border-indigo-300',
  FULL: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  NGHI: 'bg-rose-100 text-rose-700 border-rose-300'
};

const SEED: ShiftRow[] = [
  { staffId: 's1', code: 'NV-575-MIKO',  fullName: 'Nguyễn Khánh Linh', nickname: 'miko',  byDate: {}, stats: { SANG: 0, TOI: 0, FULL: 0, NGHI: 0 } },
  { staffId: 's2', code: 'NV-575-YEN',   fullName: 'Lê Thị Yến',        nickname: 'yến',   byDate: {}, stats: { SANG: 0, TOI: 0, FULL: 0, NGHI: 0 } },
  { staffId: 's3', code: 'NV-575-MAI',   fullName: 'Phạm Thị Mai',      nickname: 'mai',   byDate: {}, stats: { SANG: 0, TOI: 0, FULL: 0, NGHI: 0 } }
];

export default function ShiftManager() {
  const t = useTranslations('shift');
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { data, loading, error, refetch } = useShiftGrid(year, month);

  const rows: ShiftRow[] = data?.rows ?? SEED;
  const [edits, setEdits] = useState<Record<string, ShiftType>>({});
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => {
    const last = new Date(year, month, 0).getDate();
    return Array.from({ length: last }, (_, i) => i + 1);
  }, [year, month]);

  const dateKey = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const cellValue = (row: ShiftRow, key: string): ShiftType => {
    const editKey = `${row.staffId}|${key}`;
    if (editKey in edits) return edits[editKey];
    return (row.byDate[key] as ShiftType) ?? null;
  };

  const cycle = (cur: ShiftType): ShiftType => {
    const idx = cur === null ? -1 : TYPES.indexOf(cur);
    return idx >= TYPES.length - 1 ? null : (TYPES[idx + 1] as ShiftType);
  };

  const set = (staffId: string, key: string, current: ShiftType) => {
    setEdits(prev => ({ ...prev, [`${staffId}|${key}`]: cycle(current) }));
  };

  const save = async () => {
    if (saving) return;
    const assignments = Object.entries(edits)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => {
        const [staffId, workDate] = k.split('|');
        return { staffId, workDate, shiftType: v as 'SANG' | 'TOI' | 'FULL' | 'NGHI' };
      });
    if (assignments.length === 0) return;
    setSaving(true);
    try {
      await saveShiftAssignments(assignments);
      setEdits({});
      await refetch();
    } catch (e) {
      console.error('save shift failed', e);
    } finally {
      setSaving(false);
    }
  };

  const goPrev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); };

  const dow = (day: number) => new Date(year, month - 1, day).getDay();
  const dirty = Object.keys(edits).length;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="btn-ghost !py-2 !px-3"><ChevronLeft className="h-4 w-4" /> {t('prev')}</button>
          <span className="font-serif text-xl px-3">{month}/{year}</span>
          <button onClick={goNext} className="btn-ghost !py-2 !px-3">{t('next')} <ChevronRight className="h-4 w-4" /></button>
          <button onClick={goToday} className="btn-ghost !py-2 !px-3">{t('today')}</button>
          <button onClick={save} disabled={saving || dirty === 0} className="btn-primary disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty > 0 ? `${t('save')} (${dirty})` : t('saved')}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          API offline — demo data. ({error.message})
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-brand-textmuted">
        {TYPES.map(typ => (
          <span key={typ} className={cn('rounded-full px-3 py-1 border', TYPE_STYLE[typ!])}>
            {t(`typeFull.${typ}` as 'typeFull.SANG')}
          </span>
        ))}
        <span className="ml-auto italic">{t('legend')}</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        {loading && !data ? (
          <div className="p-8 text-center text-brand-textmuted"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : (
          <table className="text-xs border-collapse">
            <thead>
              <tr className="bg-brand-cream/40 text-brand-textmuted">
                <th className="sticky left-0 z-10 bg-brand-cream/40 border-r border-brand-cream px-3 py-2 text-left font-medium min-w-[180px]">Nhân viên</th>
                {days.map(d => (
                  <th key={d} className={cn(
                    'border-r border-brand-cream/60 w-10 text-center font-medium',
                    dow(d) === 0 && 'text-rose-500',
                    dow(d) === 1 && 'text-blue-500'
                  )}>
                    <div className="py-1">{d}</div>
                    <div className="text-[9px] text-brand-textmuted/70 pb-1">{['CN','T2','T3','T4','T5','T6','T7'][dow(d)]}</div>
                  </th>
                ))}
                {TYPES.map(typ => (
                  <th key={typ} className="border-l border-brand-cream w-12 text-center font-medium">
                    {t(`type.${typ}` as 'type.SANG')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const counts = { SANG: 0, TOI: 0, FULL: 0, NGHI: 0 };
                days.forEach(d => { const v = cellValue(r, dateKey(d)); if (v) counts[v]++; });
                return (
                  <tr key={r.staffId} className="hover:bg-brand-cream/15">
                    <td className="sticky left-0 z-10 bg-white border-r border-brand-cream px-3 py-2">
                      <div className="font-medium text-brand-textmain text-[13px]">{r.fullName}</div>
                      <div className="text-[10px] text-brand-textmuted">@{r.nickname}</div>
                    </td>
                    {days.map(d => {
                      const key = dateKey(d);
                      const v = cellValue(r, key);
                      const isDirty = `${r.staffId}|${key}` in edits;
                      return (
                        <td key={d} className="border-r border-brand-cream/40 p-0.5 text-center">
                          <button
                            onClick={() => set(r.staffId, key, v)}
                            className={cn(
                              'block w-9 h-9 rounded text-[10px] font-medium border transition',
                              v ? TYPE_STYLE[v] : 'border-transparent text-brand-textmuted/40 hover:bg-brand-cream/40',
                              isDirty && 'ring-2 ring-brand-gold ring-offset-1'
                            )}
                          >
                            {v ? t(`type.${v}` as 'type.SANG') : '·'}
                          </button>
                        </td>
                      );
                    })}
                    {TYPES.map(typ => (
                      <td key={typ} className="border-l border-brand-cream/40 text-center font-medium">
                        {counts[typ as 'SANG']}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
