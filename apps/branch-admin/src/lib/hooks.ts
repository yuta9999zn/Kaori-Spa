'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, ctx } from './api';

/** Generic data hook: load on mount + refetch helper + error/loading state. */
export function useFetch<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const live = useRef(true);

  useEffect(() => () => { live.current = false; }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const v = await loader();
      if (live.current) setData(v);
    } catch (e) {
      if (live.current) setError(e as ApiError);
    } finally {
      if (live.current) setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void refetch(); }, deps);

  return { data, error, loading, refetch };
}

// ─── Booking ────────────────────────────────────────────────────────────────

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

export function useAvailability(args: {
  serviceCode: string;
  durationMin: number;
  from: Date;
  to: Date;
} | null) {
  return useFetch<AvailabilitySlot[] | null>(async () => {
    if (!args) return null;
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      serviceCode: args.serviceCode,
      durationMin: String(args.durationMin),
      from: args.from.toISOString(),
      to: args.to.toISOString()
    });
    return api<AvailabilitySlot[]>(`/v1/availability/search?${params}`);
  }, [args?.serviceCode, args?.durationMin, args?.from?.toISOString(), args?.to?.toISOString()]);
}

// ─── Shifts ────────────────────────────────────────────────────────────────

export interface ShiftRow {
  staffId: string;
  code: string;
  fullName: string;
  nickname: string;
  byDate: Record<string, 'SANG' | 'TOI' | 'FULL' | 'NGHI'>;
  stats: { SANG: number; TOI: number; FULL: number; NGHI: number };
}

export interface ShiftGrid {
  year: number;
  month: number;
  rows: ShiftRow[];
}

export function useShiftGrid(year: number, month: number) {
  return useFetch<ShiftGrid>(() => {
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      year: String(year),
      month: String(month)
    });
    return api<ShiftGrid>(`/v1/shifts/grid?${params}`);
  }, [year, month]);
}

export function saveShiftAssignments(assignments: Array<{
  staffId: string;
  workDate: string;
  shiftType: 'SANG' | 'TOI' | 'FULL' | 'NGHI';
}>) {
  return api<number>('/v1/shifts/assign', {
    method: 'POST',
    body: JSON.stringify({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      assignments
    })
  });
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export interface AttendanceRow {
  staffId: string;
  staffName: string;
  staffNickname: string;
  date: string;
  shiftType: 'SANG' | 'TOI' | 'FULL' | 'NGHI' | null;
  expectedStart: string | null;
  expectedEnd: string | null;
  actualIn: string | null;
  actualOut: string | null;
  status: 'scheduled' | 'present' | 'late' | 'absent' | 'early_out' | 'off' | 'no_shift';
  minutesWorked: number | null;
  minutesLate: number | null;
}

export function useAttendance(date?: string) {
  return useFetch<AttendanceRow[]>(() => {
    const params = new URLSearchParams({ branchId: ctx.branchId });
    if (date) params.set('date', date);
    return api<AttendanceRow[]>(`/v1/attendance?${params}`);
  }, [date]);
}

export function checkIn(staffId: string) {
  return api<AttendanceRow>('/v1/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ staffId, tenantId: ctx.tenantId, branchId: ctx.branchId })
  });
}

export function checkOut(staffId: string) {
  return api<AttendanceRow>('/v1/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify({ staffId, tenantId: ctx.tenantId, branchId: ctx.branchId })
  });
}

// ─── Catalog ──────────────────────────────────────────────────────────────

export interface CatalogService {
  id: string;
  code: string;
  name: Record<string, string>;
  gender: 'male' | 'female' | 'unisex';
  region: string;
  durationMin: number;
  basePrice: number;
  combo: boolean;
  sessions: number;
  usesWax: boolean;
  usesMachine: boolean;
  active: boolean;
}

export function useCatalog(orgId: string) {
  return useFetch<CatalogService[]>(() =>
    api<CatalogService[]>(`/v1/services?orgId=${orgId}`),
    [orgId]
  );
}

// ─── Customer search ──────────────────────────────────────────────────────

export interface CustomerLite {
  id: string; code: string; fullName: string; nickname: string | null;
  phone: string; email: string | null; gender: string | null;
  locale: string; nationality: string;
  segment: 'new' | 'regular' | 'vip' | 'dormant';
  points: number;
  lifetimeSpend?: number;
}

export interface LoyaltyLedgerRow {
  delta: number;
  reason: string;
  ts: string;
  refType: string | null;
  refId: string | null;
}

export function fetchLoyaltyLedger(customerId: string) {
  return api<LoyaltyLedgerRow[]>(`/v1/loyalty/customers/${customerId}/ledger`);
}

export function searchCustomers(orgId: string, q: string) {
  return api<{ items: CustomerLite[]; total: number; page: number; size: number }>(
    `/v1/customers?orgId=${orgId}&q=${encodeURIComponent(q)}&size=10`
  );
}

export function createCustomer(orgId: string, input: {
  fullName: string; nickname?: string; phone: string;
  email?: string; gender?: string; locale?: string;
  nationality?: 'VN' | 'JP' | 'KR' | 'OTHER';
}) {
  return api<CustomerLite>('/v1/customers', {
    method: 'POST',
    body: JSON.stringify({ tenantId: ctx.tenantId, orgId, ...input })
  });
}

// ─── Booking create ───────────────────────────────────────────────────────

export interface BookingItemInput {
  serviceCode: string;
  serviceName: Record<string, string>;
  bedId: string;
  roomId: string;
  staffId?: string | null;
  startAt: string;
  endAt: string;
  price: number;
}

export interface BookingDto {
  id: string; code: string; status: string;
  customerName: string; customerPhone: string;
  startAt: string; endAt: string; totalAmount: number;
}

export function createBooking(args: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locale?: string;
  source?: string;
  note?: string;
  items: BookingItemInput[];
  idempotencyKey: string;
}) {
  return api<BookingDto>('/v1/bookings', {
    method: 'POST',
    idempotency: args.idempotencyKey,
    body: JSON.stringify({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      locale: args.locale ?? 'vi',
      source: args.source ?? 'admin',
      note: args.note,
      items: args.items
    })
  });
}

// ─── Customer history ─────────────────────────────────────────────────────

export interface VisitItem {
  serviceCode: string;
  serviceName: Record<string, string>;
  region: string;
  price: number;
  staffName: string | null;
}

export interface Visit {
  bookingCode: string;
  startAt: string;
  status: string;
  items: VisitItem[];
  total: number;
}

export interface RegionUsage {
  region: string;
  visits: number;
  lastVisit: string | null;
}

export function useCustomerVisits(phone: string) {
  return useFetch<Visit[]>(() => {
    if (!phone) return Promise.resolve([] as Visit[]);
    return api<Visit[]>(`/v1/customers/${encodeURIComponent(phone)}/visits?branchId=${ctx.branchId}`);
  }, [phone]);
}

export function useCustomerRegions(phone: string) {
  return useFetch<RegionUsage[]>(() => {
    if (!phone) return Promise.resolve([] as RegionUsage[]);
    return api<RegionUsage[]>(`/v1/customers/${encodeURIComponent(phone)}/regions?branchId=${ctx.branchId}`);
  }, [phone]);
}

export function fetchCustomer(id: string) {
  return api<CustomerLite>(`/v1/customers/${id}`);
}

// ─── Inventory ─────────────────────────────────────────────────────────────

export interface InventoryProduct {
  id: string; code: string; name: Record<string, string>;
  sku: string | null; unit: string;
  basePrice: number; category: string | null; active: boolean;
}

export interface InventoryStockRow {
  productId: string; productCode: string;
  productName: Record<string, string>;
  unit: string; qty: number;
}

export interface InventoryMove {
  id: string; productId: string; delta: number;
  moveType: 'in' | 'out' | 'adjust' | 'transfer';
  refType: string | null; refId: string | null;
  note: string | null; occurredAt: string;
}

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

export function useInventoryProducts() {
  return useFetch<InventoryProduct[]>(() =>
    api<InventoryProduct[]>(`/v1/inventory/products?orgId=${ORG_ID}`)
  );
}

export function useInventoryStock() {
  return useFetch<InventoryStockRow[]>(() =>
    api<InventoryStockRow[]>(`/v1/inventory/stock?branchId=${ctx.branchId}`)
  );
}

export function useInventoryMoves(productId?: string) {
  return useFetch<InventoryMove[]>(() => {
    const qs = productId
      ? `productId=${productId}`
      : `branchId=${ctx.branchId}`;
    return api<InventoryMove[]>(`/v1/inventory/moves?${qs}`);
  }, [productId]);
}

export function recordMove(args: {
  productId: string;
  delta: number;
  moveType: 'in' | 'out' | 'adjust' | 'transfer';
  note?: string;
}) {
  return api<InventoryMove>('/v1/inventory/moves', {
    method: 'POST',
    body: JSON.stringify({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      ...args
    })
  });
}

// ─── Rooms / Beds ──────────────────────────────────────────────────────────

export interface BedDto {
  id: string; code: string; name: Record<string, string>;
  bedType: string; status: 'active' | 'maintenance' | 'retired';
}
export interface RoomDto {
  id: string; code: string; name: Record<string, string>;
  roomType: string; floor: number | null; capacityBeds: number;
  active: boolean; beds: BedDto[];
}

export function useRooms() {
  return useFetch<RoomDto[]>(() => {
    const params = new URLSearchParams({ tenantId: ctx.tenantId, branchId: ctx.branchId });
    return api<RoomDto[]>(`/v1/rooms?${params}`);
  });
}

// ─── Staff ─────────────────────────────────────────────────────────────────

export interface StaffDto {
  id: string; code: string; fullName: string; nickname: string | null;
  roleInBranch: string; active: boolean;
}

export function useStaff() {
  return useFetch<StaffDto[]>(() => {
    const params = new URLSearchParams({ tenantId: ctx.tenantId, branchId: ctx.branchId });
    return api<StaffDto[]>(`/v1/staff?${params}`);
  });
}
