import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Bed as BedIcon, DoorOpen } from 'lucide-react';

export default async function RoomPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('room');

  // Mock — replace with /v1/rooms?branchId=… once wired.
  const rooms = [
    {
      id: 'r1', code: 'P1', name: 'Phòng 1', type: 'normal', floor: 1, capacity: 2,
      beds: [
        { id: 'b1', code: 'G1A', name: 'Giường 1A', bedType: 'standard', status: 'active' },
        { id: 'b2', code: 'G1B', name: 'Giường 1B', bedType: 'standard', status: 'active' }
      ]
    },
    {
      id: 'r2', code: 'P2', name: 'Phòng 2 (laser)', type: 'laser', floor: 1, capacity: 2,
      beds: [
        { id: 'b3', code: 'G2A', name: 'Giường laser 2A', bedType: 'laser', status: 'active' },
        { id: 'b4', code: 'G2B', name: 'Giường laser 2B', bedType: 'laser', status: 'maintenance' }
      ]
    },
    {
      id: 'r3', code: 'VIP1', name: 'Phòng VIP 1', type: 'vip', floor: 2, capacity: 1,
      beds: [
        { id: 'b5', code: 'GVIP', name: 'Giường VIP', bedType: 'vip', status: 'active' }
      ]
    }
  ];

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4" /> {t('addRoom')}
        </button>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map(r => (
          <article key={r.id} className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-brand-cream/60 bg-brand-cream/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-brand-textmain leading-none">{r.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mt-1">
                    {t(`type.${r.type}` as 'type.normal')} · {t('floor')} {r.floor}
                  </p>
                </div>
              </div>
              <span className="text-xs text-brand-textmuted">
                {r.beds.length}/{r.capacity} {t('beds').toLowerCase()}
              </span>
            </header>

            <ul className="divide-y divide-brand-cream/60">
              {r.beds.map(b => (
                <li key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <BedIcon className="h-4 w-4 text-brand-textmuted" />
                    <div>
                      <p className="text-sm font-medium text-brand-textmain">{b.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                        {t(`bedType.${b.bedType}` as 'bedType.standard')}
                      </p>
                    </div>
                  </div>
                  <BedStatus status={b.status} label={t(`status.${b.status}` as 'status.active')} />
                </li>
              ))}
              {r.beds.length === 0 && (
                <li className="px-5 py-4 text-xs text-brand-textmuted text-center">{t('noBeds')}</li>
              )}
            </ul>

            <footer className="px-5 py-3 border-t border-brand-cream/60 bg-brand-cream/10">
              <button className="btn-ghost !py-1.5 !px-3 !text-xs">
                <Plus className="h-3 w-3" /> {t('addBed')}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

function BedStatus({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    active:      'bg-emerald-100 text-emerald-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired:     'bg-slate-100 text-slate-500'
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${map[status] ?? ''}`}>{label}</span>;
}
