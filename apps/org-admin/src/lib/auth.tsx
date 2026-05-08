'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, ctx as apiCtx } from './api';

export interface AuthUser {
  id: string;
  email: string;
  locale: string;
  roles: string[];
  tenantId: string;
  orgId: string;
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
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string; locale: string; roles: string[] };
}

export async function loginRequest(email: string, password: string) {
  const res = await api<LoginRes>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ tenantId: apiCtx.tenantId, email, password })
  });
  window.localStorage.setItem(STORAGE.access, res.accessToken);
  window.localStorage.setItem(STORAGE.refresh, res.refreshToken);
  window.localStorage.setItem(STORAGE.user, JSON.stringify({
    ...res.user, tenantId: apiCtx.tenantId, orgId: apiCtx.orgId
  }));
  return res.user;
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
