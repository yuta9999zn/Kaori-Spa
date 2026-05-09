'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Filter, Star, Phone, Mail, MoreHorizontal, Loader2 } from 'lucide-react';
import { useStaff, type StaffDto } from '@/lib/hooks';

type RoleKey = 'senior' | 'therapist' | 'junior' | 'reception';
type StatusKey = 'active' | 'on_leave' | 'inactive';

/** Map free-text `roleInBranch` from the backend to one of the known role keys
 *  used by the i18n bundle. Unknown values fall through to 'therapist'. */
function roleKey(role: string): RoleKey {
  const r = (role || '').toLowerCase();
  if (r.includes('senior') || r.includes('manager')) return 'senior';
  if (r.includes('junior')) return 'junior';
  if (r.includes('reception') || r.includes('admin') || r.includes('lễ tân')) return 'reception';
  return 'therapist';
}

export default function StaffListView() {
  const t = useTranslations('staffList');
  const { data, loading, error } = useStaff();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'' | RoleKey>('');
  const [status, setStatus] = useState<'' | StatusKey>('');

  const rows = useMemo(() => {
    const all = data ?? [];
    return all.filter(s => {
      // TODO(Phase B): backend `StaffDto.active` is bool; on_leave is not a real
      // status yet — treat any inactive as "inactive" only.
      const sk: StatusKey = s.active ? 'active' : 'inactive';
      const rk = roleKey(s.roleInBranch);
      if (role && rk !== role) return false;
      if (status && sk !== status) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = `${s.code} ${s.fullName} ${s.nickname ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, q, role, status]);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Filter className="h-4 w-4" /> {t('filter')}</button>
          <button className="btn-primary"><Plus className="h-4 w-4" /> {t('create')}</button>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-white px-4 py-2 max-w-md flex-1 shadow-soft">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t('search')}
          />
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value as '' | RoleKey)}
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft"
        >
          <option value="">{t('roleAll')}</option>
          <option value="senior">{t('role.senior')}</option>
          <option value="therapist">{t('role.therapist')}</option>
          <option value="junior">{t('role.junior')}</option>
          <option value="reception">{t('role.reception')}</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as '' | StatusKey)}
          className="rounded-full border border-brand-cream bg-white px-4 py-2 text-sm shadow-soft"
        >
          <option value="">{t('statusAll')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="on_leave">{t('status.on_leave')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['code', 'name', 'role', 'contact', 'rating', 'bookings', 'status', 'actions'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.code')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center">
                <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
              </td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-rose-600">
                {error.message}
              </td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                Chưa có dữ liệu
              </td></tr>
            )}
            {!loading && rows.map(s => <StaffRow key={s.id} s={s} />)}
          </tbody>
        </table>
        <div className="border-t border-brand-cream/60 bg-brand-ivory/20 px-4 py-2 text-[11px] text-brand-textmuted">
          {t('paginationSummary', {
            from: rows.length === 0 ? 0 : 1,
            to: rows.length,
            total: data?.length ?? 0
          })}
        </div>
      </div>
    </>
  );
}

function StaffRow({ s }: { s: StaffDto }) {
  const t = useTranslations('staffList');
  const rk = roleKey(s.roleInBranch);
  const sk: StatusKey = s.active ? 'active' : 'inactive';

  // TODO(Phase B): rating, bookings, phone, email aren't on StaffDto yet —
  // fall back to placeholder values until the backend exposes them.
  const rating = 0;
  const bookings = 0;
  const phone = '—';
  const email = '—';

  return (
    <tr className="hover:bg-brand-cream/15">
      <td className="px-4 py-3 font-mono text-xs text-brand-gold">{s.code}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-brand-textmain">{s.fullName}</div>
        {s.nickname && <div className="text-[11px] text-brand-textmuted">"{s.nickname}"</div>}
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-brand-cream/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-textmuted">
          {t(`role.${rk}` as 'role.senior')}
        </span>
      </td>
      <td className="px-4 py-3 text-brand-textmuted">
        <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {phone}</div>
        <div className="flex items-center gap-1 text-xs mt-0.5"><Mail className="h-3 w-3" /> {email}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-brand-gold text-brand-gold" />
          <span className="font-medium text-brand-textmain">{rating.toFixed(2)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-brand-textmuted tabular-nums">{bookings}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
          sk === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
        }`}>
          {t(`status.${sk}` as 'status.active')}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button className="text-brand-textmuted hover:text-brand-gold">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
