import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Store,
  MapPin,
  Phone,
  User,
  Edit3,
  Clock,
  DoorOpen,
  Users,
  Sparkles,
  CalendarCog,
  BarChart2,
  DollarSign,
  Calendar,
  Plus,
  Crown,
  Waves
} from 'lucide-react';

// TODO(Phase B): wire to backend — replace mock data with branch detail fetch
// from branch-service + staff/service/room aggregation endpoints.
const MOCK_BRANCH = {
  id: 'nb-kim-ma-575',
  name: 'Natural Beauty 575 Kim Mã',
  status: 'active' as const,
  address: '575 Kim Mã, Ba Đình, Hà Nội',
  phone: '+84 24 3823 1234',
  manager: 'Nguyễn Khánh Linh',
  email: 'kim-ma-575@naturalbeauty.vn',
  city: 'Hà Nội',
  district: 'Ba Đình',
  country: 'Việt Nam',
  postalCode: '100000'
};

const MOCK_HOURS = [
  { day: 'monday',    open: '09:00', close: '21:00', enabled: true  },
  { day: 'tuesday',   open: '09:00', close: '21:00', enabled: true  },
  { day: 'wednesday', open: '09:00', close: '21:00', enabled: true  },
  { day: 'thursday',  open: '09:00', close: '21:00', enabled: true  },
  { day: 'friday',    open: '09:00', close: '22:00', enabled: true  },
  { day: 'saturday',  open: '09:00', close: '22:00', enabled: true  },
  { day: 'sunday',    open: '10:00', close: '20:00', enabled: false }
] as const;

const MOCK_ROOMS = [
  { id: 'r1', name: 'Phòng 1 — Sen', type: 'facial',  capacity: 1, vip: false },
  { id: 'r2', name: 'Phòng 2 — Tre', type: 'massage', capacity: 2, vip: false },
  { id: 'r3', name: 'Phòng 3 — Lan', type: 'vip',     capacity: 2, vip: true  }
] as const;

const MOCK_STAFF = [
  { id: 's1', initials: 'NL', name: 'Nguyễn Khánh Linh', role: 'manager',   specialty: 'Quản lý',         schedule: 'T2, T3, T5, T6' },
  { id: 's2', initials: 'TM', name: 'Trần Thị Mai',      role: 'therapist', specialty: 'Triệt lông',      schedule: 'T2, T4, T6, CN'  },
  { id: 's3', initials: 'PH', name: 'Phạm Thu Hà',       role: 'therapist', specialty: 'Chăm sóc da mặt', schedule: 'T3, T5, T7'      }
] as const;

const MOCK_SERVICES = [
  { id: 'sv1', name: 'Triệt lông toàn thân nữ',   category: 'Triệt lông',  duration: '90 phút', price: '12.000.000 ₫', status: 'enabled' as const  },
  { id: 'sv2', name: 'Massage thư giãn 90 phút',  category: 'Massage',     duration: '90 phút', price: '850.000 ₫',    status: 'enabled' as const  },
  { id: 'sv3', name: 'Liệu trình giảm béo',       category: 'Liệu trình',  duration: '120 phút',price: '3.500.000 ₫',  status: 'disabled' as const }
] as const;

export default async function BranchDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('branchDetail');

  const dayKey = (d: string) =>
    `hours.days.${d}` as 'hours.days.monday';

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumbs */}
      <nav className="text-xs text-brand-textmuted flex items-center gap-2">
        <span>{t('crumbs.dashboard')}</span>
        <span>/</span>
        <span>{t('crumbs.branches')}</span>
        <span>/</span>
        <span className="text-brand-gold">{t('crumbs.detail')}</span>
      </nav>

      {/* Header */}
      <header className="kpi-card !p-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-3xl text-brand-textmain">{MOCK_BRANCH.name}</h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {t('status.active' as 'status.active')}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6 text-sm text-brand-textmuted mt-3">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {MOCK_BRANCH.address}</span>
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {MOCK_BRANCH.phone}</span>
            <span className="inline-flex items-center gap-2"><User  className="h-4 w-4" /> {t('header.manager')}: {MOCK_BRANCH.manager}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-brand-rose border-brand-rose/30 hover:border-brand-rose">{t('actions.deactivate')}</button>
          <button className="btn-primary"><Edit3 className="h-4 w-4" /> {t('actions.edit')}</button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT: info + rooms */}
        <div className="xl:col-span-2 space-y-8">
          {/* Branch information */}
          <section className="kpi-card !p-8">
            <header className="flex items-center gap-3 mb-6">
              <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Store className="h-5 w-5" /></span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('info.title')}</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <Field label={t('info.fields.name')}     value={MOCK_BRANCH.name} />
              <Field label={t('info.fields.manager')}  value={MOCK_BRANCH.manager} />
              <Field label={t('info.fields.phone')}    value={MOCK_BRANCH.phone} />
              <Field label={t('info.fields.email')}    value={MOCK_BRANCH.email} />
              <Field label={t('info.fields.address')}  value={MOCK_BRANCH.address} />
              <Field label={t('info.fields.city')}     value={MOCK_BRANCH.city} />
              <Field label={t('info.fields.district')} value={MOCK_BRANCH.district} />
              <Field label={t('info.fields.country')}  value={MOCK_BRANCH.country} />
            </div>
          </section>

          {/* Rooms */}
          <section className="kpi-card !p-8">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><DoorOpen className="h-5 w-5" /></span>
                <h2 className="font-serif text-2xl text-brand-textmain">{t('rooms.title')}</h2>
              </div>
              <button className="btn-ghost"><Plus className="h-4 w-4" /> {t('rooms.add')}</button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {MOCK_ROOMS.map(room => (
                <article key={room.id} className={`rounded-2xl border p-4 ${room.vip ? 'border-brand-gold/40 bg-brand-gold/5' : 'border-brand-cream bg-brand-ivory'}`}>
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-cream bg-white text-brand-gold">
                    {room.vip ? <Crown className="h-4 w-4" /> : <Waves className="h-4 w-4" />}
                  </div>
                  <p className="font-medium text-brand-textmain">{room.name}</p>
                  <p className="mb-3 text-xs text-brand-textmuted">{t(`rooms.types.${room.type}` as 'rooms.types.facial')}</p>
                  <span className="inline-flex items-center gap-1 rounded-md border border-brand-cream bg-white px-2 py-1 text-[11px] font-medium text-brand-textmain">
                    <Users className="h-3 w-3 text-brand-textmuted" /> {t('rooms.capacity')}: {room.capacity}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: hours + booking setup */}
        <div className="space-y-8">
          {/* Opening hours */}
          <section className="kpi-card !p-8">
            <header className="flex items-center gap-3 mb-6">
              <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Clock className="h-5 w-5" /></span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('hours.title')}</h2>
            </header>
            <ul className="space-y-3 text-sm">
              {MOCK_HOURS.map(h => (
                <li key={h.day} className={`flex items-center justify-between border-b border-brand-cream/60 pb-3 ${!h.enabled ? 'opacity-50' : ''}`}>
                  <span className="w-24 font-medium text-brand-textmain">{t(dayKey(h.day))}</span>
                  <span className="text-brand-textmuted">
                    {h.enabled ? `${h.open} – ${h.close}` : t('hours.closed')}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${h.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                    {h.enabled ? t('hours.open') : t('hours.off')}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Booking setup */}
          <section className="kpi-card !p-8">
            <header className="flex items-center gap-3 mb-6">
              <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><CalendarCog className="h-5 w-5" /></span>
              <h2 className="font-serif text-2xl text-brand-textmain">{t('booking.title')}</h2>
            </header>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-brand-textmain">{t('booking.maxConcurrent')}</span>
                <span className="font-medium text-brand-gold">5</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-brand-textmain">{t('booking.minNotice')}</span>
                <span className="font-medium text-brand-gold">{t('booking.minNoticeValue')}</span>
              </li>
              <li className="flex items-center justify-between border-t border-brand-cream/60 pt-3">
                <span className="text-brand-textmain">{t('booking.allowOnline')}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase text-emerald-700">{t('booking.on')}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-brand-textmain">{t('booking.sameDay')}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase text-emerald-700">{t('booking.on')}</span>
              </li>
              <li className="flex items-center justify-between">
                <div>
                  <p className="text-brand-textmain">{t('booking.autoAssign')}</p>
                  <p className="text-[10px] text-brand-textmuted">{t('booking.autoAssignHint')}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase text-emerald-700">{t('booking.on')}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Staff assignment */}
      <section className="kpi-card !p-0 overflow-hidden">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-brand-cream/60 bg-brand-cream/20 p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Users className="h-5 w-5" /></span>
            <h2 className="font-serif text-2xl text-brand-textmain">{t('staff.title')}</h2>
          </div>
          <button className="btn-ghost"><Plus className="h-4 w-4" /> {t('staff.assign')}</button>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-6 py-3 font-medium">{t('staff.columns.name')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('staff.columns.role')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('staff.columns.specialty')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('staff.columns.schedule')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60 bg-white">
            {MOCK_STAFF.map(s => (
              <tr key={s.id} className="hover:bg-brand-cream/15">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-cream font-serif text-xs text-brand-textmain">
                      {s.initials}
                    </span>
                    <span className="font-medium text-brand-textmain">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-brand-textmuted">{t(`staff.roles.${s.role}` as 'staff.roles.manager')}</td>
                <td className="px-6 py-4">
                  <span className="rounded-md bg-brand-gold/10 px-2 py-1 text-[11px] font-medium text-brand-gold">{s.specialty}</span>
                </td>
                <td className="px-6 py-4 text-brand-textmuted">{s.schedule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Services available */}
      <section className="kpi-card !p-0 overflow-hidden">
        <header className="border-b border-brand-cream/60 bg-brand-cream/20 p-6 flex items-center gap-3">
          <span className="rounded-full bg-brand-gold/10 p-2 text-brand-gold"><Sparkles className="h-5 w-5" /></span>
          <h2 className="font-serif text-2xl text-brand-textmain">{t('services.title')}</h2>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-6 py-3 font-medium">{t('services.columns.name')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('services.columns.category')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('services.columns.duration')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('services.columns.price')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('services.columns.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60 bg-white">
            {MOCK_SERVICES.map(svc => (
              <tr key={svc.id} className="hover:bg-brand-cream/15">
                <td className="px-6 py-4 font-medium text-brand-textmain">{svc.name}</td>
                <td className="px-6 py-4 text-brand-textmuted">{svc.category}</td>
                <td className="px-6 py-4 text-brand-textmuted">{svc.duration}</td>
                <td className="px-6 py-4 font-medium text-brand-gold">{svc.price}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    svc.status === 'enabled'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-50 text-slate-500'
                  }`}>
                    {t(`services.status.${svc.status}` as 'services.status.enabled')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Performance snapshot */}
      <section className="rounded-3xl border border-brand-gold/20 bg-brand-gold/5 p-8">
        <header className="flex items-center gap-3 mb-6">
          <span className="rounded-full bg-white p-2 text-brand-gold shadow-sm"><BarChart2 className="h-5 w-5" /></span>
          <h2 className="font-serif text-2xl text-brand-textmain">{t('snapshot.title')}</h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SnapshotMetric Icon={Calendar}    label={t('snapshot.bookings')} value="48"   delta="+12%" />
          <SnapshotMetric Icon={DollarSign}  label={t('snapshot.revenue')}  value="42.500.000 ₫" delta="+8%" />
          <SnapshotMetric Icon={Users}       label={t('snapshot.staff')}    value="8 / 12" delta="" />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</p>
      <p className="text-brand-textmain font-medium">{value}</p>
    </div>
  );
}

function SnapshotMetric({
  Icon,
  label,
  value,
  delta
}: {
  Icon: typeof Calendar;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <article className="rounded-2xl border border-brand-gold/10 bg-white p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</p>
        <p className="font-serif text-2xl text-brand-textmain">
          {value}
          {delta ? <span className="ml-2 text-xs font-sans text-emerald-500">{delta}</span> : null}
        </p>
      </div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-ivory text-brand-gold">
        <Icon className="h-4 w-4" />
      </span>
    </article>
  );
}
