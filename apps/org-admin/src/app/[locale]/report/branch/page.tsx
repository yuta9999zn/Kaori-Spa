import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  MapPin,
  Download,
  Calendar,
  ChevronDown,
  DollarSign,
  CalendarCheck,
  Users,
  Briefcase,
  TrendingUp,
  Star,
  Crown,
  Waves,
  Sparkles,
  Flower,
  Droplet,
  Flame
} from 'lucide-react';

type ServiceRow = {
  id: string;
  name: string;
  bookings: number;
  revenue: string;
  iconKey: 'waves' | 'sparkles' | 'flower' | 'droplet';
  tone: 'gold' | 'rose' | 'gray';
};

type StaffRow = {
  id: string;
  name: string;
  initials: string;
  services: number;
  revenue: string;
  rating: string;
  top?: boolean;
};

type SlotKey = 'morning' | 'lateMorning' | 'earlyAfternoon' | 'afternoon' | 'evening';
type TimeSlot = { key: SlotKey; range: string; intensity: 'low' | 'med' | 'high' | 'peak' };

export default async function BranchReportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('branchReport');

  // TODO(Phase B): wire to backend (booking-service + analytics-service per branch)
  const services: ServiceRow[] = [
    { id: 's-1', name: 'Massage Trị Liệu Chuyên Sâu', bookings: 18, revenue: '72.000.000 ₫', iconKey: 'waves', tone: 'gold' },
    { id: 's-2', name: 'Chăm sóc da Hydrating', bookings: 14, revenue: '42.000.000 ₫', iconKey: 'sparkles', tone: 'rose' },
    { id: 's-3', name: 'Liệu trình Aromatherapy', bookings: 9, revenue: '20.250.000 ₫', iconKey: 'flower', tone: 'gold' },
    { id: 's-4', name: 'Hot Stone Therapy', bookings: 7, revenue: '20.125.000 ₫', iconKey: 'droplet', tone: 'gray' }
  ];

  const staff: StaffRow[] = [
    { id: 'st-1', name: 'Elena Rodriguez', initials: 'ER', services: 7, revenue: '24.750.000 ₫', rating: '5.0', top: true },
    { id: 'st-2', name: 'James Davies', initials: 'JD', services: 6, revenue: '20.500.000 ₫', rating: '4.9' },
    { id: 'st-3', name: 'Mia Chang', initials: 'MC', services: 5, revenue: '15.000.000 ₫', rating: '4.8' },
    { id: 'st-4', name: 'Liam Wilson', initials: 'LW', services: 4, revenue: '14.500.000 ₫', rating: '4.9' }
  ];

  const slots: TimeSlot[] = [
    { key: 'morning', range: '09:00 - 11:00', intensity: 'low' },
    { key: 'lateMorning', range: '11:00 - 13:00', intensity: 'high' },
    { key: 'earlyAfternoon', range: '13:00 - 15:00', intensity: 'med' },
    { key: 'afternoon', range: '15:00 - 17:00', intensity: 'med' },
    { key: 'evening', range: '17:00 - 20:00', intensity: 'peak' }
  ];

  return (
    <>
      <div className="text-xs text-brand-textmuted font-medium flex items-center space-x-2 mb-4">
        <span>{t('breadcrumb.dashboard')}</span>
        <span>/</span>
        <span>{t('breadcrumb.analytics')}</span>
        <span>/</span>
        <span className="text-brand-gold">{t('title')}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between bg-white p-8 rounded-3xl shadow-soft border border-brand-cream/60 relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-brand-gold/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative z-10 mb-6 lg:mb-0">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-[11px] uppercase tracking-widest border border-brand-gold/20 mb-4 font-medium">
            <MapPin className="w-3.5 h-3.5 mr-1.5" /> {t('branchLabel')}
          </div>
          <h1 className="font-serif text-3xl text-brand-textmain tracking-wide">{t('title')}</h1>
          <p className="text-brand-textmuted mt-2 text-sm max-w-lg">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 relative z-10">
          <button className="px-5 py-2.5 bg-brand-ivory text-brand-textmain border border-brand-cream hover:border-brand-gold hover:bg-white rounded-full text-sm font-medium transition shadow-sm flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-brand-textmuted" /> {t('range.today')}
            </span>
            <ChevronDown className="w-4 h-4 ml-3 text-brand-textmuted" />
          </button>
          <button className="px-6 py-2.5 bg-brand-gold text-white rounded-full hover:bg-brand-goldhover transition shadow-premium text-sm font-medium flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" /> {t('export')}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label={t('kpi.revenue')}
          value="42.500.000 ₫"
          delta={t('kpi.delta', { value: '5.2' })}
          deltaTone="up"
        />
        <KpiCard
          icon={<CalendarCheck className="w-5 h-5" />}
          label={t('kpi.bookings')}
          value="48"
          hint={t('kpi.slotsRemaining', { count: 12 })}
          delta={t('kpi.delta', { value: '2.1' })}
          deltaTone="up"
        />
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label={t('kpi.customers')}
          value="45"
          hint={t('kpi.newReturning', { newCount: 12, returningCount: 33 })}
          delta={t('kpi.stable')}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Briefcase className="w-5 h-5" />}
          label={t('kpi.staff')}
          value="12"
          hint={t('kpi.staffSplit', { therapists: 10, reception: 2 })}
          delta={t('kpi.utilization', { value: 90 })}
          deltaTone="neutral"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('charts.revenueTitle')}</h2>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('charts.revenueSubtitle')}</p>
            </div>
          </div>
          <ChartPlaceholder label={t('charts.placeholder')} />
        </div>
        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('charts.roomTitle')}</h2>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('charts.roomSubtitle')}</p>
            </div>
          </div>
          <ChartPlaceholder label={t('charts.placeholder')} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('charts.hourlyTitle')}</h2>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('charts.hourlySubtitle')}</p>
            </div>
          </div>
          <ChartPlaceholder label={t('charts.placeholder')} />
        </div>

        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('slots.title')}</h2>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('slots.subtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6 text-center text-sm">
            {slots.map(s => (
              <div
                key={s.key}
                className={`rounded-xl py-3 flex flex-col items-center justify-center ${slotClasses(s.intensity)} ${
                  s.intensity === 'peak' ? 'col-span-2' : ''
                }`}
              >
                <span className="font-medium">{s.range}</span>
                <span className="text-[10px] uppercase mt-1 inline-flex items-center gap-1">
                  {s.intensity === 'peak' && <Flame className="w-3 h-3" />}
                  {t(`slots.${s.intensity}`)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-cream pt-4 flex justify-between items-center text-sm">
            <div className="flex items-center text-brand-textmain font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-gold mr-2" /> {t('mix.massage', { percent: 60 })}
            </div>
            <div className="flex items-center text-brand-textmain font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-rose mr-2" /> {t('mix.facial', { percent: 40 })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-brand-cream/50 flex justify-between items-center bg-brand-ivory/30">
            <div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('servicePerf.title')}</h2>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('servicePerf.subtitle')}</p>
            </div>
            <button className="text-xs font-medium text-brand-gold hover:text-brand-goldhover">{t('viewAll')}</button>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream/50">
                  <th className="py-3 px-4 font-semibold">{t('servicePerf.cols.service')}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t('servicePerf.cols.bookings')}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t('servicePerf.cols.revenue')}</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-brand-cream/30">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-brand-ivory/50 transition">
                    <td className="py-3 px-4 font-medium text-brand-textmain flex items-center">
                      <ServiceIcon iconKey={s.iconKey} tone={s.tone} />
                      <span className="ml-3">{s.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-brand-textmuted">{s.bookings}</td>
                    <td className="py-3 px-4 text-right font-medium text-brand-textmain">{s.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft border border-brand-cream/60 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-brand-cream/50 flex justify-between items-center bg-brand-ivory/30">
            <div>
              <h2 className="font-serif text-xl text-brand-textmain">{t('staffPerf.title')}</h2>
              <p className="text-xs text-brand-textmuted mt-0.5">{t('staffPerf.subtitle')}</p>
            </div>
            <button className="text-xs font-medium text-brand-gold hover:text-brand-goldhover">{t('viewAll')}</button>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream/50">
                  <th className="py-3 px-4 font-semibold">{t('staffPerf.cols.name')}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t('staffPerf.cols.services')}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t('staffPerf.cols.revenue')}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t('staffPerf.cols.rating')}</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-brand-cream/30">
                {staff.map(s => (
                  <tr key={s.id} className={`hover:bg-brand-ivory/50 transition ${s.top ? 'bg-brand-gold/5' : ''}`}>
                    <td className="py-3 px-4 flex items-center">
                      <div className="relative">
                        {s.top && (
                          <div className="absolute -top-2 -right-2 text-brand-gold drop-shadow-sm">
                            <Crown className="w-4 h-4 fill-current" />
                          </div>
                        )}
                        <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-textmain font-serif text-xs mr-3 border border-white">
                          {s.initials}
                        </div>
                      </div>
                      <span className="font-medium text-brand-textmain">{s.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-brand-textmuted">{s.services}</td>
                    <td className="py-3 px-4 text-right font-medium text-brand-textmain">{s.revenue}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center text-brand-gold font-medium">
                        <Star className="w-3 h-3 mr-1 fill-current" /> {s.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  delta,
  deltaTone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  deltaTone?: 'up' | 'neutral';
}) {
  const deltaCls =
    deltaTone === 'up'
      ? 'text-green-700 bg-green-50 border-green-200'
      : 'text-brand-textmuted bg-brand-ivory border-brand-cream';
  return (
    <div className="bg-white p-6 rounded-3xl shadow-soft border border-brand-cream/60 flex flex-col relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-gold/5 rounded-full pointer-events-none" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-brand-ivory flex items-center justify-center text-brand-gold border border-brand-cream">
          {icon}
        </div>
        {delta && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${deltaCls}`}>
            {deltaTone === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
            {delta}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1">{label}</p>
        <h3 className="font-serif text-3xl text-brand-textmain">{value}</h3>
        {hint && <p className="text-xs text-brand-textmuted mt-1 font-medium">{hint}</p>}
      </div>
    </div>
  );
}

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex-1 w-full min-h-[260px] rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/50 flex items-center justify-center">
      <p className="text-xs text-brand-textmuted italic">{label}</p>
    </div>
  );
}

function ServiceIcon({ iconKey, tone }: { iconKey: 'waves' | 'sparkles' | 'flower' | 'droplet'; tone: 'gold' | 'rose' | 'gray' }) {
  const cls =
    tone === 'gold'
      ? 'bg-brand-gold/10 text-brand-gold'
      : tone === 'rose'
      ? 'bg-brand-rose/20 text-brand-rose'
      : 'bg-gray-100 text-gray-500';
  const Icon = iconKey === 'waves' ? Waves : iconKey === 'sparkles' ? Sparkles : iconKey === 'flower' ? Flower : Droplet;
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function slotClasses(intensity: 'low' | 'med' | 'high' | 'peak') {
  if (intensity === 'low') return 'bg-brand-cream/50 border border-brand-cream text-brand-textmuted';
  if (intensity === 'med') return 'bg-brand-gold/30 border border-brand-gold/40 text-brand-textmain';
  if (intensity === 'high') return 'bg-brand-gold/70 border border-brand-gold text-white';
  return 'bg-brand-gold border border-brand-goldhover text-white font-medium';
}
