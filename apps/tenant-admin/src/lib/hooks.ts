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
