'use client';

import { useEffect, useState } from 'react';
import { Calendar, Check, Clock, Download, Loader2, MapPin, Phone, RotateCw, Sparkles, X } from 'lucide-react';
import { api, ApiError, API_BASE } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/cn';

interface ItemDetail {
  id: string;
  serviceCode: string;
  serviceName: Record<string, string>;
  bedId: string;
  roomId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
  durationMin: number;
  price: number;
  status: string;
}

interface DetailDto {
  id: string;
  code: string;
  status: string;
  source: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  startAt: string;
  endAt: string;
  totalAmount: number;
  note: string | null;
  items: ItemDetail[];
}

const STATUS_BG: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-800',
  confirmed:   'bg-blue-100 text-blue-800',
  in_progress: 'bg-emerald-100 text-emerald-800',
  done:        'bg-slate-100 text-slate-700',
  cancelled:   'bg-rose-100 text-rose-700',
  no_show:     'bg-rose-100 text-rose-700'
};

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingDetail({ id }: { id: string }) {
  const [data, setData] = useState<DetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const d = await api<DetailDto>(`/v1/bookings/${id}`);
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as ApiError).message);
    }
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, [id]);

  const reschedule = async (item: ItemDetail, startLocal: string, endLocal: string) => {
    setBusy(true);
    try {
      await api(`/v1/bookings/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          itemId: item.id,
          startAt: new Date(startLocal).toISOString(),
          endAt: new Date(endLocal).toISOString(),
          bedId: item.bedId,
          roomId: item.roomId,
          staffId: item.staffId
        })
      });
      setEditing(null);
      await refresh();
    } catch (e) {
      alert((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async () => {
    if (!confirm('Huỷ booking này?')) return;
    setBusy(true);
    try {
      await api(`/v1/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'manager-cancel' })
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const markDone = async () => {
    setBusy(true);
    try {
      await api(`/v1/bookings/${id}/done`, { method: 'POST' });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="p-12 text-center text-brand-textmuted">
        {error ? <p className="text-rose-600">{error}</p> : <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
      </div>
    );
  }

  const canEdit = !['done', 'cancelled', 'no_show'].includes(data.status);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <Link href="/booking" className="text-xs text-brand-textmuted hover:text-brand-gold">← Danh sách</Link>
          <h1 className="font-serif text-3xl text-brand-textmain mt-1">
            <span className="font-mono text-brand-gold">{data.code}</span>
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest', STATUS_BG[data.status])}>
              {data.status}
            </span>
            <span className="text-xs text-brand-textmuted">qua {data.source}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`${API_BASE}/v1/bookings/${data.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          {canEdit && (
            <button onClick={markDone} disabled={busy} className="btn-primary disabled:opacity-50">
              <Check className="h-4 w-4" /> Hoàn tất
            </button>
          )}
          {canEdit && (
            <button onClick={cancelBooking} disabled={busy} className="btn-ghost disabled:opacity-50 !border-rose-200 hover:!text-rose-600">
              <X className="h-4 w-4" /> Huỷ
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <section className="kpi-card !p-0 overflow-hidden">
          <header className="px-5 py-3 border-b border-brand-cream/60 bg-brand-cream/20">
            <h2 className="font-serif text-base">Dịch vụ ({data.items.length})</h2>
          </header>
          <ul className="divide-y divide-brand-cream/60">
            {data.items.map(it => (
              <li key={it.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-brand-textmain flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-gold" />
                    {it.serviceName.vi}
                  </h3>
                  <span className="font-medium text-brand-gold">{fmt(it.price)}</span>
                </div>
                <div className="grid gap-2 text-xs text-brand-textmuted sm:grid-cols-3 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {fmtDateTime(it.startAt)}
                  </span>
                  <span>{it.durationMin} phút</span>
                  <span>Bed {it.bedId.slice(0, 6)} · KTV {it.staffId?.slice(0, 6) ?? '—'}</span>
                </div>

                {editing === it.id ? (
                  <RescheduleForm
                    item={it}
                    onCancel={() => setEditing(null)}
                    onSubmit={reschedule}
                    busy={busy}
                  />
                ) : canEdit ? (
                  <button
                    onClick={() => setEditing(it.id)}
                    className="text-xs text-brand-gold hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Đổi lịch
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {/* Customer */}
        <aside className="kpi-card h-fit space-y-4">
          <h2 className="font-serif text-base mb-2">Khách hàng</h2>
          <Row label="Tên" value={data.customerName} />
          <Row label={<Phone className="h-3 w-3" />} value={data.customerPhone} />
          {data.customerEmail && <Row label="Email" value={data.customerEmail} />}
          <hr className="border-brand-cream" />
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng</span>
            <span className="font-serif text-2xl text-brand-gold">{fmt(data.totalAmount)}</span>
          </div>
          {data.note && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Ghi chú</p>
              <p className="text-sm">{data.note}</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-[10px] uppercase tracking-widest text-brand-textmuted flex items-center gap-1">{label}</span>
      <span className="text-brand-textmain text-right truncate">{value}</span>
    </div>
  );
}

function RescheduleForm({
  item, onCancel, onSubmit, busy
}: {
  item: ItemDetail;
  onCancel: () => void;
  onSubmit: (item: ItemDetail, start: string, end: string) => Promise<void>;
  busy: boolean;
}) {
  const [start, setStart] = useState(toLocalInputValue(item.startAt));
  const [end, setEnd] = useState(toLocalInputValue(item.endAt));

  return (
    <div className="rounded-xl border border-brand-cream bg-brand-cream/20 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Bắt đầu</span>
          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="fi" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">Kết thúc</span>
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="fi" />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSubmit(item, start, end)}
          disabled={busy}
          className="btn-primary !py-1.5 !px-3 !text-xs disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
          Lưu
        </button>
        <button onClick={onCancel} className="btn-ghost !py-1.5 !px-3 !text-xs">Huỷ</button>
      </div>
      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 8px; padding: 6px 10px; font-size: 12px; background: white; outline: none; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1); }
      `}</style>
    </div>
  );
}
