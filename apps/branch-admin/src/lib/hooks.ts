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

// ─── Reports ───────────────────────────────────────────────────────────────

export interface DailyRevenueRow {
  day: string;          // ISO date (YYYY-MM-DD)
  revenue: number;
  bookings: number;
}

export interface TopServiceRow {
  serviceCode: string;
  times: number;
  revenue: number;
}

/** Daily revenue rows for a calendar month (1-12). */
export function useDailyRevenue(year: number, month: number, branchId?: string) {
  return useFetch<DailyRevenueRow[]>(() => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const last  = new Date(Date.UTC(year, month, 0));
    const fmt   = (d: Date) => d.toISOString().slice(0, 10);
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      from: fmt(first),
      to:   fmt(last)
    });
    if (branchId ?? ctx.branchId) params.set('branchId', branchId ?? ctx.branchId);
    return api<DailyRevenueRow[]>(`/v1/reports/revenue/daily?${params}`);
  }, [year, month, branchId ?? ctx.branchId]);
}

/** Top services in `period` ('today' | 'week' | 'month' | 'year'). */
export function useTopServices(period: 'today' | 'week' | 'month' | 'year' = 'month', limit = 10) {
  return useFetch<TopServiceRow[]>(() => {
    const now  = new Date();
    const to   = now;
    let from   = new Date(now);
    if (period === 'today')      from = now;
    else if (period === 'week')  from = new Date(now.getTime() - 6  * 86_400_000);
    else if (period === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
    else                          from = new Date(now.getFullYear(), 0, 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      from: fmt(from),
      to:   fmt(to),
      limit: String(limit)
    });
    return api<TopServiceRow[]>(`/v1/reports/top-services?${params}`);
  }, [period, limit]);
}

// ─── Reports: expenses ─────────────────────────────────────────────────────

export interface ExpenseBreakdownRow {
  category: string;
  amount: number;
  pct: number;
}

export interface ExpenseSummaryDto {
  totalAmount: number;
  breakdown: ExpenseBreakdownRow[];
}

/**
 * SUM of expenses grouped by category for a date window. `from`/`to` are
 * ISO yyyy-mm-dd. Backend zero-fills nothing — empty windows return an
 * empty `breakdown` and `totalAmount = 0`.
 */
export function useExpenses(args: { from: string; to: string; branchId?: string }) {
  return useFetch<ExpenseSummaryDto>(() => {
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      from: args.from,
      to:   args.to
    });
    const bid = args.branchId ?? ctx.branchId;
    if (bid) params.set('branchId', bid);
    return api<ExpenseSummaryDto>(`/v1/reports/expenses?${params}`);
  }, [args.from, args.to, args.branchId ?? ctx.branchId]);
}

// ─── Reports: yearly rollup ────────────────────────────────────────────────

export interface YearlyMonthRow {
  month: number;     // 1..12
  revenue: number;
}

export interface YearlyRevenueDto {
  year: number;
  months: YearlyMonthRow[];
}

/** 12-month revenue rollup for a calendar year. Always returns 12 entries. */
export function useYearlyRevenue(year: number, branchId?: string) {
  return useFetch<YearlyRevenueDto>(() => {
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      year:     String(year)
    });
    const bid = branchId ?? ctx.branchId;
    if (bid) params.set('branchId', bid);
    return api<YearlyRevenueDto>(`/v1/reports/revenue/yearly?${params}`);
  }, [year, branchId ?? ctx.branchId]);
}

// ─── Bookings list ─────────────────────────────────────────────────────────
// Backend exposes GET /v1/bookings as a paged list (booking-service). The old
// /v1/search-based stop-gap (`useBookingSearch`) has been removed.

export interface BookingListItem {
  id: string;
  code: string;
  status: string;
  source: string;
  customerName: string;
  customerPhone: string;
  startAt: string;
  endAt: string;
  totalAmount: number;
  itemCount: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface UseBookingsArgs {
  status?: string;
  from?: string;
  to?: string;
  customerPhone?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export function useBookings(args: UseBookingsArgs = {}) {
  const {
    status, from, to, customerPhone,
    page = 0, size = 20, sort = 'startAt,desc'
  } = args;
  return useFetch<PagedResult<BookingListItem>>(() => {
    const params = new URLSearchParams({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      page: String(page),
      size: String(size),
      sort
    });
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (customerPhone && customerPhone.trim().length > 0) {
      params.set('customerPhone', customerPhone.trim());
    }
    return api<PagedResult<BookingListItem>>(`/v1/bookings?${params}`);
  }, [status ?? '', from ?? '', to ?? '', customerPhone ?? '', page, size, sort]);
}

// ─── Customers (paged search) ──────────────────────────────────────────────
// Convenience hook (vs the bare `searchCustomers` action) that subscribes
// to a query string and re-fetches on change.
export function useCustomerSearch(q: string, orgId: string) {
  return useFetch<{ items: CustomerLite[]; total: number }>(async () => {
    return api<{ items: CustomerLite[]; total: number; page: number; size: number }>(
      `/v1/customers?orgId=${orgId}&q=${encodeURIComponent(q)}&size=50`
    );
  }, [q, orgId]);
}

// ─── Content (CMS) ─────────────────────────────────────────────────────────
// Backed by content-service's GET /v1/content. Branch-admin scopes the list
// to the active branch via `ctx.branchId` so users only see posts owned by
// their own branch (org-level posts are filtered out).

const BRANCH_ADMIN_ORG_ID =
  process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

export interface ContentPostListItem {
  id: string;
  branchId: string | null;
  type: string;
  slug: string;
  title: Record<string, string>;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  coverUrl: string | null;
  tags: string[];
  updatedAt: string;
}

export interface UseContentPostsArgs {
  type?: string;
  status?: string;
  q?: string;
  page?: number;
  size?: number;
}

export function useContentPosts(args: UseContentPostsArgs = {}) {
  const { type, status, q, page = 0, size = 20 } = args;
  return useFetch<PagedResult<ContentPostListItem>>(() => {
    const params = new URLSearchParams({
      orgId: BRANCH_ADMIN_ORG_ID,
      branchId: ctx.branchId,
      page: String(page),
      size: String(size)
    });
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (q && q.trim().length > 0) params.set('q', q.trim());
    return api<PagedResult<ContentPostListItem>>(`/v1/content?${params}`);
  }, [type ?? '', status ?? '', q ?? '', page, size]);
}
