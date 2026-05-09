import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import { Edit2, Star, Calendar, Clock, MapPin, Users, TrendingUp, ChevronLeft } from 'lucide-react';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  const t = await getTranslations('serviceDetail');

  // TODO(Phase B): wire to backend when endpoint ships
  const service = {
    id,
    code: 'SRV-001',
    name: 'Triệt lông toàn thân nữ',
    category: 'hair_removal' as const,
    duration: 90,
    price: 4500000,
    rating: 4.9,
    reviewCount: 128,
    description: 'Liệu trình triệt lông công nghệ Diode Laser Soprano Ice cho toàn thân nữ. An toàn cho mọi loại da, không đau, không kích ứng. Bao gồm vùng mặt, nách, tay, chân, bikini và lưng.',
    bookings: 1452,
    revenue: 232320000,
    completionRate: 96,
    branches: [
      { id: 'b1', name: 'Kaori Q1 (HCM)', staffCount: 4, available: true },
      { id: 'b2', name: 'Kaori Đống Đa (HN)', staffCount: 3, available: true },
      { id: 'b3', name: 'Kaori Hải Châu (ĐN)', staffCount: 2, available: false }
    ],
    staff: [
      { id: 's1', initials: 'AN', name: 'Anna Nguyen', role: 'Senior Therapist', rating: 4.9 },
      { id: 's2', initials: 'ER', name: 'Elena Rossi', role: 'Specialist', rating: 4.8 },
      { id: 's3', initials: 'MC', name: 'Mai Chi', role: 'Therapist', rating: 4.7 }
    ],
    feedback: [
      { id: 'f1', author: 'Nguyễn Lan Anh', rating: 5, at: '2026-05-06', text: 'Dịch vụ chuyên nghiệp, KTV nhẹ tay, kết quả rõ rệt sau 3 buổi.' },
      { id: 'f2', author: 'Trần Thu Hà', rating: 5, at: '2026-05-04', text: 'Phòng sạch sẽ, nhân viên tư vấn kỹ. Sẽ quay lại.' },
      { id: 'f3', author: 'Phạm Mai Linh', rating: 4, at: '2026-05-02', text: 'Kết quả tốt, mong có thêm slot cuối tuần.' }
    ],
    related: [
      { id: 'r1', name: 'Massage trị liệu', price: 850000 },
      { id: 'r2', name: 'Liệu trình đá nóng', price: 1050000 },
      { id: 'r3', name: 'Chăm sóc da Hydrating', price: 650000 }
    ]
  };

  return (
    <>
      <SubNav items={subNavItems} />
      <div className="text-xs text-brand-textmuted mb-3 inline-flex items-center gap-2">
        <ChevronLeft className="h-3 w-3" />
        <a className="hover:text-brand-gold cursor-pointer">{t('breadcrumb.services')}</a>
        <span>/</span>
        <span className="text-brand-gold">{service.name}</span>
      </div>

      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{service.code} · {t(`cat.${service.category}` as 'cat.hair_removal')}</p>
          <h1 className="font-serif text-3xl text-brand-textmain mt-1">{service.name}</h1>
          <div className="flex items-center gap-4 text-sm text-brand-textmuted mt-2">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.duration} {t('min')}</span>
            <span className="font-serif text-xl text-brand-textmain">{VND(service.price)}</span>
            <span className="inline-flex items-center gap-1 text-brand-gold"><Star className="h-3.5 w-3.5 fill-current" /> {service.rating} <span className="text-brand-textmuted">({service.reviewCount})</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Calendar className="h-4 w-4" /> {t('viewBookings')}</button>
          <button className="btn-primary"><Edit2 className="h-4 w-4" /> {t('edit')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label={t('kpi.bookings')} value={service.bookings.toLocaleString('vi-VN')} />
        <Kpi label={t('kpi.revenue')} value={VND(service.revenue)} />
        <Kpi label={t('kpi.completion')} value={`${service.completionRate}%`} tone="green" />
        <Kpi label={t('kpi.rating')} value={`${service.rating} / 5`} tone="gold" />
      </section>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-2">{t('description')}</h2>
            <p className="text-sm text-brand-textmuted leading-relaxed">{service.description}</p>
          </Card>

          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-3 inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {t('branchAvailability')}</h2>
            <ul className="divide-y divide-brand-cream/60">
              {service.branches.map(b => (
                <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-brand-textmain">{b.name}</p>
                    <p className="text-xs text-brand-textmuted">{t('staffCount', { count: b.staffCount })}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${b.available ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {b.available ? t('available') : t('unavailable')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-3 inline-flex items-center gap-2"><Users className="h-4 w-4" /> {t('assignedStaff')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {service.staff.map(s => (
                <div key={s.id} className="rounded-xl border border-brand-cream p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-cream flex items-center justify-center font-serif text-sm">{s.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-textmain truncate">{s.name}</p>
                    <p className="text-[10px] text-brand-textmuted">{s.role}</p>
                  </div>
                  <span className="text-xs text-brand-gold inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-current" /> {s.rating}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-3">{t('customerFeedback')}</h2>
            <ul className="space-y-3">
              {service.feedback.map(f => (
                <li key={f.id} className="border-b border-brand-cream/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-brand-textmain">{f.author}</p>
                    <span className="text-xs text-brand-textmuted">{f.at}</span>
                  </div>
                  <div className="flex text-brand-gold mb-1">{Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
                  <p className="text-sm text-brand-textmuted">{f.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg text-brand-textmain mb-3 inline-flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {t('analytics')}</h2>
            <ul className="text-sm space-y-2">
              <li className="flex items-center justify-between"><span className="text-brand-textmuted">{t('analyticsRow.thisMonth')}</span><span className="font-serif text-brand-textmain">142</span></li>
              <li className="flex items-center justify-between"><span className="text-brand-textmuted">{t('analyticsRow.repeatRate')}</span><span className="font-serif text-brand-textmain">68%</span></li>
              <li className="flex items-center justify-between"><span className="text-brand-textmuted">{t('analyticsRow.cancelRate')}</span><span className="font-serif text-brand-textmain">4.2%</span></li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('relatedServices')}</h2>
            <ul className="space-y-2">
              {service.related.map(r => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b border-brand-cream/60 last:border-0 cursor-pointer hover:text-brand-gold">
                  <span className="text-sm">{r.name}</span>
                  <span className="font-serif text-sm text-brand-textmain">{VND(r.price)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-brand-cream bg-white shadow-soft p-5">{children}</div>;
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'gold' }) {
  const labelCls = tone === 'green' ? 'text-green-600' : tone === 'gold' ? 'text-brand-gold' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}
