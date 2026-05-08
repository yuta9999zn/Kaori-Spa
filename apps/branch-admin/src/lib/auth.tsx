'use client';

/**
 * Auth state for branch-admin.
 *
 * Storage keys:
 *   kaori.accessToken   short-lived JWT (10 min)
 *   kaori.refreshToken  rotated single-use
 *   kaori.user          cached user summary
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, ctx as apiCtx } from './api';

export interface AuthUser {
  id: string;
  email: string;
  locale: string;
  roles: string[];
  tenantId: string;
  branchId?: string | null;
}

const STORAGE = {
  access:  'kaori.accessToken',
  refresh: 'kaori.refreshToken',
  user:    'kaori.user'
};

function readUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE.user);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch { return null; }
}

interface LoginRes {
  step: 'ok' | '2fa_required';
  pendingToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number;
  user: { id: string; email: string; locale: string; roles: string[] } | null;
}

export type LoginOutcome =
  | { step: 'ok'; user: NonNullable<LoginRes['user']> }
  | { step: '2fa_required'; pendingToken: string };

/**
 * If the user has 2FA enabled, the response carries
 * step='2fa_required' + a pendingToken. The caller must then prompt for the
 * 6-digit code and invoke verifyOtp(token, code) to receive real tokens.
 */
export async function loginRequest(email: string, password: string): Promise<LoginOutcome> {
  const res = await api<LoginRes>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ tenantId: apiCtx.tenantId, email, password })
  });
  if (res.step === 'ok' && res.accessToken && res.refreshToken && res.user) {
    saveTokens(res);
    return { step: 'ok', user: res.user };
  }
  return { step: '2fa_required', pendingToken: res.pendingToken ?? '' };
}

export async function verifyOtp(pendingToken: string, code: string) {
  const res = await api<LoginRes>('/v1/auth/login/2fa', {
    method: 'POST',
    body: JSON.stringify({ pendingToken, code })
  });
  if (res.step === 'ok' && res.accessToken && res.refreshToken && res.user) {
    saveTokens(res);
    return res.user;
  }
  throw new Error('Unexpected 2FA response shape');
}

function saveTokens(res: LoginRes) {
  if (!res.accessToken || !res.refreshToken || !res.user) return;
  window.localStorage.setItem(STORAGE.access, res.accessToken);
  window.localStorage.setItem(STORAGE.refresh, res.refreshToken);
  window.localStorage.setItem(STORAGE.user, JSON.stringify({
    ...res.user,
    tenantId: apiCtx.tenantId,
    branchId: apiCtx.branchId
  }));
}

export async function refreshTokenIfNeeded() {
  if (typeof window === 'undefined') return null;
  const r = window.localStorage.getItem(STORAGE.refresh);
  if (!r) return null;
  try {
    const res = await api<LoginRes>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: r })
    });
    window.localStorage.setItem(STORAGE.access, res.accessToken);
    window.localStorage.setItem(STORAGE.refresh, res.refreshToken);
    return res;
  } catch (e) {
    if ((e as ApiError).status === 401) clearAuth();
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE.access);
  window.localStorage.removeItem(STORAGE.refresh);
  window.localStorage.removeItem(STORAGE.user);
}

export async function logout() {
  if (typeof window === 'undefined') return;
  const r = window.localStorage.getItem(STORAGE.refresh);
  if (r) {
    try { await api('/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: r }) }); }
    catch { /* best-effort */ }
  }
  clearAuth();
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthed: boolean;
  loading: boolean;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, isAuthed: false, loading: true, refresh: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => { setUser(readUser()); }, []);

  useEffect(() => {
    setUser(readUser());
    setLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key && Object.values(STORAGE).includes(e.key)) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

export function hasRole(user: AuthUser | null, ...roles: string[]) {
  if (!user) return false;
  return user.roles.some(r => roles.includes(r));
}
