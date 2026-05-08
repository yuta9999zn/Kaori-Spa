'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, ctx } from './api';

/** Default tenant id for the tenant-admin portal. Mirrors org-admin's ORG_ID pattern. */
export const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID ?? '00000000-0000-0000-0000-000000000000';

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

// ─── Organizations (a.k.a. tenants in tenant-admin UI) ─────────────────────

export interface OrgDto {
  id: string;
  tenantId: string;
  code: string;
  name: Record<string, string>;
  slug: string;
  primaryLocale: string;
}

export interface CreateOrgInput {
  code: string;
  slug: string;
  nameVi: string;
  primaryLocale?: string;
}

/** GET /v1/orgs — list all organizations under the current tenant. */
export function useOrgs() {
  return useFetch<OrgDto[]>(() => api<OrgDto[]>('/v1/orgs'));
}

export function createOrg(input: CreateOrgInput) {
  return api<OrgDto>('/v1/orgs', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

// ─── Campaigns (notification-service) ──────────────────────────────────────

export interface CampaignDto {
  id: string;
  name: string;
  channel: 'sms' | 'email' | 'inapp' | 'push';
  templateCode: string;
  status: 'draft' | 'scheduled' | 'running' | 'done' | 'cancelled' | 'failed';
  scheduledAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

/** GET /v1/campaigns?tenantId=… — list campaigns for the current tenant. */
export function useCampaigns(tenantId?: string) {
  const tid = tenantId ?? ctx.tenantId;
  return useFetch<CampaignDto[]>(
    () => api<CampaignDto[]>(`/v1/campaigns?tenantId=${tid}`),
    [tid]
  );
}

export function createCampaign(input: {
  name: string;
  channel: 'sms' | 'email' | 'inapp' | 'push';
  templateCode: string;
  segmentFilter?: Record<string, unknown>;
  scheduledAt: string;
  tenantId?: string;
}) {
  return api<string>('/v1/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      tenantId: input.tenantId ?? ctx.tenantId,
      name: input.name,
      channel: input.channel,
      templateCode: input.templateCode,
      segmentFilter: input.segmentFilter ?? {},
      scheduledAt: input.scheduledAt
    })
  });
}

export function cancelCampaign(id: string) {
  return api<void>(`/v1/campaigns/${id}/cancel`, { method: 'POST' });
}

// ─── Tenant overview (composed from /v1/orgs) ──────────────────────────────
//
// Branch-count / user-count / MRR endpoints are not yet implemented at the
// platform-admin level. We expose what we have today (org count) and let the
// dashboard show TODO placeholders for the rest.

export interface TenantOverview {
  orgCount: number;
  orgs: OrgDto[];
}

export function useTenantOverview() {
  return useFetch<TenantOverview>(async () => {
    const orgs = await api<OrgDto[]>('/v1/orgs');
    return { orgCount: orgs.length, orgs };
  });
}

// ─── Audit events (tenant-service mirror of kaori.audit.event.v1) ──────────

export interface AuditEventDto {
  id: string;
  ts: string;
  tenantId: string | null;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
}

export interface AuditPagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface UseAuditEventsArgs {
  tenantId?: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export function useAuditEvents(args: UseAuditEventsArgs = {}) {
  const { tenantId, actorId, action, entityType, from, to, page = 0, size = 20 } = args;
  return useFetch<AuditPagedResult<AuditEventDto>>(() => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size)
    });
    if (tenantId) params.set('tenantId', tenantId);
    if (actorId) params.set('actorId', actorId);
    if (action && action.trim().length > 0) params.set('action', action.trim());
    if (entityType && entityType.trim().length > 0) params.set('entityType', entityType.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return api<AuditPagedResult<AuditEventDto>>(`/v1/audit-events?${params}`);
  }, [tenantId ?? '', actorId ?? '', action ?? '', entityType ?? '', from ?? '', to ?? '', page, size]);
}

// ─── Tenant domain config (tenant-service /v1/tenants/{id}/domain) ─────────

export interface DomainConfigDto {
  tenantId: string;
  subdomain: string;
  customDomain: string | null;
  sslStatus: string | null;
  sslExpiresAt: string | null;
  forceHttps: boolean;
  redirectOldUrl: boolean;
  requireLogin: boolean;
  updatedAt: string | null;
}

export interface DomainConfigInput {
  subdomain: string;
  customDomain?: string | null;
  sslStatus?: string | null;
  sslExpiresAt?: string | null;
  forceHttps?: boolean;
  redirectOldUrl?: boolean;
  requireLogin?: boolean;
}

export function useDomainConfig(tenantId: string = TENANT_ID) {
  return useFetch<DomainConfigDto>(
    () => api<DomainConfigDto>(`/v1/tenants/${tenantId}/domain`),
    [tenantId]
  );
}

export function saveDomainConfig(tenantId: string, input: DomainConfigInput) {
  return api<DomainConfigDto>(`/v1/tenants/${tenantId}/domain`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

// ─── Tenant branding (tenant-service /v1/tenants/{id}/branding) ────────────

export interface BrandingDto {
  tenantId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  loginWelcome: Record<string, string> | null;
  bookingTagline: Record<string, string> | null;
  emailLogoUrl: string | null;
  emailHeaderBg: string | null;
  emailFooter: Record<string, string> | null;
  updatedAt: string | null;
}

export interface BrandingInput {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  loginWelcome?: Record<string, string> | null;
  bookingTagline?: Record<string, string> | null;
  emailLogoUrl?: string | null;
  emailHeaderBg?: string | null;
  emailFooter?: Record<string, string> | null;
}

export function useBranding(tenantId: string = TENANT_ID) {
  return useFetch<BrandingDto>(
    () => api<BrandingDto>(`/v1/tenants/${tenantId}/branding`),
    [tenantId]
  );
}

export function saveBranding(tenantId: string, input: BrandingInput) {
  return api<BrandingDto>(`/v1/tenants/${tenantId}/branding`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

// ─── Tenant feature flags (tenant-service /v1/tenants/{id}/features) ───────

export interface FeatureFlagDto {
  tenantId: string;
  moduleKey: string;
  enabled: boolean;
  /** BE serializes JsonProperty `premium` as `premium` (record accessor `premium()`).
   *  We keep both names in the type so either response shape is tolerated. */
  premium?: boolean;
  isPremium?: boolean;
  configured?: boolean;
  activatedAt: string | null;
}

export function useFeatures(tenantId: string = TENANT_ID) {
  return useFetch<FeatureFlagDto[]>(
    () => api<FeatureFlagDto[]>(`/v1/tenants/${tenantId}/features`),
    [tenantId]
  );
}

export function toggleFeature(tenantId: string, moduleKey: string, enabled: boolean) {
  return api<FeatureFlagDto>(`/v1/tenants/${tenantId}/features/${moduleKey}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled })
  });
}

// ─── Tenant-wide members (auth-service /v1/members) ────────────────────────

export interface TenantMemberDto {
  userId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  roles: string[];
  branches: string[];
  lastLogin: string | null;
}

export interface MembersPagedResult {
  items: TenantMemberDto[];
  page: number;
  size: number;
  total: number;
}

export interface UseMembersArgs {
  tenantId?: string;
  q?: string;
  status?: string;
  page?: number;
  size?: number;
}

export function useMembers(args: UseMembersArgs = {}) {
  const tid = args.tenantId ?? ctx.tenantId;
  const { q, status, page = 0, size = 20 } = args;
  return useFetch<MembersPagedResult>(() => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (tid) params.set('tenantId', tid);
    if (q && q.trim().length > 0) params.set('q', q.trim());
    if (status && status.trim().length > 0) params.set('status', status.trim());
    return api<MembersPagedResult>(`/v1/members?${params}`);
  }, [tid, q ?? '', status ?? '', page, size]);
}

// ─── Platform overview (tenant-service /v1/platform/overview) ──────────────

export interface PlatformTenantSummary {
  id: string;
  name: string;
  code: string;
  orgCount: number;
  branchCount: number;
  createdAt: string;
}

export interface PlatformOverviewDto {
  tenantCount: number;
  orgCount: number;
  branchCount: number;
  userCount: number;
  /** Currently always 0 — booking-service tenant-scoped read not implemented yet. */
  activeTenantsLast30d: number;
  recentTenants: PlatformTenantSummary[];
}

export function usePlatformOverview() {
  return useFetch<PlatformOverviewDto>(
    () => api<PlatformOverviewDto>('/v1/platform/overview')
  );
}

// ─── Webhooks (notification-service /v1/webhooks) ──────────────────────────

export interface WebhookDto {
  id: string;
  name: string;
  targetUrl: string;
  eventFilters: string[];
  active: boolean;
  createdAt: string;
}

export function useWebhooks(tenantId: string = TENANT_ID) {
  return useFetch<WebhookDto[]>(
    () => api<WebhookDto[]>(`/v1/webhooks?tenantId=${tenantId}`),
    [tenantId]
  );
}

export function toggleWebhook(id: string) {
  return api<void>(`/v1/webhooks/${id}/toggle`, { method: 'POST' });
}

// ─── Onboarding (tenant-service /v1/tenants/{id}/onboarding) ───────────────

/** Canonical onboarding step order. */
export const ONBOARDING_STEPS = ['welcome', 'org', 'branch', 'team', 'done'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingState {
  tenantId: string;
  currentStep: string;
  completedSteps: string[];
  startedAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

export function useOnboarding(tenantId: string = TENANT_ID) {
  return useFetch<OnboardingState>(
    () => api<OnboardingState>(`/v1/tenants/${tenantId}/onboarding`),
    [tenantId]
  );
}

export function advanceOnboarding(
  tenantId: string,
  step: string,
  metadata?: Record<string, unknown>
) {
  return api<OnboardingState>(`/v1/tenants/${tenantId}/onboarding/advance`, {
    method: 'POST',
    body: JSON.stringify({ step, metadata: metadata ?? {} })
  });
}

export function completeOnboarding(tenantId: string) {
  return api<OnboardingState>(`/v1/tenants/${tenantId}/onboarding/complete`, {
    method: 'POST'
  });
}
