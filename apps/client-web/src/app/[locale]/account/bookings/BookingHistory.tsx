'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Sparkles, ArrowLeft, X, RotateCw, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api, ApiError } from '@/lib/api';
import { useCustomerAuth, customerAuthHeaders } from '@/lib/auth';

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? '00000000-0000-0000-0000-000000000000';

interface VisitItem {
  serviceCode: string;
  serviceName: Record<string, string>;
  region: string;
  price: number;
  staffName: string | null;
}
interface Visit {
  bookingCode: string;
  startAt: string;
  status: string;
  items: VisitItem[];
  total: number;
}

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', in_progress: 'Đang phục vụ',
  done: 'Hoàn tất', cancelled: 'Đã huỷ', no_show: 'Không đến'
};
const STATUS_BG: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-emerald-100 text-emerald-700', done: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-rose-100 text-rose-700', no_show: 'bg-rose-100 text-rose-700'
};

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

export default function BookingHistory({ locale }: { locale: string }) {
  const { profile, isAuthed } = useCustomerAuth();
  const [data, setData] = useState<Visit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.phone) return;
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080'}/v1/customers/${encodeURIComponent(profile.phone)}/visits?branchId=${BRANCH_ID}`, {
      headers: customerAuthHeaders()
    })
      .then(r => r.json())
      .then(body => {
        if (cancelled) return;
        if (body.success) setData(body.data);
        else setError(body.error?.message ?? 'API error');
      })
      .catch(e => !cancelled && setError(String(e)));
    return () => { cancelled = true; };
  }, [profile?.phone]);

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="mb-4 text-brand-textmuted">Vui lòng đăng nhập để xem lịch sử</p>
        <Link href="/account" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/account" className="inline-flex items-center gap-1 text-xs text-brand-textmuted hover:text-brand-gold mb-3">
        <ArrowLeft className="h-3 w-3" /> Tài khoản
      </Link>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain mb-2">Lịch sử đặt lịch</h1>
        <p className="text-sm text-brand-textmuted">{profile?.phone}</p>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {error}
        </div>
      )}

      {data === null ? (
        <div className="text-center py-12 text-brand-textmuted">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="card-soft text-center py-12">
          <Calendar className="mx-auto h-8 w-8 text-brand-textmuted/40 mb-3" />
          <p className="text-brand-textmuted mb-4">Chưa có booking nào</p>
          <Link href="/booking" className="btn-primary">Đặt lịch ngay</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map(v => (
            <li key={v.bookingCode} className="card-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="font-mono text-sm text-brand-gold">{v.bookingCode}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_BG[v.status]}`}>
                  {STATUS_VI[v.status] ?? v.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-brand-textmuted mb-3">
                <Clock className="h-3 w-3" />
                {new Date(v.startAt).toLocaleString(locale === 'vi' ? 'vi-VN' : locale, {
                  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <ul className="space-y-1.5 mb-3">
                {v.items.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-brand-textmain truncate flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-brand-gold flex-shrink-0" />
                      {it.serviceName[locale] ?? it.serviceName.vi}
                    </span>
                    <span className="text-brand-textmuted text-xs whitespace-nowrap">{fmtPrice(it.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between border-t border-brand-cream/60 pt-2">
                <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng</span>
                <span className="font-medium text-brand-gold">{fmtPrice(v.total)}</span>
              </div>
              {/* Self-service actions — only for upcoming, non-cancelled */}
              {['pending', 'confirmed'].includes(v.status) && profile?.phone && (
                <SelfServiceActions
                  bookingCode={v.bookingCode}
                  phone={profile.phone}
                  onChanged={() => window.location.reload()}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelfServiceActions({ bookingCode, phone, onChanged }: {
  bookingCode: string; phone: string; onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDateTime, setNewDateTime] = useState('');

  const cancel = async () => {
    if (!confirm('Bạn có chắc muốn huỷ lịch này?')) return;
    setBusy(true); setErr(null);
    try {
      await api('/v1/public/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify({ code: bookingCode, phone, reason: 'customer-self' })
      });
      onChanged();
    } catch (e) { setErr((e as ApiError).message); }
    finally { setBusy(false); }
  };

  const reschedule = async () => {
    if (!newDateTime) return;
    setBusy(true); setErr(null);
    try {
      await api('/v1/public/bookings/reschedule', {
        method: 'POST',
        body: JSON.stringify({
          code: bookingCode, phone,
          newStart: new Date(newDateTime).toISOString()
        })
      });
      onChanged();
    } catch (e) { setErr((e as ApiError).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-3 pt-3 border-t border-brand-cream/60">
      {!showReschedule ? (
        <div className="flex gap-2">
          <button onClick={() => setShowReschedule(true)} disabled={busy} className="btn-ghost !py-1.5 !px-3 !text-xs flex-1 justify-center">
            <RotateCw className="h-3 w-3" /> Đổi giờ
          </button>
          <button onClick={cancel} disabled={busy} className="btn-ghost !py-1.5 !px-3 !text-xs !border-rose-200 hover:!text-rose-600 flex-1 justify-center">
            <X className="h-3 w-3" /> Huỷ lịch
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="datetime-local"
            value={newDateTime}
            onChange={e => setNewDateTime(e.target.value)}
            className="w-full rounded-xl border border-brand-cream bg-brand-ivory px-3 py-2 text-sm outline-none focus:border-brand-gold"
          />
          <div className="flex gap-2">
            <button onClick={reschedule} disabled={busy || !newDateTime} className="btn-primary !py-1.5 !px-3 !text-xs flex-1 justify-center">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Xác nhận'}
            </button>
            <button onClick={() => { setShowReschedule(false); setNewDateTime(''); }} className="btn-ghost !py-1.5 !px-3 !text-xs">
              Huỷ
            </button>
          </div>
        </div>
      )}
      {err && (
        <p className="mt-2 flex items-center gap-1 text-xs text-rose-600">
          <AlertCircle className="h-3 w-3" /> {err}
        </p>
      )}
    </div>
  );
}
