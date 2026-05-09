'use client';

import { useTranslations } from 'next-intl';
import {
  Edit2, Star, Calendar, Clock, MapPin, Users, TrendingUp, ChevronLeft, Loader2
} from 'lucide-react';
import { useCatalog, type CatalogService } from '@/lib/hooks';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

function categoryOf(s: CatalogService): 'hair_removal' | 'facial' | 'massage' | 'package' {
  if (s.combo) return 'package';
  if (s.region === 'beauty' || s.region === 'face') return 'facial';
  if (['arm','chest','belly','back','vio','leg','full_body'].includes(s.region)) return 'hair_removal';
  return 'massage';
}

export default function ServiceDetailView({ id }: { id: string }) {
  const t = useTranslations('serviceDetail');
  const { data: services, loading, error } = useCatalog(ORG_ID);

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-cream bg-white p-10 text-center shadow-soft">
        <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error.message}
      </div>
    );
  }

  const service = (services ?? []).find(s => s.id === id || s.code === id);

  if (!service) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/30 p-10 text-center text-sm text-brand-textmuted">
        Không tìm thấy dịch vụ {id}
      </div>
    );
  }

  const category = categoryOf(service);
  const displayName = service.name?.vi ?? service.name?.en ?? service.code;
  const related = (services ?? [])
    .filter(s => s.id !== service.id && categoryOf(s) === category)
    .slice(0, 3);

  // TODO(Phase B): rating, review count, bookings/revenue, completion-rate, branch
  // availability, assigned staff, and customer feedback are not yet on
  // CatalogService. Use placeholders until /v1/services/:id/stats ships.
  const rating = '—';
  const reviewCount = 0;
  const bookings = '—';
  const revenue = '—';
  const completionRate = '—';

  return (
    <>
      <div className="text-xs text-brand-textmuted mb-3 inline-flex items-center gap-2">
        <ChevronLeft className="h-3 w-3" />
        <a className="hover:text-brand-gold cursor-pointer">{t('breadcrumb.services')}</a>
        <span>/</span>
        <span className="text-brand-gold">{displayName}</span>
      </div>

      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">
            {service.code} · {(() => {
              try { return t(`cat.${category}` as 'cat.hair_removal'); }
              catch { return category; }
            })()}
          </p>
          <h1 className="font-serif text-3xl text-brand-textmain mt-1">{displayName}</h1>
          <div className="flex items-center gap-4 text-sm text-brand-textmuted mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.durationMin} {t('min')}</span>
            <span className="font-serif text-xl text-brand-textmain">{VND(service.basePrice)}</span>
            <span className="inline-flex items-center gap-1 text-brand-gold"><Star className="h-3.5 w-3.5 fill-current" /> {rating} <span className="text-brand-textmuted">({reviewCount})</span></span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${service.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {service.active ? t('available') : t('unavailable')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Calendar className="h-4 w-4" /> {t('viewBookings')}</button>
          <button className="btn-primary"><Edit2 className="h-4 w-4" /> {t('edit')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label={t('kpi.bookings')} value={String(bookings)} />
        <Kpi label={t('kpi.revenue')} value={String(revenue)} />
        <Kpi label={t('kpi.completion')} value={String(completionRate)} tone="green" />
        <Kpi label={t('kpi.rating')} value={`${rating} / 5`} tone="gold" />
      </section>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-2">{t('description')}</h2>
            {/* TODO(Phase B): description is not on CatalogService — use placeholder. */}
            <p className="text-sm text-brand-textmuted leading-relaxed">
              {service.combo
                ? `Combo trọn gói gồm ${service.sessions} buổi.`
                : `Liệu trình ${displayName}, thời lượng ${service.durationMin} phút.`}
              {service.usesWax && ' Có sử dụng wax.'}
              {service.usesMachine && ' Có sử dụng máy.'}
            </p>
          </Card>

          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-3 inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {t('branchAvailability')}</h2>
            {/* TODO(Phase B): per-branch availability needs /v1/services/:id/branches */}
            <p className="text-sm text-brand-textmuted">—</p>
          </Card>

          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-3 inline-flex items-center gap-2"><Users className="h-4 w-4" /> {t('assignedStaff')}</h2>
            {/* TODO(Phase B): assigned-staff list needs /v1/services/:id/staff */}
            <p className="text-sm text-brand-textmuted">—</p>
          </Card>

          <Card>
            <h2 className="font-serif text-xl text-brand-textmain mb-3">{t('customerFeedback')}</h2>
            {/* TODO(Phase B): reviews need /v1/services/:id/feedback */}
            <p className="text-sm text-brand-textmuted">—</p>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg text-brand-textmain mb-3 inline-flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {t('analytics')}</h2>
            {/* TODO(Phase B): analytics need /v1/reports/services/:id */}
            <ul className="text-sm space-y-2">
              <li className="flex items-center justify-between"><span className="text-brand-textmuted">{t('analyticsRow.thisMonth')}</span><span className="font-serif text-brand-textmain">—</span></li>
              <li className="flex items-center justify-between"><span className="text-brand-textmuted">{t('analyticsRow.repeatRate')}</span><span className="font-serif text-brand-textmain">—</span></li>
              <li className="flex items-center justify-between"><span className="text-brand-textmuted">{t('analyticsRow.cancelRate')}</span><span className="font-serif text-brand-textmain">—</span></li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('relatedServices')}</h2>
            <ul className="space-y-2">
              {related.length === 0 && (
                <li className="text-xs text-brand-textmuted">—</li>
              )}
              {related.map(r => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b border-brand-cream/60 last:border-0 cursor-pointer hover:text-brand-gold">
                  <span className="text-sm">{r.name?.vi ?? r.name?.en ?? r.code}</span>
                  <span className="font-serif text-sm text-brand-textmain">{VND(r.basePrice)}</span>
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
