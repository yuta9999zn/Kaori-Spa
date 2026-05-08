export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('kaori.accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init.headers }
  });
  let body: ApiEnvelope<T>;
  try { body = (await res.json()) as ApiEnvelope<T>; }
  catch { throw new ApiError('NETWORK', 'Network error', res.status); }
  if (!res.ok || !body.success) {
    const e = body.error ?? { code: 'NETWORK', message: res.statusText };
    throw new ApiError(e.code, e.message, res.status);
  }
  return body.data as T;
}

export const ctx = {
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000',
  orgId:    process.env.NEXT_PUBLIC_ORG_ID    ?? '00000000-0000-0000-0000-000000000000'
};
