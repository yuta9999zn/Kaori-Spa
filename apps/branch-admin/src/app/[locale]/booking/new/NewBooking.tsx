'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Plus, Check, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  useCatalog,
  searchCustomers,
  createCustomer,
  createBooking,
  type CatalogService,
  type CustomerLite,
  type AvailabilitySlot
} from '@/lib/hooks';
import { cn } from '@/lib/cn';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

interface PickedSlot {
  startAt: string;
  endAt: string;
  bedId: string;
  bedCode: string;
  roomId: string;
  staffId: string | null;
  staffName: string | null;
}

export default function NewBooking() {
  // ── Step 1: customer ──────────────────────────────────────
  const [q, setQ] = useState('');
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<CustomerLite | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCust, setNewCust] = useState({
    fullName: '', nickname: '', phone: '', email: '',
    gender: 'female' as 'male' | 'female',
    nationality: 'VN' as 'VN' | 'JP' | 'KR' | 'OTHER'
  });

  useEffect(() => {
    if (q.trim().length < 2) { setCustomers([]); return; }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchCustomers(ORG_ID, q);
        setCustomers(res.items);
      } catch { setCustomers([]); } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const submitCreate = async () => {
    const c = await createCustomer(ORG_ID, newCust);
    setPicked(c);
    setShowCreate(false);
  };

  // ── Step 2: service ───────────────────────────────────────
  const { data: catalog } = useCatalog(ORG_ID);
  const [serviceCode, setServiceCode] = useState<string | null>(null);
  const service: CatalogService | undefined = useMemo(
    () => (catalog ?? []).find(s => s.code === serviceCode),
    [catalog, serviceCode]
  );

  // ── Step 3: slot ──────────────────────────────────────────
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<PickedSlot | null>(null);

  const searchSlots = async () => {
    if (!service) return;
    setLoadingSlots(true);
    setSearchErr(null);
    try {
      const from = new Date();
      from.setMinutes(0, 0, 0);
      from.setHours(from.getHours() + 1);
      const to = new Date(from); to.setDate(to.getDate() + 7);
      const params = new URLSearchParams({
        tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000',
        branchId: process.env.NEXT_PUBLIC_BRANCH_ID ?? '00000000-0000-0000-0000-000000000000',
        serviceCode: service.code,
        durationMin: String(service.durationMin),
        from: from.toISOString(),
        to: to.toISOString(),
        slotGridMin: '30',
        limit: '24'
      });
      const res = await api<AvailabilitySlot[]>(`/v1/availability/search?${params}`);
      setSlots(res);
    } catch (e) {
      setSearchErr((e as ApiError).message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ── Step 4: confirm ───────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  const confirm = async () => {
    if (!picked || !service || !pickedSlot) return;
    setSubmitting(true);
    setConfirmErr(null);
    try {
      const res = await createBooking({
        customerId: picked.id,
        customerName: picked.fullName,
        customerPhone: picked.phone,
        customerEmail: picked.email ?? undefined,
        locale: picked.locale,
        items: [{
          serviceCode: service.code,
          serviceName: service.name,
          bedId: pickedSlot.bedId,
          roomId: pickedSlot.roomId,
          staffId: pickedSlot.staffId ?? null,
          startAt: pickedSlot.startAt,
          endAt: pickedSlot.endAt,
          price: service.basePrice
        }],
        idempotencyKey: `bk-${Date.now()}-${picked.phone}`
      });
      setConfirmedCode(res.code);
    } catch (e) {
      setConfirmErr((e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedCode) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-2xl mb-2">Đặt lịch thành công</h1>
        <p className="font-mono text-brand-gold text-lg">{confirmedCode}</p>
        <button
          onClick={() => { setConfirmedCode(null); setPicked(null); setServiceCode(null); setSlots([]); setPickedSlot(null); setQ(''); }}
          className="btn-primary mt-6"
        >
          Tạo booking khác
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain">Tạo booking</h1>
        <p className="text-sm text-brand-textmuted">Chọn khách → dịch vụ → khung giờ → xác nhận</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Customer */}
          <Step n={1} title="Khách hàng" done={!!picked}>
            {picked ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{picked.fullName} {picked.nickname && <span className="text-brand-textmuted">({picked.nickname})</span>}</p>
                  <p className="text-xs text-brand-textmuted">{picked.code} · {picked.phone} · {picked.nationality}</p>
                </div>
                <button onClick={() => setPicked(null)} className="text-xs text-brand-gold">Đổi</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-brand-ivory px-4 py-2 mb-3">
                  <Search className="h-4 w-4 text-brand-textmuted" />
                  <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Tìm theo tên, SĐT, mã KH…"
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  {searching && <Loader2 className="h-4 w-4 animate-spin text-brand-textmuted" />}
                </div>
                {customers.length > 0 && (
                  <ul className="divide-y divide-brand-cream/60 rounded-xl border border-brand-cream max-h-60 overflow-y-auto">
                    {customers.map(c => (
                      <li key={c.id}>
                        <button onClick={() => setPicked(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-brand-cream/30">
                          <div className="font-medium">{c.fullName} {c.nickname && <span className="text-brand-textmuted">({c.nickname})</span>}</div>
                          <div className="text-xs text-brand-textmuted">{c.code} · {c.phone}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setShowCreate(s => !s)} className="btn-ghost mt-3 !py-2 !px-4 !text-xs">
                  <Plus className="h-3 w-3" /> Khách hàng mới
                </button>
                {showCreate && (
                  <div className="mt-4 space-y-2 rounded-xl border border-brand-cream bg-brand-cream/20 p-4">
                    <Field label="Họ tên *">
                      <input value={newCust.fullName} onChange={e => setNewCust({ ...newCust, fullName: e.target.value })} className="fi" />
                    </Field>
                    <Field label="Nickname (Aki, Nao…)">
                      <input value={newCust.nickname} onChange={e => setNewCust({ ...newCust, nickname: e.target.value })} className="fi" />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="SĐT *">
                        <input value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} className="fi" />
                      </Field>
                      <Field label="Quốc tịch">
                        <select value={newCust.nationality} onChange={e => setNewCust({ ...newCust, nationality: e.target.value as 'VN' })} className="fi">
                          <option value="VN">🇻🇳 Việt Nam</option>
                          <option value="JP">🇯🇵 Nhật</option>
                          <option value="KR">🇰🇷 Hàn</option>
                          <option value="OTHER">🌐 Khác</option>
                        </select>
                      </Field>
                    </div>
                    <button
                      onClick={submitCreate}
                      disabled={!newCust.fullName || !newCust.phone}
                      className="btn-primary !py-2 !text-xs disabled:opacity-50"
                    >
                      Lưu khách hàng
                    </button>
                  </div>
                )}
              </>
            )}
          </Step>

          {/* Service */}
          <Step n={2} title="Dịch vụ" done={!!service} disabled={!picked}>
            {!picked ? <p className="text-sm text-brand-textmuted">Chọn khách hàng trước</p> : (
              <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                {(catalog ?? []).map(s => {
                  const active = s.code === serviceCode;
                  return (
                    <button
                      key={s.code}
                      onClick={() => { setServiceCode(s.code); setSlots([]); setPickedSlot(null); }}
                      className={cn(
                        'flex items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-sm transition',
                        active ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-cream hover:border-brand-gold'
                      )}
                    >
                      <div>
                        <div className="font-medium">{s.name.vi}</div>
                        <div className="text-[11px] text-brand-textmuted">{s.durationMin} phút {s.combo && '· combo'}</div>
                      </div>
                      <span className="text-brand-gold font-medium">{fmt(s.basePrice)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          {/* Slots */}
          <Step n={3} title="Khung giờ" done={!!pickedSlot} disabled={!service}>
            {!service ? <p className="text-sm text-brand-textmuted">Chọn dịch vụ trước</p> : (
              <>
                <button onClick={searchSlots} disabled={loadingSlots} className="btn-ghost !py-2 !text-xs disabled:opacity-50">
                  {loadingSlots ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  Tìm slot trống
                </button>
                {searchErr && <p className="mt-3 text-xs text-rose-600">{searchErr}</p>}
                {slots.length > 0 && (
                  <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 max-h-80 overflow-y-auto">
                    {slots.map((s, i) => {
                      const t = new Date(s.startAt);
                      const active = pickedSlot?.startAt === s.startAt && pickedSlot?.bedId === s.bedId;
                      return (
                        <button
                          key={i}
                          onClick={() => setPickedSlot(s)}
                          className={cn(
                            'rounded-lg border-2 px-2 py-2 text-left text-xs transition',
                            active ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-cream hover:border-brand-gold'
                          )}
                        >
                          <div className="font-medium">{t.toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] text-brand-textmuted mt-1">
                            Phòng {s.roomCode} · Giường {s.bedCode}
                          </div>
                          {s.staffName && <div className="text-[10px] text-brand-gold mt-0.5">@{s.staffName}</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </Step>
        </div>

        {/* Summary */}
        <aside className="card-soft h-fit lg:sticky lg:top-24">
          <h3 className="font-serif text-lg mb-4">Tóm tắt</h3>
          <Row label="Khách hàng">{picked?.fullName ?? '—'}</Row>
          <Row label="Dịch vụ">{service?.name.vi ?? '—'}</Row>
          <Row label="Thời gian">
            {pickedSlot ? new Date(pickedSlot.startAt).toLocaleString('vi-VN') : '—'}
          </Row>
          <Row label="Phòng / Giường">
            {pickedSlot ? `${pickedSlot.roomId.slice(0, 6)}/${pickedSlot.bedCode}` : '—'}
          </Row>
          <Row label="KTV">{pickedSlot?.staffName ?? 'Tự động phân'}</Row>

          <div className="mt-5 border-t border-brand-cream pt-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng</span>
            <span className="font-serif text-2xl text-brand-gold">{service ? fmt(service.basePrice) : '—'}</span>
          </div>

          {confirmErr && <p className="mt-3 text-xs text-rose-600">{confirmErr}</p>}

          <button
            onClick={confirm}
            disabled={!picked || !service || !pickedSlot || submitting}
            className="btn-primary mt-5 w-full justify-center disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Xác nhận đặt lịch
          </button>
        </aside>
      </div>

      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 8px 12px; font-size: 13px; background: #faf9f6; outline: none; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1); }
      `}</style>
    </>
  );
}

function Step({ n, title, done, disabled, children }: { n: number; title: string; done: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn('card-soft', disabled && 'opacity-60')}>
      <div className="flex items-center gap-3 mb-4">
        <span className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium border-2',
          done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-brand-gold bg-brand-gold text-white'
        )}>
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        <h2 className="font-serif text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</span>
      <span className="text-right text-brand-textmain truncate">{children}</span>
    </div>
  );
}
