'use client';

import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, Calendar, Award, Briefcase, Edit3, Loader2 } from 'lucide-react';
import { useStaff, type StaffDto } from '@/lib/hooks';

// TODO(Phase B): replace with `[id]/page.tsx` route + GET /v1/staff/{id}.
// For now we just pick the first staff returned by useStaff() so the page
// has live data instead of mocks.

const PLACEHOLDER = {
  joinedAt: '—',
  email: '—',
  phone: '—',
  address: '—',
  branch: '—',
  rating: 0,
  bookings: 0,
  uniqueCustomers: 0,
  onTimePct: 0,
  bio: '',
  certifications: [] as Array<{ id: string; name: string; issuer: string; year: number }>,
  recentBookings: [] as Array<{ id: string; date: string; service: string; customer: string; status: 'done' | 'cancelled' | 'no_show' }>
};

function roleKey(role: string): 'senior' | 'therapist' | 'junior' | 'reception' {
  const r = (role || '').toLowerCase();
  if (r.includes('senior') || r.includes('manager')) return 'senior';
  if (r.includes('junior')) return 'junior';
  if (r.includes('reception') || r.includes('admin') || r.includes('lễ tân')) return 'reception';
  return 'therapist';
}

export default function StaffProfileView() {
  const t = useTranslations('staffProfile');
  const { data, loading, error } = useStaff();

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="inline h-6 w-6 animate-spin text-brand-gold" />
      </div>
    );
  }
  if (error) {
    return <div className="py-20 text-center text-sm text-rose-600">{error.message}</div>;
  }
  const staff: StaffDto | undefined = data?.items?.[0];
  if (!staff) {
    return (
      <div className="py-20 text-center text-sm text-brand-textmuted">
        Chưa có nhân viên nào.
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
        <button className="btn-primary"><Edit3 className="h-4 w-4" /> {t('edit')}</button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <aside className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-rose-300 font-serif text-2xl text-white shadow-soft">
              {staff.fullName.split(' ').map(p => p[0]).slice(-2).join('')}
            </div>
            <h2 className="font-serif text-xl text-brand-textmain">{staff.fullName}</h2>
            {staff.nickname && (
              <p className="text-xs text-brand-textmuted mt-0.5">"{staff.nickname}"</p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-widest text-brand-gold">
              {t(`role.${roleKey(staff.roleInBranch)}` as 'role.senior')}
            </p>
            <p className="font-mono text-xs text-brand-textmuted mt-1">{staff.code}</p>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <Row icon={Mail} value={PLACEHOLDER.email} />
            <Row icon={Phone} value={PLACEHOLDER.phone} />
            <Row icon={MapPin} value={PLACEHOLDER.address} />
            <Row icon={Briefcase} value={PLACEHOLDER.branch} />
            <Row icon={Calendar} value={t('joinedAt', { date: PLACEHOLDER.joinedAt })} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-brand-cream/60 pt-4 text-center">
            <Stat label={t('stats.rating')} value={PLACEHOLDER.rating.toFixed(2)} accent />
            <Stat label={t('stats.bookings')} value={String(PLACEHOLDER.bookings)} />
            <Stat label={t('stats.onTime')} value={`${(PLACEHOLDER.onTimePct * 100).toFixed(0)}%`} />
          </div>
        </aside>

        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-lg text-brand-textmain mb-3 border-b border-brand-cream/50 pb-3">
              {t('about')}
            </h2>
            <p className="text-sm text-brand-textmuted leading-relaxed">
              {PLACEHOLDER.bio || '—'}
            </p>
          </section>

          {/* Certifications */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-lg text-brand-textmain mb-3 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <Award className="h-4 w-4 text-brand-gold" /> {t('certifications')}
            </h2>
            {PLACEHOLDER.certifications.length === 0 ? (
              <p className="text-xs text-brand-textmuted py-3">—</p>
            ) : (
              <ul className="divide-y divide-brand-cream/60">
                {PLACEHOLDER.certifications.map(c => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-sm text-brand-textmain">{c.name}</p>
                      <p className="text-[11px] text-brand-textmuted">{c.issuer}</p>
                    </div>
                    <span className="text-xs font-mono text-brand-textmuted">{c.year}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent bookings */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-lg text-brand-textmain mb-3 border-b border-brand-cream/50 pb-3">
              {t('recentBookings')}
            </h2>
            {PLACEHOLDER.recentBookings.length === 0 ? (
              <p className="text-xs text-brand-textmuted py-3">Chưa có dữ liệu</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                  <tr>
                    <th className="text-left py-2 font-medium">{t('bookingCols.date')}</th>
                    <th className="text-left py-2 font-medium">{t('bookingCols.service')}</th>
                    <th className="text-left py-2 font-medium">{t('bookingCols.customer')}</th>
                    <th className="text-right py-2 font-medium">{t('bookingCols.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream/60">
                  {PLACEHOLDER.recentBookings.map(b => (
                    <tr key={b.id}>
                      <td className="py-2 font-mono text-xs text-brand-textmuted">{b.date}</td>
                      <td className="py-2">{b.service}</td>
                      <td className="py-2 text-brand-textmuted">{b.customer}</td>
                      <td className="py-2 text-right">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-700">
                          {t(`bookingStatus.${b.status}` as 'bookingStatus.done')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-2 text-brand-textmuted">
      <Icon className="h-3.5 w-3.5 flex-none" />
      <span className="text-xs">{value}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-brand-textmuted">{label}</p>
      <p className={`font-serif text-lg mt-0.5 ${accent ? 'text-brand-gold' : 'text-brand-textmain'}`}>
        {value}
      </p>
    </div>
  );
}
