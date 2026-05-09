import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Star, Mail, Phone, MapPin, Calendar, Award, Briefcase, Edit3 } from 'lucide-react';

// TODO(Phase B): wire to backend `GET /v1/staff/{id}`
const MOCK_STAFF = {
  id: 's1',
  code: 'KTV-001',
  name: 'Nguyễn Khánh Linh',
  nickname: 'miko',
  role: 'senior',
  joinedAt: '2024-03-15',
  email: 'linh.nguyen@kaori.vn',
  phone: '0901 234 567',
  address: 'Hai Bà Trưng, Hà Nội',
  branch: '575 Kim Mã',
  rating: 4.92,
  bookings: 142,
  uniqueCustomers: 89,
  onTimePct: 0.96,
  bio: 'Chuyên gia trị liệu cao cấp với 6 năm kinh nghiệm. Tốt nghiệp Học viện Spa Quốc tế.',
  certifications: [
    { id: 'c1', name: 'Advanced Hot Stone Therapy', issuer: 'ISTA', year: 2023 },
    { id: 'c2', name: 'Aromatherapy Master', issuer: 'IFA',  year: 2022 },
    { id: 'c3', name: 'Deep Tissue Specialist', issuer: 'NCBTMB', year: 2021 }
  ],
  recentBookings: [
    { id: 'b1', date: '2026-05-08', service: 'Massage cổ vai gáy', customer: 'Trần Mai',  status: 'done' },
    { id: 'b2', date: '2026-05-08', service: 'Facial chuyên sâu', customer: 'Lê Hà',      status: 'done' },
    { id: 'b3', date: '2026-05-07', service: 'Body therapy',       customer: 'Nguyễn Vy', status: 'done' }
  ]
};

export default async function StaffProfilePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('staffProfile');

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
              {MOCK_STAFF.name.split(' ').map(p => p[0]).slice(-2).join('')}
            </div>
            <h2 className="font-serif text-xl text-brand-textmain">{MOCK_STAFF.name}</h2>
            {MOCK_STAFF.nickname && (
              <p className="text-xs text-brand-textmuted mt-0.5">"{MOCK_STAFF.nickname}"</p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-widest text-brand-gold">
              {t(`role.${MOCK_STAFF.role}` as 'role.senior')}
            </p>
            <p className="font-mono text-xs text-brand-textmuted mt-1">{MOCK_STAFF.code}</p>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <Row icon={Mail} value={MOCK_STAFF.email} />
            <Row icon={Phone} value={MOCK_STAFF.phone} />
            <Row icon={MapPin} value={MOCK_STAFF.address} />
            <Row icon={Briefcase} value={MOCK_STAFF.branch} />
            <Row icon={Calendar} value={t('joinedAt', { date: MOCK_STAFF.joinedAt })} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-brand-cream/60 pt-4 text-center">
            <Stat label={t('stats.rating')} value={MOCK_STAFF.rating.toFixed(2)} accent />
            <Stat label={t('stats.bookings')} value={String(MOCK_STAFF.bookings)} />
            <Stat label={t('stats.onTime')} value={`${(MOCK_STAFF.onTimePct * 100).toFixed(0)}%`} />
          </div>
        </aside>

        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-lg text-brand-textmain mb-3 border-b border-brand-cream/50 pb-3">
              {t('about')}
            </h2>
            <p className="text-sm text-brand-textmuted leading-relaxed">{MOCK_STAFF.bio}</p>
          </section>

          {/* Certifications */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-lg text-brand-textmain mb-3 flex items-center gap-2 border-b border-brand-cream/50 pb-3">
              <Award className="h-4 w-4 text-brand-gold" /> {t('certifications')}
            </h2>
            <ul className="divide-y divide-brand-cream/60">
              {MOCK_STAFF.certifications.map(c => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm text-brand-textmain">{c.name}</p>
                    <p className="text-[11px] text-brand-textmuted">{c.issuer}</p>
                  </div>
                  <span className="text-xs font-mono text-brand-textmuted">{c.year}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Recent bookings */}
          <section className="rounded-2xl border border-brand-cream bg-white p-6 shadow-soft">
            <h2 className="font-serif text-lg text-brand-textmain mb-3 border-b border-brand-cream/50 pb-3">
              {t('recentBookings')}
            </h2>
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
                {MOCK_STAFF.recentBookings.map(b => (
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
