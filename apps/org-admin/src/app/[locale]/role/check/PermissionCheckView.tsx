'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, CheckCircle2, XCircle, Play, Loader2 } from 'lucide-react';
import { checkPermission, useOrgMembers, ORG_ID, type CheckPermissionResult } from '@/lib/hooks';
import { ApiError } from '@/lib/api';

export default function PermissionCheckView() {
  const t = useTranslations('permissionCheck');
  const { data: members, loading: membersLoading } = useOrgMembers(ORG_ID);

  const [userId, setUserId] = useState<string>('');
  const [scopeBranchId, setScopeBranchId] = useState<string>('');
  const [action, setAction] = useState<string>('booking:cancel');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckPermissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberOptions = members ?? [];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng chọn người dùng');
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const r = await checkPermission({
        userId,
        action: action.trim(),
        scopeOrgId: ORG_ID,
        scopeBranchId: scopeBranchId || undefined
      });
      setResult(r);
    } catch (e2) {
      const err = e2 as ApiError;
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3 mb-8">
        <form onSubmit={onSubmit} className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('simulate')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('form.user')}>
              <select
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              >
                <option value="">{membersLoading ? '...' : '—'}</option>
                {memberOptions.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {(m.fullName ?? m.email)} {m.roles.length > 0 ? `(${m.roles.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('form.branch')}>
              <input
                value={scopeBranchId}
                onChange={e => setScopeBranchId(e.target.value)}
                placeholder="branch UUID (tuỳ chọn)"
                className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm font-mono outline-none focus:border-brand-gold"
              />
            </Field>
            <Field label={t('form.action')}>
              <input
                value={action}
                onChange={e => setAction(e.target.value)}
                className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm font-mono outline-none focus:border-brand-gold"
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Play className="h-4 w-4" />}
                {t('form.submit')}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-600">
              {error}
            </p>
          )}
        </form>

        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('form.action')}</p>
          <p className="mt-1 font-mono text-sm text-brand-textmain">{action || '—'}</p>
          <div className="my-3 h-px bg-brand-cream" />

          {!result && !submitting && (
            <p className="text-xs text-brand-textmuted">Nhập và chạy mô phỏng để xem kết quả.</p>
          )}

          {result && result.allowed && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{t('result.allowed')}</span>
            </div>
          )}
          {result && !result.allowed && (
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">{t('result.denied')}</span>
            </div>
          )}

          {result && (
            <>
              <p className="mt-3 text-[10px] uppercase tracking-widest text-brand-textmuted">{t('result.trace')}</p>
              {result.matchingRoles.length > 0 && (
                <p className="mt-1 text-xs text-brand-textmain">
                  Vai trò khớp: <span className="font-mono">{result.matchingRoles.join(', ')}</span>
                </p>
              )}
              {result.deniedReason && (
                <p className="mt-1 text-xs text-brand-textmain">{result.deniedReason}</p>
              )}
            </>
          )}
        </article>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">{label}</label>
      {children}
    </div>
  );
}
