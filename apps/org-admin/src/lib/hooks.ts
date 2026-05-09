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

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000000';

/** Org id used by every org-admin hook. Re-export so pages don't need to wire env vars. */
export { ORG_ID };

// ─── Branches ────────────────────────────────────────────────────────────────

export interface BranchDto {
  id: string;
  orgId: string;
  code: string;
  name: Record<string, string>;
  address: Record<string, string>;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  active: boolean;
}

/** Generic paged-result envelope used by the org-admin BE endpoints. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface UseBranchesArgs {
  q?: string;
  page?: number;
  size?: number;
}

export function useBranches(orgId: string = ORG_ID, args: UseBranchesArgs = {}) {
  const { q, page = 0, size = 20 } = args;
  return useFetch<PagedResult<BranchDto>>(() => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q && q.trim().length > 0) params.set('q', q.trim());
    return api<PagedResult<BranchDto>>(`/v1/orgs/${orgId}/branches?${params}`);
  }, [orgId, q ?? '', page, size]);
}

// ─── Vouchers ────────────────────────────────────────────────────────────────

export interface AdminVoucherDto {
  id: string;
  code: string;
  kind: 'PERCENT' | 'FIXED';
  value: number;
  capAmount: number | null;
  minBill: number;
  validFrom: string;
  validTo: string;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerCustomer: number;
  active: boolean;
}

export function useVouchers(orgId: string = ORG_ID) {
  return useFetch<AdminVoucherDto[]>(
    () => api<AdminVoucherDto[]>(`/v1/vouchers?orgId=${orgId}`),
    [orgId]
  );
}

export function toggleVoucher(id: string) {
  return api<void>(`/v1/vouchers/${id}/toggle`, { method: 'POST' });
}

export interface CreateVoucherInput {
  code: string;
  kind: 'PERCENT' | 'FIXED';
  value: number;
  capAmount: number | null;
  minBill: number;
  validFrom: string;
  validTo: string;
  maxUses: number | null;
  maxUsesPerCustomer: number;
}

export function createVoucher(input: CreateVoucherInput, orgId: string = ORG_ID) {
  return api<AdminVoucherDto[]>('/v1/vouchers', {
    method: 'POST',
    body: JSON.stringify({
      tenantId: ctx.tenantId,
      orgId,
      ...input
    })
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export type BranchOrderBy = 'score' | 'revenue' | 'rating' | 'bookings';
export type StaffOrderBy  = 'score' | 'rating' | 'bookings' | 'ontime';

export interface LeaderboardBranchRow {
  branchId: string;
  bookingsDone: number;
  bookingsNoshow: number;
  uniqueCustomers: number;
  revenue: number;
  avgRating: number;
  ratingCount: number;
  repeatPct: number;
  score: number;
}

export interface LeaderboardStaffRow {
  staffId: string;
  staffName: string;
  staffNickname: string | null;
  branchId: string;
  bookingsDone: number;
  bookingsNoshow: number;
  uniqueCustomers: number;
  avgRating: number;
  ratingCount: number;
  onTimePct: number;
  score: number;
}

export function useLeaderboardBranches(orderBy: BranchOrderBy = 'score', limit = 20) {
  return useFetch<LeaderboardBranchRow[]>(
    () => api<LeaderboardBranchRow[]>(
      `/v1/leaderboard/branches?tenantId=${ctx.tenantId}&orderBy=${orderBy}&limit=${limit}`
    ),
    [orderBy, limit]
  );
}

export function useLeaderboardStaff(
  orderBy: StaffOrderBy = 'score',
  branchId?: string,
  limit = 30
) {
  return useFetch<LeaderboardStaffRow[]>(
    () => {
      const qs = new URLSearchParams({
        tenantId: ctx.tenantId,
        orderBy,
        limit: String(limit)
      });
      if (branchId) qs.set('branchId', branchId);
      return api<LeaderboardStaffRow[]>(`/v1/leaderboard/staff?${qs}`);
    },
    [orderBy, branchId ?? '', limit]
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

export interface ServiceDto {
  id: string;
  code: string;
  name: Record<string, string>;
  gender: 'male' | 'female' | 'unisex' | string;
  region: string;
  durationMin: number;
  basePrice: number;
  combo: boolean;
  sessions: number;
  usesWax: boolean;
  usesMachine: boolean;
  active: boolean;
}

export function useOrgServices(orgId: string = ORG_ID) {
  return useFetch<ServiceDto[]>(
    () => api<ServiceDto[]>(`/v1/services?orgId=${orgId}`),
    [orgId]
  );
}

export function setServicePrice(id: string, price: number) {
  return api<ServiceDto>(`/v1/services/${id}/price`, {
    method: 'PUT',
    body: JSON.stringify({ price })
  });
}

// ─── Reports (composite) ─────────────────────────────────────────────────────

export interface DailyRevenue { day: string; revenue: number; bookings: number; }
export interface BranchSummary {
  branchId: string;
  revenue: number;
  bookings: number;
  doneBookings: number;
  cancelled: number;
  avgTicket: number;
}
export interface TopService { serviceCode: string; times: number; revenue: number; }
export interface HeatmapCell { dow: number; hour: number; bookings: number; }

export interface BranchReportArgs {
  from: string;             // YYYY-MM-DD
  to: string;               // YYYY-MM-DD
  branchId?: string | null; // optional filter
  topLimit?: number;
}

export interface BranchReportData {
  byBranch: BranchSummary[];
  daily: DailyRevenue[];
  topServices: TopService[];
}

/**
 * Composite hook that fans out to /v1/reports/revenue/by-branch,
 * /v1/reports/revenue/daily and /v1/reports/top-services for the same window.
 */
export function useBranchReport(args: BranchReportArgs) {
  return useFetch<BranchReportData>(async () => {
    const tenantParam = `tenantId=${ctx.tenantId}`;
    const branchQs = args.branchId ? `&branchId=${args.branchId}` : '';
    const window = `&from=${args.from}&to=${args.to}`;
    const limit = args.topLimit ?? 8;
    const [byBranch, daily, topServices] = await Promise.all([
      api<BranchSummary[]>(`/v1/reports/revenue/by-branch?${tenantParam}${window}`),
      api<DailyRevenue[]>(`/v1/reports/revenue/daily?${tenantParam}${branchQs}${window}`),
      api<TopService[]>(`/v1/reports/top-services?${tenantParam}${branchQs}${window}&limit=${limit}`)
    ]);
    return { byBranch, daily, topServices };
  }, [args.from, args.to, args.branchId ?? '', args.topLimit ?? 8]);
}

export function useHeatmap(args: { from: string; to: string; branchId?: string | null }) {
  return useFetch<HeatmapCell[]>(() => {
    const qs = new URLSearchParams({
      tenantId: ctx.tenantId,
      from: args.from,
      to: args.to
    });
    if (args.branchId) qs.set('branchId', args.branchId);
    return api<HeatmapCell[]>(`/v1/reports/heatmap?${qs}`);
  }, [args.from, args.to, args.branchId ?? '']);
}

// ─── My branches (header switcher) ──────────────────────────────────────────

export interface BranchOption {
  id: string;
  orgId: string;
  code: string;
  name: Record<string, string>;
  address: Record<string, string>;
  lat: number | null;
  lng: number | null;
  active: boolean;
}

export function useMyBranches() {
  return useFetch<BranchOption[]>(() => api<BranchOption[]>('/v1/me/branches'));
}

// ─── RBAC: Roles ────────────────────────────────────────────────────────────

export type RoleScope = 'tenant' | 'org' | 'branch';

export interface RoleDto {
  id: string;
  code: string;
  name: Record<string, string>;
  scope: string;
  isSystem: boolean;
  permissionCodes: string[];
}

export interface CreateRoleInput {
  code: string;
  name: Record<string, string>;
  scope: RoleScope;
  permissionCodes?: string[];
}

export interface UpdateRoleInput {
  name?: Record<string, string>;
  permissionCodes?: string[];
}

export interface UseRolesArgs {
  scope?: RoleScope;
  q?: string;
  page?: number;
  size?: number;
}

export function useRoles(scope?: RoleScope | UseRolesArgs) {
  // Accept either a bare scope string (legacy callers) or a full args bag.
  const args: UseRolesArgs = typeof scope === 'string' || scope === undefined
    ? { scope }
    : scope;
  const { scope: scopeFilter, q, page = 0, size = 50 } = args;
  return useFetch<PagedResult<RoleDto>>(() => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (scopeFilter) params.set('scope', scopeFilter);
    if (q && q.trim().length > 0) params.set('q', q.trim());
    return api<PagedResult<RoleDto>>(`/v1/roles?${params}`);
  }, [scopeFilter ?? '', q ?? '', page, size]);
}

export function createRole(input: CreateRoleInput) {
  return api<RoleDto>('/v1/roles', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateRole(id: string, input: UpdateRoleInput) {
  return api<RoleDto>(`/v1/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function deleteRole(id: string) {
  return api<void>(`/v1/roles/${id}`, { method: 'DELETE' });
}

export function useRolePermissions(roleId: string | null) {
  return useFetch<string[]>(
    () => roleId ? api<string[]>(`/v1/roles/${roleId}/permissions`) : Promise.resolve([]),
    [roleId ?? '']
  );
}

export function setRolePermissions(roleId: string, permissionCodes: string[]) {
  return api<string[]>(`/v1/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionCodes })
  });
}

// ─── RBAC: Permissions ──────────────────────────────────────────────────────

export interface PermissionDto {
  id: string;
  code: string;
  name: Record<string, string>;
  group: string;
}

export function usePermissions() {
  return useFetch<PermissionDto[]>(() => api<PermissionDto[]>('/v1/permissions'));
}

export interface CheckPermissionInput {
  userId: string;
  action: string;
  scopeOrgId?: string;
  scopeBranchId?: string;
}

export interface CheckPermissionResult {
  allowed: boolean;
  matchingRoles: string[];
  deniedReason: string | null;
}

export function checkPermission(input: CheckPermissionInput) {
  return api<CheckPermissionResult>('/v1/permissions/check', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

// ─── RBAC: User-role assignments ────────────────────────────────────────────

export interface UserRoleDto {
  userId: string;
  userEmail: string;
  userFullName: string | null;
  roleId: string;
  roleCode: string;
  roleName: Record<string, string>;
  scopeOrgId: string | null;
  scopeBranchId: string | null;
  grantedAt: string;
}

export interface UserRoleFilter {
  userId?: string;
  orgId?: string;
  branchId?: string;
  page?: number;
  size?: number;
}

export function useUserRoles(filter: UserRoleFilter = {}) {
  const { userId, orgId, branchId, page = 0, size = 50 } = filter;
  return useFetch<PagedResult<UserRoleDto>>(() => {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (userId) qs.set('userId', userId);
    if (orgId) qs.set('orgId', orgId);
    if (branchId) qs.set('branchId', branchId);
    return api<PagedResult<UserRoleDto>>(`/v1/user-roles?${qs}`);
  }, [userId ?? '', orgId ?? '', branchId ?? '', page, size]);
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  scopeOrgId?: string;
  scopeBranchId?: string;
}

export function assignRole(input: AssignRoleInput) {
  return api<UserRoleDto>('/v1/user-roles', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function revokeUserRole(
  userId: string,
  roleId: string,
  scopeOrgId?: string,
  scopeBranchId?: string
) {
  const qs = new URLSearchParams();
  if (scopeOrgId) qs.set('scopeOrgId', scopeOrgId);
  if (scopeBranchId) qs.set('scopeBranchId', scopeBranchId);
  const suffix = qs.toString();
  return api<void>(
    `/v1/user-roles/${userId}/${roleId}${suffix ? `?${suffix}` : ''}`,
    { method: 'DELETE' }
  );
}

// ─── Org members ────────────────────────────────────────────────────────────

export interface MemberDto {
  userId: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  branches: string[];
}

export function useOrgMembers(orgId: string = ORG_ID) {
  return useFetch<MemberDto[]>(
    () => api<MemberDto[]>(`/v1/orgs/${orgId}/members`),
    [orgId]
  );
}

// ─── Content (CMS) ─────────────────────────────────────────────────────────
// Backed by content-service. Org-scoped so the list spans every branch under
// the active org. UI may further narrow with an optional `branchId`.

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

export interface ContentPagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface UseContentPostsArgs {
  branchId?: string;
  type?: string;
  status?: string;
  q?: string;
  page?: number;
  size?: number;
}

export function useContentPosts(args: UseContentPostsArgs = {}) {
  const { branchId, type, status, q, page = 0, size = 20 } = args;
  return useFetch<ContentPagedResult<ContentPostListItem>>(() => {
    const params = new URLSearchParams({
      orgId: ORG_ID,
      page: String(page),
      size: String(size)
    });
    if (branchId) params.set('branchId', branchId);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (q && q.trim().length > 0) params.set('q', q.trim());
    return api<ContentPagedResult<ContentPostListItem>>(`/v1/content?${params}`);
  }, [branchId ?? '', type ?? '', status ?? '', q ?? '', page, size]);
}

export interface CreateContentPostInput {
  branchId?: string;
  type: 'article' | 'promotion' | 'event' | 'announcement' | 'seo';
  slug: string;
  title: Record<string, string>;
  excerpt?: Record<string, string>;
  body?: Record<string, string>;
  coverUrl?: string;
  tags?: string[];
  scheduledAt?: string;
}

export function createContentPost(input: CreateContentPostInput) {
  return api<unknown>('/v1/content', {
    method: 'POST',
    body: JSON.stringify({ orgId: ORG_ID, ...input })
  });
}
