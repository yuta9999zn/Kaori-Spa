/**
 * Thin fetch wrapper for the branch-admin app.
 *
 * Reads:
 *   - NEXT_PUBLIC_API_BASE   (default: http://localhost:8080)
 *   - NEXT_PUBLIC_TENANT_ID  / NEXT_PUBLIC_BRANCH_ID  (dev seed)
 *   - access token from localStorage 'kaori.accessToken' (set by login flow,
 *     populated separately in M1).
 *
 * Returns the unwrapped `data` from `ApiResponse<T>` envelope. On failure
 * raises an `ApiError` exposing the backend `error.code` / `error.message`.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; detail?: string; fields?: unknown } | null;
  meta?: unknown;
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public fields?: unknown) {
    super(message);
  }
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('kaori.accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(
  path: string,
  init: RequestInit & { idempotency?: string } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.idempotency ? { 'Idempotency-Key': init.idempotency } : {}),
      ...init.headers
    }
  });

  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('NETWORK', `Invalid JSON from ${path}`, res.status);
  }

  if (!res.ok || !body.success) {
    const err = body.error ?? { code: 'NETWORK', message: res.statusText };
    throw new ApiError(err.code, err.message, res.status, err.fields);
  }
  return body.data as T;
}

/** Tenant + branch context, hard-coded for dev. Replace with auth claim once M1 ships. */
export const ctx = {
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000',
  branchId: process.env.NEXT_PUBLIC_BRANCH_ID ?? '00000000-0000-0000-0000-000000000000'
};
