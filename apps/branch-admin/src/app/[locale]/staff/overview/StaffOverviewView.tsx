'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users, UserPlus, Activity, Award, Loader2 } from 'lucide-react';
import { useStaff, useAttendance, type StaffDto, type AttendanceRow } from '@/lib/hooks';

type RoleKey = 'therapist' | 'receptionist' | 'manager' | 'support';

function roleKey(role: string): RoleKey {
  const r = (role || '').toLowerCase();
  if (r.includes('manager') || r.includes('senior') || r.includes('quản lý')) return 'manager';
  if (r.includes('reception') || r.includes('lễ tân') || r.includes('admin')) return 'receptionist';
  if (r.includes('support') || r.includes('hỗ trợ')) return 'support';
  return 'therapist';
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function StaffOverviewView() {
  const t = useTranslations('staffOverview');
  const today = new Date().toISOString().slice(0, 10);

  const { data: staff, loading: loadingStaff, error: errorStaff } = useStaff();
  const { data: attendance, loading: loadingAtt, error: errorAtt } = useAttendance(today);

  const staffList: StaffDto[] = staff ?? [];
  const attendanceRows: AttendanceRow[] = attendance ?? [];
  const loading = loadingStaff || loadingAtt;
  const error = errorStaff || errorAtt;

  // KPIs computed client-side.
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.active).length;
  const onTime = attendanceRows.filter(r => r.status === 'present').length;
  const late = attendanceRows.filter(r => r.status === 'late').length;
  const onLeave = attendanceRows.filter(r => r.status === 'off' || r.status === 'absent').length;

  // Workforce distribution by inferred role.
  const dist = useMemo(() => {
    const counts: Record<RoleKey, number> = { therapist: 0, receptionist: 0, manager: 0, support: 0 };
    staffList.forEach(s => { counts[roleKey(s.roleInBranch)]++; });
    return counts;
  }, [staffList]);

  // Recent attendance "activity" — derived from today's attendance rows.
  const activities = useMemo(() => {
    return attendanceRows
      .filter(a => a.actualIn || a.actualOut || a.status === 'off')
      .slice(0, 6)
      .map((a, idx) => {
        let actionKey: 'checkedIn' | 'completedShift' | 'onLeave' = 'checkedIn';
        let time = fmtTime(a.actualIn);
        if (a.status === 'off' || a.status === 'absent') {
          actionKey = 'onLeave';
          time = t('today');
        } else if (a.actualOut) {
          actionKey = 'completedShift';
          time = fmtTime(a.actualOut);
        }
        return { id: a.staffId + '-' + idx, staff: a.staffName, initials: initialsOf(a.staffName), actionKey, time };
      });
  }, [attendanceRows, t]);

  const checkedInIds = attendanceRows.filter(a => a.status === 'present' || a.status === 'late').map(a => a.staffId);
  const onLeaveIds = attendanceRows.filter(a => a.status === 'off' || a.status === 'absent').map(a => a.staffId);
  const checkedInStaff = staffList.filter(s => checkedInIds.includes(s.id)).slice(0, 6);
  const onLeaveStaff = staffList.filter(s => onLeaveIds.includes(s.id)).slice(0, 6);

  // TODO(Phase B): branch-by-branch counts + monthly top-performer revenue need
  // a /v1/reports/staff endpoint. Show active staff as a placeholder ranking.
  const topPerformers = staffList.filter(s => s.active).slice(0, 3);

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Users className="h-4 w-4" /> {t('viewAll')}</button>
          <button className="btn-primary"><UserPlus className="h-4 w-4" /> {t('addStaff')}</button>
        </div>
      </header>

      {loading && (
        <div className="rounded-2xl border border-brand-cream bg-white p-10 text-center shadow-soft">
          <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
        </div>
      )}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <KpiTile label={t('kpi.totalStaff')} value={String(totalStaff)} />
            <KpiTile label={t('kpi.workingToday')} value={String(onTime + late)} accent="green" />
            <KpiTile label={t('kpi.onLeave')} value={String(onLeave)} accent="rose" />
            {/* TODO(Phase B): "new this month" needs created_at on StaffDto */}
            <KpiTile label={t('kpi.newThisMonth')} value="—" accent="gold" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
              <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('workforceDistribution')}</h3>
              <ul className="space-y-2 mt-2 text-sm">
                <DistRow label={t('role.therapist')}    count={dist.therapist} />
                <DistRow label={t('role.receptionist')} count={dist.receptionist} />
                <DistRow label={t('role.manager')}      count={dist.manager} />
                <DistRow label={t('role.support')}      count={dist.support} />
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
              <h3 className="font-serif text-lg text-brand-textmain mb-3">{t('staffByBranch')}</h3>
              {/* TODO(Phase B): cross-branch counts need an org-scoped endpoint. */}
              <ul className="space-y-2 mt-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-brand-textmain">Chi nhánh hiện tại</span>
                  <span className="font-serif text-xl text-brand-gold">{activeStaff}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
              <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3"><Activity className="h-4 w-4 mr-2 text-brand-gold" /> {t('todayStatus')}</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-semibold text-green-600 mb-2">{t('checkedIn')}</h4>
                  <div className="flex -space-x-2">
                    {checkedInStaff.length === 0 && <span className="text-xs text-brand-textmuted">—</span>}
                    {checkedInStaff.map(s => (
                      <div key={s.id} className="w-9 h-9 rounded-full bg-white border border-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">
                        {initialsOf(s.fullName)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-semibold text-brand-rose mb-2">{t('onLeaveToday')}</h4>
                  <div className="flex -space-x-2">
                    {onLeaveStaff.length === 0 && <span className="text-xs text-brand-textmuted">—</span>}
                    {onLeaveStaff.map(s => (
                      <div key={s.id} className="w-9 h-9 rounded-full bg-white border border-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">
                        {initialsOf(s.fullName)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
              <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
                <h2 className="font-serif text-lg text-brand-textmain">{t('recentActivity')}</h2>
              </div>
              <ul className="divide-y divide-brand-cream/60">
                {activities.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-brand-textmuted">—</li>
                )}
                {activities.map(a => (
                  <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs text-brand-textmain">{a.initials}</div>
                    <div className="flex-1">
                      <p className="text-sm text-brand-textmain">
                        <span className="font-medium">{a.staff}</span> · {t(`activity.${a.actionKey}` as 'activity.checkedIn')}
                      </p>
                    </div>
                    <span className="text-xs text-brand-textmuted">{a.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
              <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-2"><Award className="h-4 w-4 mr-2 text-brand-gold" /> {t('topPerformers')}</h3>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-3">{t('thisMonth')}</p>
              <ul className="space-y-3">
                {topPerformers.length === 0 && (
                  <li className="text-xs text-brand-textmuted">—</li>
                )}
                {topPerformers.map((p, idx) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center font-serif text-sm text-brand-textmain shadow-sm ${idx === 0 ? 'border-2 border-brand-gold' : 'border border-brand-cream'}`}>
                      {initialsOf(p.fullName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brand-textmain">{p.fullName}</p>
                      <p className="text-[10px] text-brand-textmuted">#{idx + 1}</p>
                    </div>
                    {/* TODO(Phase B): per-staff revenue not on StaffDto */}
                    <p className={`font-serif font-semibold ${idx === 0 ? 'text-brand-gold' : 'text-brand-textmain'}`}>—</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: 'gold' | 'green' | 'rose' }) {
  const cls = accent === 'gold' ? 'text-brand-gold' : accent === 'green' ? 'text-green-600' : accent === 'rose' ? 'text-brand-rose' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cls}`}>{label}</p>
      <p className="font-serif text-3xl text-brand-textmain">{value}</p>
    </div>
  );
}

function DistRow({ label, count }: { label: string; count: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-brand-textmain">{label}</span>
      <span className="font-serif text-xl text-brand-gold">{count}</span>
    </li>
  );
}
