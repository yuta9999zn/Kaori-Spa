-- Content service: bài viết, khuyến mãi, sự kiện, thông báo, SEO page.
-- Cấp độ: org-level (branch_id NULL) hoặc branch-specific (branch_id NOT NULL).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS content;
SET search_path TO content;

CREATE TABLE content_post (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    org_id        UUID NOT NULL,
    branch_id     UUID,                     -- null = org-level, set = branch-specific
    type          VARCHAR(32) NOT NULL CHECK (type IN ('article','promotion','event','announcement','seo')),
    slug          VARCHAR(160) NOT NULL,
    title         JSONB NOT NULL,            -- {"vi":"...","en":"..."}
    excerpt       JSONB,
    body          JSONB,
    status        VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled','archived')),
    published_at  TIMESTAMPTZ,
    scheduled_at  TIMESTAMPTZ,
    author_id     UUID,
    view_count    INT NOT NULL DEFAULT 0,
    seo_score     INT,
    cover_url     TEXT,
    tags          JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_content_post_org_slug ON content_post (tenant_id, org_id, slug);
CREATE INDEX idx_content_post_tenant_branch ON content_post (tenant_id, org_id, branch_id);
CREATE INDEX idx_content_post_type_status ON content_post (tenant_id, type, status);
