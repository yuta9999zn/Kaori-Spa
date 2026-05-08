'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { api, ctx, ApiError } from '@/lib/api';
import type { AvailabilitySlot } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Shows up under a booking form / reschedule action when the backend returns
 * BOOKING_SLOT_TAKEN or BOOKING_STAFF_BUSY. Calls /v1/availability/search to
 * surface up to 6 alternative slots the user can click to retry.
 */
export default function ConflictResolver({
  serviceCode,
  durationMin,
  fromAroundIso,
  errorCode,
  onPickAlternate
}: {
  serviceCode: string;
  durationMin: number;
  fromAroundIso: string;
  errorCode: 'BOOKING_SLOT_TAKEN' | 'BOOKING_STAFF_BUSY';
  onPickAlternate: (slot: AvailabilitySlot) => void;
}) {
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const from = new Date(fromAroundIso);
    const to = new Date(from); to.setHours(from.getHours() + 12);
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      serviceCode,
      durationMin: String(durationMin),
      from: from.toISOString(),
      to: to.toISOString(),
      slotGridMin: '30',
      limit: '6'
    });
    api<AvailabilitySlot[]>(`/v1/availability/search?${params}`)
      .then(r => { if (!cancelled) setSlots(r); })
      .catch(e => { if (!cancelled) setError((e as ApiError).message); });
    return () => { cancelled = true; };
  }, [serviceCode, durationMin, fromAroundIso]);

  const reason = errorCode === 'BOOKING_SLOT_TAKEN'
    ? 'Giường đã có khách trùng giờ'
    : 'Kỹ thuật viên đã có lịch trùng giờ';

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-medium text-amber-900">{reason}</p>
          <p className="text-xs text-amber-700">Chọn 1 trong các slot trống bên dưới hoặc đổi giờ thủ công.</p>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {slots === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      ) : slots.length === 0 ? (
        <p className="text-sm text-amber-700">Không có slot trống trong 12 giờ tới.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((s, i) => {
            const t = new Date(s.startAt);
            return (
              <li key={i}>
                <button
                  onClick={() => onPickAlternate(s)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 rounded-xl border-2 border-amber-200 bg-white p-3 text-left text-sm hover:border-amber-400 transition'
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {t.toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-brand-textmuted truncate">
                      Giường {s.bedCode}
                      {s.staffName && ` · @${s.staffName}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-brand-textmuted flex-shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
