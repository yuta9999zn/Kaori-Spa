'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';

interface Summary { total: number; avgRating: number; positive: number; negative: number; }

const SEED_BY_BRANCH: Record<string, Summary> = {
  'nb-kim-ma-575': { total: 142, avgRating: 4.7, positive: 128, negative: 5 },
  'nb-kim-ma-625': { total: 98,  avgRating: 4.8, positive: 91,  negative: 2 }
};

export default function BranchRating({ branchCode, branchUuid }: { branchCode: string; branchUuid?: string }) {
  const [s, setS] = useState<Summary | null>(SEED_BY_BRANCH[branchCode] ?? null);

  useEffect(() => {
    if (!branchUuid) return;
    let cancelled = false;
    api<Summary>(`/v1/branches/${branchUuid}/rating-summary`)
      .then(r => { if (!cancelled && r.total > 0) setS(r); })
      .catch(() => { /* keep seed */ });
    return () => { cancelled = true; };
  }, [branchUuid]);

  if (!s || s.total === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
      <span className="font-medium text-brand-textmain">{Number(s.avgRating).toFixed(1)}</span>
      <span className="text-brand-textmuted">({s.total} đánh giá)</span>
    </div>
  );
}
