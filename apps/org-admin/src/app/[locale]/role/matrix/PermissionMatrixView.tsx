'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Save, RotateCcw, Check, ListChecks, Loader2 } from 'lucide-react';
import {
  useRoles, usePermissions, useRolePermissions, setRolePermissions
} from '@/lib/hooks';
import { ApiError } from '@/lib/api';

export default function PermissionMatrixView() {
  const t = useTranslations('permissionMatrix');
  const { data: roles, loading: rolesLoading, error: rolesError } = useRoles();
  const { data: permissions, loading: permsLoading, error: permsError } = usePermissions();

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const { data: rolePerms, loading: rolePermsLoading, refetch: refetchRolePerms } =
    useRolePermissions(selectedRoleId || null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [originalSelected, setOriginalSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Pick first role as default once loaded.
  useEffect(() => {
    if (!selectedRoleId && roles && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Sync selection when role-permissions load.
  useEffect(() => {
    if (rolePerms) {
      const next = new Set(rolePerms);
      setSelected(next);
      setOriginalSelected(new Set(rolePerms));
    }
  }, [rolePerms]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof permissions extends (infer T)[] | null ? T[] : never>();
    (permissions ?? []).forEach(p => {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    });
    return Array.from(map.entries());
  }, [permissions]);

  const dirty = useMemo(() => {
    if (selected.size !== originalSelected.size) return true;
    for (const code of selected) if (!originalSelected.has(code)) return true;
    return false;
  }, [selected, originalSelected]);

  const selectedRole = roles?.find(r => r.id === selectedRoleId) ?? null;

  const toggle = (code: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const reset = () => setSelected(new Set(originalSelected));

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await setRolePermissions(selectedRoleId, Array.from(selected));
      const next = new Set(updated);
      setSelected(next);
      setOriginalSelected(new Set(updated));
      setSavedAt(Date.now());
      void refetchRolePerms();
    } catch (e) {
      const err = e as ApiError;
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loading = rolesLoading || permsLoading;
  const loadError = rolesError ?? permsError;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Shield className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={reset} disabled={!dirty || saving} className="btn-ghost disabled:opacity-50">
            <RotateCcw className="h-4 w-4" /> {t('reset')}
          </button>
          <button onClick={save} disabled={!dirty || saving || !selectedRoleId} className="btn-primary disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </button>
        </div>
      </header>

      <section className="kpi-card mb-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('role')}</p>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              className="mt-1 rounded-xl border border-brand-cream bg-white px-3 py-1.5 font-serif text-xl text-brand-textmain focus:outline-none focus:border-brand-gold"
            >
              {(roles ?? []).map(r => (
                <option key={r.id} value={r.id}>{r.code}</option>
              ))}
            </select>
          </div>
          <span className="hidden h-10 w-px bg-brand-cream md:block" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('scope')}</p>
            <p className="mt-1 text-sm font-medium text-brand-textmain">
              {selectedRole?.scope ?? '—'}
            </p>
          </div>
          <span className="hidden h-10 w-px bg-brand-cream md:block" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">Permissions đã chọn</p>
            <p className="mt-1 text-sm font-medium text-brand-gold">
              {selected.size} / {(permissions ?? []).length}
            </p>
          </div>
        </div>
        {saveError && (
          <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-600">
            {saveError}
          </p>
        )}
        {savedAt && !saveError && !dirty && (
          <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
            Đã lưu lúc {new Date(savedAt).toLocaleTimeString('vi-VN')}.
          </p>
        )}
      </section>

      {loading && (
        <div className="rounded-2xl border border-brand-cream bg-white px-6 py-12 text-center shadow-soft">
          <Loader2 className="inline h-5 w-5 animate-spin text-brand-gold" />
        </div>
      )}
      {loadError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm text-rose-600">
          {loadError.message}
        </div>
      )}

      {!loading && !loadError && (
        <div className="grid gap-6 xl:grid-cols-4">
          <div className="space-y-6 xl:col-span-3">
            {grouped.length === 0 && (
              <div className="rounded-2xl border border-brand-cream bg-white px-6 py-12 text-center text-sm text-brand-textmuted shadow-soft">
                Chưa có permission nào được seed.
              </div>
            )}
            {grouped.map(([groupName, perms]) => (
              <section key={groupName} className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
                <header className="flex items-center justify-between border-b border-brand-cream bg-brand-ivory/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                      <Shield className="h-4 w-4" />
                    </span>
                    <h2 className="font-serif text-lg text-brand-textmain">{groupName}</h2>
                  </div>
                </header>
                <table className="w-full text-sm">
                  <thead className="bg-white text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Code</th>
                      <th className="text-left px-3 py-3 font-medium">Tên</th>
                      <th className="text-center px-3 py-3 font-medium w-20">{t('columns.all' as 'columns.all')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream/60">
                    {perms.map(p => {
                      const checked = selected.has(p.code);
                      return (
                        <tr key={p.id} className="hover:bg-brand-cream/20">
                          <td className="px-6 py-3 font-mono text-xs text-brand-textmain">{p.code}</td>
                          <td className="px-3 py-3 text-brand-textmuted text-xs">
                            {p.name?.vi ?? p.name?.en ?? p.code}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={rolePermsLoading || !selectedRoleId}
                              onChange={() => toggle(p.code)}
                              className="h-4 w-4 cursor-pointer accent-brand-gold"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          <aside className="xl:col-span-1">
            <div className="kpi-card sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-5 w-5 text-brand-gold" />
                <h2 className="font-serif text-lg text-brand-textmain">{t('summary')}</h2>
              </div>
              <p className="text-xs text-brand-textmuted leading-relaxed mb-4">{t('summaryDesc')}</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selected).sort().map(code => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-gold/20 bg-brand-gold/10 px-3 py-1.5 text-xs font-mono text-brand-gold"
                  >
                    <Check className="h-3 w-3" />
                    {code}
                  </span>
                ))}
                {selected.size === 0 && (
                  <p className="text-xs text-brand-textmuted">Chưa có permission nào.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
