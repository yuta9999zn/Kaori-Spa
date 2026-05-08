'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Phone, Mail, Sparkles, Loader2 } from 'lucide-react';
import { fetchCustomer, useCustomerVisits, useCustomerRegions, type CustomerLite } from '@/lib/hooks';
import { ApiError } from '@/lib/api';
import LoyaltyCard from '@/components/LoyaltyCard';

const REGION_VI: Record<string, string> = {
  face: 'Mặt', arm: 'Tay', chest: 'Ngực', belly: 'Bụng',
  back: 'Lưng', vio: 'V-I-O', leg: 'Chân',
  full_body: 'Toàn thân', beauty: 'Làm đẹp', unknown: 'Khác'
};

const STATUS_BG: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700',
  confirmed:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  done:        'bg-slate-100 text-slate-600',
  cancelled:   'bg-rose-100 text-rose-700',
  no_show:     'bg-rose-100 text-rose-700'
};

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const SEED_CUSTOMER: CustomerLite = {
  id: 'seed', code: '24D11001', fullName: 'Trần Thị Thuý Hồng', nickname: null,
  phone: '0904505288', email: null, gender: 'female', locale: 'vi',
  nationality: 'VN', segment: 'vip', points: 1240
};

export default function CustomerDetail({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomer(id)
      .then(c => { if (!cancelled) setCustomer(c); })
      .catch(e => { if (!cancelled) { setError((e as ApiError).message); setCustomer(SEED_CUSTOMER); } });
    return () => { cancelled = true; };
  }, [id]);

  const phone = customer?.phone ?? '';
  const { data: visits } = useCustomerVisits(phone);
  const { data: regions } = useCustomerRegions(phone);

  if (!customer) {
    return (
      <div className="p-12 text-center text-brand-textmuted">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          API offline — demo data.
        </div>
      )}

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold font-serif text-2xl">
            {customer.fullName.split(' ').slice(-1)[0]?.[0] ?? '?'}
          </div>
          <div>
            <h1 className="font-serif text-3xl text-brand-textmain">
              {customer.fullName}
              {customer.nickname && <span className="text-brand-textmuted text-xl"> ({customer.nickname})</span>}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-brand-textmuted">
              <span className="font-mono text-brand-gold">{customer.code}</span>
              <span>·</span>
              <SegmentBadge segment={customer.segment} />
              <span>·</span>
              <span>{customer.nationality}</span>
              <span>·</span>
              <span>{customer.points} điểm</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contact */}
      <section className="grid gap-3 md:grid-cols-3 mb-6">
        <ContactCard Icon={Phone} label="Điện thoại" value={customer.phone} />
        <ContactCard Icon={Mail}  label="Email"     value={customer.email ?? '—'} />
        <ContactCard Icon={MapPin} label="Quốc tịch" value={customer.nationality} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Visits timeline */}
        <section className="kpi-card !p-0 overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-brand-cream/60">
            <h2 className="font-serif text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-gold" /> Lịch sử booking
            </h2>
            <span className="text-xs text-brand-textmuted">{(visits ?? []).length} lượt</span>
          </header>
          {(visits ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-brand-textmuted">Chưa có booking nào</p>
          ) : (
            <ul className="divide-y divide-brand-cream/60">
              {(visits ?? []).map(v => (
                <li key={v.bookingCode} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-brand-gold">{v.bookingCode}</span>
                      <span className="text-xs text-brand-textmuted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmtDate(v.startAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_BG[v.status] ?? ''}`}>
                        {v.status}
                      </span>
                      <span className="font-medium text-brand-gold">{fmtPrice(v.total)}</span>
                    </div>
                  </div>
                  <ul className="ml-4 space-y-1">
                    {v.items.map((it, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-brand-textmain">
                          <Sparkles className="inline h-3 w-3 text-brand-gold mr-1" />
                          {it.serviceName.vi}
                          {it.staffName && <span className="text-brand-textmuted text-xs"> · @{it.staffName}</span>}
                        </span>
                        <span className="text-xs text-brand-textmuted">{fmtPrice(it.price)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Region usage */}
        <aside className="kpi-card h-fit">
          <h2 className="font-serif text-lg mb-4">Vùng đã làm</h2>
          {(regions ?? []).length === 0 ? (
            <p className="text-sm text-brand-textmuted">—</p>
          ) : (
            <ul className="space-y-2.5">
              {(regions ?? []).map(r => (
                <li key={r.region} className="flex items-center justify-between text-sm">
                  <span>{REGION_VI[r.region] ?? r.region}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-gold">{r.visits}</span>
                    <div className="h-1.5 w-12 rounded-full bg-brand-cream overflow-hidden">
                      <div
                        className="h-full bg-brand-gold"
                        style={{ width: `${Math.min(100, r.visits * 10)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Loyalty card spans full width on mobile, sticks under aside on desktop */}
        <div className="lg:col-span-2">
          <LoyaltyCard
            customerId={customer.id}
            segment={customer.segment}
            points={customer.points}
            lifetimeSpend={customer.lifetimeSpend}
          />
        </div>
      </div>
    </>
  );
}

function ContactCard({ Icon, label, value }: { Icon: typeof Phone; label: string; value: string }) {
  return (
    <article className="kpi-card flex items-center gap-3">
      <Icon className="h-5 w-5 text-brand-gold flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </article>
  );
}

function SegmentBadge({ segment }: { segment: string }) {
  const map: Record<string, string> = {
    vip: 'bg-amber-100 text-amber-800',
    regular: 'bg-emerald-100 text-emerald-700',
    new: 'bg-blue-100 text-blue-700',
    dormant: 'bg-slate-100 text-slate-500'
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${map[segment] ?? ''}`}>
      {segment}
    </span>
  );
}
