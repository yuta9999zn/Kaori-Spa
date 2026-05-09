'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Star, Gift, SlidersHorizontal, ArrowUpRight, ArrowDownLeft, Crown, Check,
  Search, Loader2, ChevronRight
} from 'lucide-react';
import {
  useCustomerSearch, fetchLoyaltyLedger,
  type CustomerLite, type LoyaltyLedgerRow
} from '@/lib/hooks';
import type { ApiError } from '@/lib/api';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

type TxKind = 'earned' | 'redeemed' | 'manual' | 'expired';

function classifyDelta(delta: number, reason: string): TxKind {
  const r = (reason || '').toLowerCase();
  if (r.includes('expire')) return 'expired';
  if (r.includes('manual') || r.includes('adjust')) return 'manual';
  return delta > 0 ? 'earned' : 'redeemed';
}

export default function CustomerLoyaltyView() {
  const t = useTranslations('customerLoyalty');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<CustomerLite | null>(null);

  const { data: searchData, loading: searchLoading } = useCustomerSearch(q, ORG_ID);
  const candidates = searchData?.items ?? [];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-ivory border-2 border-brand-cream flex items-center justify-center font-serif text-xl text-brand-textmain">
            {selected ? initialsOf(selected.fullName) : '—'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl text-brand-textmain">
                {selected?.fullName ?? 'Chọn khách hàng'}
              </h1>
              {selected?.segment === 'vip' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                  <Crown className="w-3 h-3 mr-1" /> {t('goldMember')}
                </span>
              )}
            </div>
            <p className="text-sm text-brand-textmuted mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><SlidersHorizontal className="h-4 w-4" /> {t('adjust')}</button>
          <button className="btn-primary"><Gift className="h-4 w-4" /> {t('redeem')}</button>
        </div>
      </header>

      {/* Customer picker */}
      <section className="rounded-2xl border border-brand-cream bg-white shadow-soft p-4 mb-6">
        <div className="flex items-center gap-2 rounded-full border border-brand-cream bg-brand-ivory/40 px-4 py-2 max-w-md">
          <Search className="h-4 w-4 text-brand-textmuted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên / SĐT…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        {q.trim() && (
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-brand-cream/60 rounded-xl border border-brand-cream/60">
            {searchLoading && (
              <div className="px-4 py-3 text-center text-xs text-brand-textmuted">
                <Loader2 className="inline h-3.5 w-3.5 animate-spin text-brand-gold" />
              </div>
            )}
            {!searchLoading && candidates.length === 0 && (
              <div className="px-4 py-3 text-center text-xs text-brand-textmuted">Không tìm thấy</div>
            )}
            {!searchLoading && candidates.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); }}
                className="w-full text-left px-4 py-2.5 hover:bg-brand-ivory/40 flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-brand-cream flex items-center justify-center font-serif text-xs">
                  {initialsOf(c.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-textmain truncate">{c.fullName}</p>
                  <p className="text-[10px] font-mono text-brand-textmuted">{c.phone} · {c.points} pts</p>
                </div>
                <ChevronRight className="h-4 w-4 text-brand-textmuted" />
              </button>
            ))}
          </div>
        )}
      </section>

      {!selected && (
        <div className="rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/30 p-10 text-center text-sm text-brand-textmuted">
          Chọn khách hàng để xem điểm thưởng & lịch sử tích/đổi.
        </div>
      )}

      {selected && <LoyaltyDetail customer={selected} />}
    </>
  );
}

function LoyaltyDetail({ customer }: { customer: CustomerLite }) {
  const t = useTranslations('customerLoyalty');
  const [ledger, setLedger] = useState<LoyaltyLedgerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fetchLoyaltyLedger(customer.id)
      .then(rows => { if (live) setLedger(rows); })
      .catch(e => { if (live) setError(e as ApiError); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [customer.id]);

  const rows = ledger ?? [];
  const totalEarned = rows.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0);
  const totalRedeemed = Math.abs(rows.filter(r => r.delta < 0).reduce((s, r) => s + r.delta, 0));
  // TODO(Phase B): "expiring soon" needs an expiry column on ledger rows.
  const expiringSoon = '—';

  // Build running balance going forward (oldest first), then reverse for display.
  const sorted = [...rows].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  let running = 0;
  const withBalance = sorted.map(r => { running += r.delta; return { ...r, balance: running }; });
  const display = [...withBalance].reverse();

  const rewards = [
    { name: t('rewards.discount'), sub: t('rewards.applyAtCheckout'), pts: 100, available: customer.points >= 100 },
    { name: t('rewards.essentialOil'), sub: t('rewards.retailProduct'), pts: 150, available: customer.points >= 150 },
    { name: t('rewards.facial'), sub: t('rewards.facialDuration'), pts: 500, available: customer.points >= 500 }
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-cream bg-white p-10 text-center shadow-soft">
        <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error.message}
      </div>
    );
  }

  return (
    <>
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiTile label={t('kpi.balance')} value={String(customer.points)} icon={<Star className="h-4 w-4" />} accent />
        <KpiTile label={t('kpi.totalEarned')} value={String(totalEarned)} />
        <KpiTile label={t('kpi.totalRedeemed')} value={String(totalRedeemed)} />
        <KpiTile label={t('kpi.expiringSoon')} value={expiringSoon} hint={t('kpi.next30d')} warn />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 flex items-center justify-between bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('history')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.date')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.typeSource')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.change')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.balance')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {display.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-textmuted">
                    Chưa có giao dịch điểm
                  </td></tr>
                )}
                {display.map((x, i) => {
                  const kind = classifyDelta(x.delta, x.reason);
                  return (
                    <tr key={`${x.ts}-${i}`} className="hover:bg-brand-ivory/30">
                      <td className="px-4 py-3">
                        <p className="text-brand-textmain">{fmtDate(x.ts)}</p>
                        <p className="text-[10px] font-mono text-brand-textmuted">{x.refId ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <TxTypeBadge type={kind} label={t(`type.${kind}` as 'type.earned')} />
                        <p className="text-[10px] text-brand-textmuted mt-1">{x.refType ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold inline-flex items-center justify-center ${x.delta > 0 ? 'text-green-600' : 'text-brand-textmain'}`}>
                          {x.delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> : <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />}
                          {x.delta > 0 ? `+${x.delta}` : x.delta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-serif">{x.balance}</td>
                      <td className="px-4 py-3 text-xs text-brand-textmuted">{x.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#4A443E] text-white p-6 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif uppercase tracking-widest text-brand-gold text-sm">{t('loyaltyCard')}</h3>
              <Star className="h-5 w-5 text-brand-gold" />
            </div>
            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">{t('availablePoints')}</p>
            <div className="flex items-end gap-3">
              <span className="font-serif text-5xl text-brand-gold font-bold">{customer.points}</span>
              {/* TODO(Phase B): cash-equivalent value requires a redemption-rate config */}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3">
              <Gift className="h-4 w-4 mr-2 text-brand-gold" /> {t('rewardCatalog')}
            </h3>
            <div className="space-y-3">
              {rewards.map(r => (
                <div key={r.name} className={`rounded-xl border border-brand-cream p-3 flex items-center justify-between ${r.available ? 'bg-brand-ivory/40 hover:border-brand-gold cursor-pointer' : 'opacity-60'}`}>
                  <div>
                    <p className="text-sm font-medium text-brand-textmain">{r.name}</p>
                    <p className="text-[10px] text-brand-textmuted mt-0.5">{r.sub}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${r.available ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {r.pts} {t('pts')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-brand-cream bg-brand-ivory/30 p-5">
            <h4 className="text-[10px] uppercase tracking-widest font-semibold text-brand-textmuted mb-3">{t('howEarned')}</h4>
            <ul className="text-sm text-brand-textmain space-y-2">
              <li className="flex items-start"><Check className="h-4 w-4 text-brand-gold mr-2 mt-0.5" />{t('rules.standardRate')}</li>
              <li className="flex items-start"><Check className="h-4 w-4 text-brand-gold mr-2 mt-0.5" />{t('rules.retailBonus')}</li>
              <li className="flex items-start"><Check className="h-4 w-4 text-brand-gold mr-2 mt-0.5" />{t('rules.expiry')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, hint, accent, warn, icon }: { label: string; value: string; hint?: string; accent?: boolean; warn?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5 ${accent ? 'text-brand-gold' : warn ? 'text-brand-rose' : 'text-brand-textmuted'}`}>
        {icon}{label}
      </p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
      {hint && <p className="text-[10px] text-brand-textmuted mt-1">{hint}</p>}
    </div>
  );
}

function TxTypeBadge({ type, label }: { type: TxKind; label: string }) {
  const cls =
    type === 'earned' ? 'bg-green-50 text-green-700 border-green-200' :
    type === 'redeemed' ? 'bg-brand-gold/10 text-brand-goldhover border-brand-gold/30' :
    type === 'manual' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}
