'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000';

const STORAGE = {
  access:  'kaori.web.accessToken',
  refresh: 'kaori.web.refreshToken',
  profile: 'kaori.web.profile'
};

export interface CustomerProfile {
  phone: string;
  fullName?: string;
  email?: string;
}

interface TokenRes {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function signup(args: {
  phone: string;
  password: string;
  email?: string;
  locale: string;
  fullName?: string;
}) {
  const res = await api<TokenRes>('/v1/public/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      tenantId: TENANT_ID,
      phone: args.phone,
      password: args.password,
      email: args.email,
      locale: args.locale
    })
  });
  saveTokens(res, { phone: args.phone, fullName: args.fullName, email: args.email });
}

export async function loginByPhone(phone: string, password: string) {
  const res = await api<TokenRes>('/v1/public/auth/login', {
    method: 'POST',
    body: JSON.stringify({ tenantId: TENANT_ID, phone, password })
  });
  saveTokens(res, { phone });
}

function saveTokens(t: TokenRes, profile: CustomerProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE.access, t.accessToken);
  window.localStorage.setItem(STORAGE.refresh, t.refreshToken);
  window.localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
}

export function logoutCustomer() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE.access);
  window.localStorage.removeItem(STORAGE.refresh);
  window.localStorage.removeItem(STORAGE.profile);
}

export function readProfile(): CustomerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE.profile);
    return raw ? JSON.parse(raw) as CustomerProfile : null;
  } catch { return null; }
}

interface CustomerAuthValue {
  profile: CustomerProfile | null;
  isAuthed: boolean;
  refresh: () => void;
}

const Ctx = createContext<CustomerAuthValue>({
  profile: null, isAuthed: false, refresh: () => {}
});

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const refresh = useCallback(() => setProfile(readProfile()), []);
  useEffect(() => { setProfile(readProfile()); }, []);
  return <Ctx.Provider value={{ profile, isAuthed: !!profile, refresh }}>{children}</Ctx.Provider>;
}

export function useCustomerAuth() { return useContext(Ctx); }

/** Use in admin api wrapper if we ever read the customer token in client-web. */
export function customerAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const t = window.localStorage.getItem(STORAGE.access);
  return t ? { Authorization: `Bearer ${t}` } : {};
}
