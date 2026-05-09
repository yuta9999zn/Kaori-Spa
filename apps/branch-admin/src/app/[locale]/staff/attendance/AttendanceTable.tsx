'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { useAttendance, checkIn, checkOut, useStaff, type AttendanceRow } from '@/lib/hooks';

const SHIFT_BG: Record<string, string> = {
  SANG: 'bg-amber-100 text-amber-800',
  TOI:  'bg-indigo-100 text-indigo-800',
  FULL: 'bg-emerald-100 text-emerald-800',
  NGHI: 'bg-rose-100 text-rose-700'
};

const STATUS_BG: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-700',
  present:   'bg-emerald-100 text-emerald-700',
  late:      'bg-amber-100 text-amber-700',
  absent:    'bg-rose-100 text-rose-700',
  early_out: 'bg-amber-100 text-amber-700',
  off:       'bg-blue-100 text-blue-700',
  no_shift:  'bg-slate-100 text-slate-500'
};

const SEED: AttendanceRow[] = [
  { staffId: 's1', staffName: 'Nguyễn Khánh Linh', staffNickname: 'miko',  date: '', shiftType: 'FULL', expectedStart: '09:00', expectedEnd: '21:00', actualIn: '08:55', actualOut: null,  status: 'present',   minutesWorked: null, minutesLate: 0 },
  { staffId: 's2', staffName: 'Lê Thị Yến',         staffNickname: 'yến',   date: '', shiftType: 'SANG', expectedStart: '09:00', expectedEnd: '15:00', actualIn: '09:18', actualOut: '15:02', status: 'late',      minutesWorked: 344,  minutesLate: 18 },
  { staffId: 's3', staffName: 'Phạm Thị Mai',       staffNickname: 'mai',   date: '', shiftType: 'TOI',  expectedStart: '15:00', expectedEnd: '21:00', actualIn: null,    actualOut: null,    status: 'scheduled', minutesWorked: null, minutesLate: null },
  { staffId: 's4', staffName: 'Nguyễn Thị Nhung',   staffNickname: 'nhung', date: '', shiftType: 'NGHI', expectedStart: null,    expectedEnd: null,    actualIn: null,    actualOut: null,    status: 'off',       minutesWorked: null, minutesLate: null }
];

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  if (iso.length <= 5) return iso;
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceTable() {
  const t = useTranslations('attendance');
  const today = new Date().toISOString().slice(0, 10);
  const { data, error, refetch, loading } = useAttendance(today);
  const { data: staffPage } = useStaff();
  const staffList = staffPage?.items;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  const rows = data ?? SEED;

  const punchIn = async () => {
    if (!selectedStaff) return;
    setPendingId(selectedStaff);
    try { await checkIn(selectedStaff); await refetch(); } finally { setPendingId(null); }
  };
  const punchOut = async () => {
    if (!selectedStaff) return;
    setPendingId(selectedStaff);
    try { await checkOut(selectedStaff); await refetch(); } finally { setPendingId(null); }
  };

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          API offline — demo data.
        </div>
      )}

      <section className="mb-6 flex flex-wrap items-center gap-3 max-w-2xl">
        <select
          value={selectedStaff}
          onChange={e => setSelectedStaff(e.target.value)}
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft outline-none focus:border-brand-gold"
        >
          <option value="">— Chọn nhân viên —</option>
          {(staffList ?? []).map(s => (
            <option key={s.id} value={s.id}>{s.fullName} (@{s.nickname})</option>
          ))}
        </select>
        <button onClick={punchIn} disabled={!selectedStaff || pendingId !== null} className="btn-primary disabled:opacity-50">
          {pendingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {t('checkIn')}
        </button>
        <button onClick={punchOut} disabled={!selectedStaff || pendingId !== null} className="btn-ghost disabled:opacity-50">
          <LogOut className="h-4 w-4" /> {t('checkOut')}
        </button>
      </section>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        {loading && !data ? (
          <div className="p-8 text-center text-brand-textmuted">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nhân viên</th>
                <th className="text-left px-4 py-3 font-medium">Ca</th>
                <th className="text-left px-4 py-3 font-medium">{t('expected')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('in')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('out')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('worked')}</th>
                <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream/60">
              {rows.map(r => (
                <tr key={r.staffId} className="hover:bg-brand-cream/15">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.staffName}</div>
                    <div className="text-xs text-brand-textmuted">@{r.staffNickname}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SHIFT_BG[r.shiftType ?? ''] ?? ''}`}>
                      {r.shiftType ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-textmuted">
                    {r.expectedStart && r.expectedEnd ? `${r.expectedStart}-${r.expectedEnd}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtTime(r.actualIn)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtTime(r.actualOut)}</td>
                  <td className="px-4 py-3 text-xs text-brand-textmuted">
                    {r.minutesWorked == null ? '—' : `${r.minutesWorked} ${t('minutes')}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_BG[r.status] ?? ''}`}>
                      {t(`status.${r.status}` as 'status.present')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
