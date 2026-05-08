'use client';

import { useEffect, useState } from 'react';
import { Award, ArrowDown, ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { fetchLoyaltyLedger, type LoyaltyLedgerRow } from '@/lib/hooks';
import { cn } from '@/lib/cn';

const TIER_INFO: Record<string, { label: string; color: string; nextThreshold?: number }> = {
  new:     { label: 'Khách mới',      color: 'bg-blue-100 text-blue-700 border-blue-200',     nextThreshold: 3_000_000 },
  regular: { label: 'Thường xuyên',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200', nextThreshold: 20_000_000 },
  vip:     { label: 'VIP',            color: 'bg-amber-100 text-amber-800 border-amber-200' },
  dormant: { label: 'Lâu chưa quay lại', color: 'bg-slate-100 text-slate-600 border-slate-200', nextThreshold: 3_000_000 }
};

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

export default function LoyaltyCard({
  customerId, segment, points, lifetimeSpend
}: {
  customerId: string;
  segment: 'new' | 'regular' | 'vip' | 'dormant';
  points: number;
  lifetimeSpend?: number;
}) {
  const [ledger, setLedger] = useState<LoyaltyLedgerRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLoyaltyLedger(customerId)
      .then(r => { if (!cancelled) setLedger(r); })
      .catch(() => { if (!cancelled) setLedger([]); });
    return () => { cancelled = true; };
  }, [customerId]);

  const tier = TIER_INFO[segment];
  const spend = lifetimeSpend ?? 0;
  const pct = tier.nextThreshold ? Math.min(100, Math.round((spend / tier.nextThreshold) * 100)) : 100;

  return (
    <article className="kpi-card !p-0 overflow-hidden">
      <header className="px-4 sm:px-5 py-3 border-b border-brand-cream/60 bg-gradient-to-br from-brand-gold/10 to-transparent flex items-center justify-between">
        <h3 className="font-serif text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-brand-gold" /> Loyalty
        </h3>
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest', tier.color)}>
          {tier.label}
        </span>
      </header>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Điểm</p>
            <p className="font-serif text-2xl text-brand-gold">{points.toLocaleString('vi-VN')}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Tổng chi tiêu</p>
            <p className="font-serif text-base">{fmt(spend)}</p>
          </div>
        </div>

        {tier.nextThreshold && (
          <div>
            <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest text-brand-textmuted mb-1.5">
              <span>Đến tier kế</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-brand-cream overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-gold to-brand-rose transition-all"
                style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-brand-textmuted mt-1.5">
              Cần thêm {fmt(Math.max(0, tier.nextThreshold - spend))}
            </p>
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="px-4 sm:px-5 pb-4">
        <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">Lịch sử điểm</p>
        {ledger === null ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-brand-textmuted" />
        ) : ledger.length === 0 ? (
          <p className="text-xs text-brand-textmuted text-center py-2">—</p>
        ) : (
          <ul className="divide-y divide-brand-cream/60 text-sm">
            {ledger.slice(0, 8).map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0 flex items-center gap-2">
                  {r.delta > 0
                    ? <ArrowUp className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    : <ArrowDown className="h-3 w-3 text-rose-600 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs truncate">{r.reason}</p>
                    <p className="text-[10px] text-brand-textmuted">{new Date(r.ts).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <span className={cn('font-medium font-mono text-xs whitespace-nowrap', r.delta > 0 ? 'text-emerald-700' : 'text-rose-700')}>
                  {r.delta > 0 ? '+' : ''}{r.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
