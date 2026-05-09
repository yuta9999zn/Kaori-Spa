'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PackageMinus, Plus, Receipt, Boxes, AlertTriangle, Wallet, Loader2 } from 'lucide-react';
import {
  useInventoryProducts, useInventoryMoves, recordMove,
  type InventoryProduct, type InventoryMove
} from '@/lib/hooks';

export default function InventoryOutView() {
  const t = useTranslations('inventoryOut');
  const { data: products } = useInventoryProducts();
  const { data: moves, refetch: refetchMoves } = useInventoryMoves();

  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const outMoves = (moves ?? []).filter(m => m.moveType === 'out');
  const todayMoves = outMoves.filter(m => m.occurredAt.slice(0, 10) === today).length;
  const totalUnits = outMoves.reduce((s, m) => s + Math.abs(m.delta), 0);
  // TODO(Phase B): low-stock count + monetary value not derivable from moves only.
  const lowStock = 0;
  const totalValue = 0;

  const submit = async () => {
    if (!productId || !qty) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await recordMove({
        productId,
        delta: -Math.abs(Number(qty) || 0),
        moveType: 'out',
        note: note || undefined
      });
      await refetchMoves();
      setProductId('');
      setQty('');
      setNote('');
    } catch (e) {
      setSubmitErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <PackageMinus className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1">{t('subtitle')}</p>
        </div>
        <button onClick={submit} disabled={submitting || !productId || !qty} className="btn-primary disabled:opacity-50">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('newIssue')}
        </button>
      </header>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <Kpi label={t('kpi.todayIssues')} value={String(todayMoves)} Icon={Receipt} accent="text-brand-gold" bg="bg-brand-gold/10" />
        <Kpi label={t('kpi.totalUnits')} value={String(totalUnits)} Icon={Boxes} accent="text-blue-600" bg="bg-blue-50" />
        <Kpi label={t('kpi.lowStock')} value={String(lowStock)} Icon={AlertTriangle} accent="text-amber-600" bg="bg-amber-50" />
        <Kpi label={t('kpi.totalValue')} value={fmtM(totalValue)} Icon={Wallet} accent="text-emerald-600" bg="bg-emerald-50" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mb-6">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-3">{t('newIssue')}</h2>
          <div className="grid gap-3 md:grid-cols-2 mb-4">
            <Field label={t('form.issueCode')}>
              <input type="text" placeholder="auto" className="spa-input" disabled />
            </Field>
            <Field label={t('form.issueDate')}>
              <input type="date" defaultValue={today} className="spa-input" />
            </Field>
            <Field label={t('form.purpose')}>
              {/* TODO(Phase B): purpose not yet stored on InventoryMove */}
              <select className="spa-input" defaultValue="service" disabled>
                <option value="service">{t('purpose.service')}</option>
                <option value="sale">{t('purpose.sale')}</option>
                <option value="transfer">{t('purpose.transfer')}</option>
                <option value="damage">{t('purpose.damage')}</option>
              </select>
            </Field>
            <Field label={t('form.staff')}>
              <input type="text" placeholder="..." className="spa-input" />
            </Field>
            <Field label={t('form.note')}>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="..."
                className="spa-input"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] uppercase tracking-widest text-brand-textmuted">{t('form.items')}</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_140px] mb-4">
            <Field label={t('columns.product')}>
              <select
                className="spa-input"
                value={productId}
                onChange={e => setProductId(e.target.value)}
              >
                <option value="">— —</option>
                {(products ?? []).map((p: InventoryProduct) => (
                  <option key={p.id} value={p.id}>{p.code} · {p.name?.vi ?? p.name?.en ?? p.code}</option>
                ))}
              </select>
            </Field>
            <Field label={t('columns.qty')}>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="spa-input"
              />
            </Field>
          </div>

          {submitErr && <p className="text-xs text-rose-600 mb-2">{submitErr}</p>}

          <div className="flex justify-end mt-4">
            <button onClick={submit} disabled={submitting || !productId || !qty} className="btn-primary disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('form.submit')}
            </button>
          </div>
        </article>

        <article className="kpi-card">
          <h2 className="font-serif text-base text-brand-textmain mb-3">Phiếu gần đây</h2>
          <ul className="space-y-3 max-h-[360px] overflow-y-auto">
            {outMoves.length === 0 && (
              <li className="text-xs text-brand-textmuted">Chưa có lịch sử xuất kho</li>
            )}
            {outMoves.slice(0, 20).map((m: InventoryMove) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-brand-gold font-mono text-xs">
                    {new Date(m.occurredAt).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-[11px] text-brand-textmuted">{m.note ?? '—'}</p>
                </div>
                <p className="tabular-nums font-medium text-rose-700">
                  {m.delta}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(1)}M ₫`; }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-brand-textmuted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Kpi({
  label, value, Icon, accent, bg
}: {
  label: string; value: string; accent: string; bg: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}
