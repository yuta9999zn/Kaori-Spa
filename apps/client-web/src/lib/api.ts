/**
 * Public API client for the customer-facing site.
 *
 * Differences from the admin client:
 *   - No auth header (public endpoints).
 *   - Tenant slug is the canonical identifier (not UUID).
 *   - Errors fall back to local mock data so the marketing site still
 *     shows menus when the backend is offline.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

export const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'natural-beauty';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers }
  });
  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('NETWORK', 'Network error', res.status);
  }
  if (!res.ok || !body.success) {
    const e = body.error ?? { code: 'NETWORK', message: res.statusText };
    throw new ApiError(e.code, e.message, res.status);
  }
  return body.data as T;
}

export interface PublicOrg {
  id: string;
  code: string;
  name: Record<string, string>;
  slug: string;
  branches: Array<{
    code: string;
    name: Record<string, string>;
    address: Record<string, string>;
    phone: string;
    lat: number;
    lng: number;
    directionsUrl: string;
  }>;
}

export function fetchOrg(slug = TENANT_SLUG) {
  return api<PublicOrg>(`/v1/public/orgs/${slug}`);
}

export interface PublicService {
  id: string;
  code: string;
  name: Record<string, string>;
  gender: 'male' | 'female' | 'unisex';
  region: string;
  durationMin: number;
  basePrice: number;
  combo: boolean;
  sessions: number;
  active: boolean;
}

export function fetchServices(orgId: string) {
  return api<PublicService[]>(`/v1/services?orgId=${orgId}`);
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
  bedId: string;
  bedCode: string;
  roomId: string;
  roomCode: string;
  staffId: string | null;
  staffName: string | null;
}

export function fetchAvailability(args: {
  tenantId: string;
  branchId: string;
  serviceCode: string;
  durationMin: number;
  from: Date;
  to: Date;
}) {
  const params = new URLSearchParams({
    tenantId: args.tenantId,
    branchId: args.branchId,
    serviceCode: args.serviceCode,
    durationMin: String(args.durationMin),
    from: args.from.toISOString(),
    to: args.to.toISOString(),
    slotGridMin: '30',
    limit: '30'
  });
  return api<AvailabilitySlot[]>(`/v1/availability/search?${params}`);
}

export interface CreateBookingPayload {
  tenantId: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locale: string;
  source: 'web';
  note?: string;
  items: Array<{
    serviceCode: string;
    serviceName: Record<string, string>;
    bedId: string;
    roomId: string;
    staffId?: string | null;
    startAt: string;
    endAt: string;
    price: number;
  }>;
}

export function createBooking(payload: CreateBookingPayload, idempotencyKey: string) {
  return api<{ id: string; code: string; status: string }>('/v1/bookings', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload)
  });
}
