'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ctx } from '@/lib/api';

interface Cell { dow: number; hour: number; bookings: number; }

const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i); // 09:00 → 21:00

const SEED: Cell[] = (() => {
  const out: Cell[] = [];
  for (let d = 0; d < 7; d++) {
    for (const h of HOURS) {
      const peak = (h >= 17 && h <= 19) || (d === 5 || d === 6);
      out.push({ dow: d, hour: h, bookings: peak ? 5 + Math.floor(Math.random() * 8) : Math.floor(Math.random() * 4) });
    }
  }
  return out;
})();

/**
 * Day-of-week × hour-of-day heatmap. Lighter cells = quiet hours when
 * managers can run promos; darker cells = peak times.
 */
export default function AvailabilityHeatmap({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<Cell[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      tenantId: ctx.tenantId, from, to
    });
    api<Cell[]>(`/v1/reports/heatmap?${params}`)
      .then(r => { if (!cancelled) setData(r); })
      .catch(e => {
        if (!cancelled) { setError(String(e?.message ?? e)); setData(SEED); }
      });
    return () => { cancelled = true; };
  }, [from, to]);

  if (data === null) {
    return <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" /></div>;
  }

  // Build a map for O(1) lookup.
  const map = new Map<string, number>();
  let max = 0;
  for (const c of data) {
    map.set(`${c.dow}|${c.hour}`, c.bookings);
    if (c.bookings > max) max = c.bookings;
  }

  const intensity = (n: number) => {
    if (n === 0) return 0;
    return Math.min(1, n / Math.max(1, max));
  };

  return (
    <div>
      {error && (
        <p className="mb-2 text-xs text-amber-700">API offline — demo data.</p>
      )}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-10 text-right pr-2 text-brand-textmuted">Giờ</th>
              {DOW_LABELS.map((d, i) => (
                <th key={d} className={`px-2 py-1 font-medium text-center ${i === 6 ? 'text-rose-600' : 'text-brand-textmuted'}`}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(h => (
              <tr key={h}>
                <td className="text-right pr-2 text-brand-textmuted font-mono">
                  {String(h).padStart(2, '0')}h
                </td>
                {DOW_LABELS.map((_, dow) => {
                  const n = map.get(`${dow}|${h}`) ?? 0;
                  const a = intensity(n);
                  return (
                    <td
                      key={dow}
                      className="border border-white"
                      style={{
                        background: a === 0 ? '#FAF9F6' : `rgba(201, 168, 124, ${0.15 + a * 0.85})`,
                        width: 36, height: 28
                      }}
                      title={`${DOW_LABELS[dow]} ${h}h: ${n} booking`}
                    >
                      <div className="flex items-center justify-center text-[10px]"
                        style={{ color: a > 0.6 ? 'white' : '#8B837C' }}>
                        {n > 0 ? n : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-brand-textmuted">
        <span>Ít</span>
        <div className="flex">
          {[0.15, 0.4, 0.65, 0.9].map((a, i) => (
            <span key={i} className="h-3 w-6" style={{ background: `rgba(201, 168, 124, ${a})` }} />
          ))}
        </div>
        <span>Đông</span>
      </div>
    </div>
  );
}
