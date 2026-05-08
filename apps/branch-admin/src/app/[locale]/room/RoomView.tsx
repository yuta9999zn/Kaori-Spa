'use client';

import { useTranslations } from 'next-intl';
import { Plus, Bed as BedIcon, DoorOpen, Loader2 } from 'lucide-react';
import { useRooms } from '@/lib/hooks';

export default function RoomView() {
  const t = useTranslations('room');
  const { data: rooms, loading, error } = useRooms();

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

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="inline h-6 w-6 animate-spin text-brand-gold" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </div>
      )}

      {!loading && !error && (rooms ?? []).length === 0 && (
        <p className="py-12 text-center text-sm text-brand-textmuted">Chưa có dữ liệu</p>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(rooms ?? []).map(r => (
          <article key={r.id} className="rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-brand-cream/60 bg-brand-cream/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-brand-textmain leading-none">
                    {r.name?.vi ?? r.code}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mt-1">
                    {(() => {
                      try { return t(`type.${r.roomType}` as 'type.normal'); }
                      catch { return r.roomType; }
                    })()}
                    {r.floor != null && ` · ${t('floor')} ${r.floor}`}
                  </p>
                </div>
              </div>
              <span className="text-xs text-brand-textmuted">
                {r.beds.length}/{r.capacityBeds} {t('beds').toLowerCase()}
              </span>
            </header>

            <ul className="divide-y divide-brand-cream/60">
              {r.beds.map(b => (
                <li key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <BedIcon className="h-4 w-4 text-brand-textmuted" />
                    <div>
                      <p className="text-sm font-medium text-brand-textmain">{b.name?.vi ?? b.code}</p>
                      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">
                        {(() => {
                          try { return t(`bedType.${b.bedType}` as 'bedType.standard'); }
                          catch { return b.bedType; }
                        })()}
                      </p>
                    </div>
                  </div>
                  <BedStatus
                    status={b.status}
                    label={(() => {
                      try { return t(`status.${b.status}` as 'status.active'); }
                      catch { return b.status; }
                    })()}
                  />
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
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${map[status] ?? ''}`}>
      {label}
    </span>
  );
}
