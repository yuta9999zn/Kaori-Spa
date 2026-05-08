-- Service add-ons (upsell). Customers can opt to add small extras at booking
-- time — e.g. "essential oil massage +200K", "Yomogi steam +500K" — that
-- tack onto a base service.
--
-- Modeled separately from `services` because:
--   * They don't take up a separate slot on the schedule (run inside the
--     parent service's window).
--   * They're often "available with X but not Y", e.g. only with full-body.

SET search_path TO catalog;

CREATE TABLE addons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    org_id       UUID NOT NULL,
    code         VARCHAR(64) NOT NULL,
    name         JSONB NOT NULL,
    description  JSONB,
    price        NUMERIC(15, 2) NOT NULL,
    duration_min INT NOT NULL DEFAULT 0,        -- 0 means "no extra time, parallel"
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order   INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_addon_org_code ON addons(org_id, code);

-- Many-to-many: addons available with which services.
-- NULL row in service_id means "available with any service".
CREATE TABLE addon_compatibility (
    addon_id     UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    service_code VARCHAR(64),
    PRIMARY KEY (addon_id, service_code)
);

-- Seed common add-ons for Natural Beauty.
DO $$
DECLARE
    nb UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    org UUID := uuid_generate_v5(nb, 'org:natural-beauty');
BEGIN
    INSERT INTO addons (tenant_id, org_id, code, name, description, price, duration_min) VALUES
        (nb, org, 'addon_essential_oil',
         '{"vi":"Tinh dầu thư giãn","en":"Essential oil"}'::jsonb,
         '{"vi":"Tinh dầu lavender, oải hương — kéo dài thư giãn 10 phút","en":"Lavender essential oil, 10 extra minutes"}'::jsonb,
         200000, 10),
        (nb, org, 'addon_paraffin',
         '{"vi":"Paraffin tay/chân","en":"Paraffin hand/foot"}'::jsonb,
         '{"vi":"Sáp paraffin nóng làm mềm da","en":"Hot paraffin softens skin"}'::jsonb,
         150000, 0),
        (nb, org, 'addon_collagen_mask',
         '{"vi":"Mặt nạ collagen","en":"Collagen mask"}'::jsonb,
         '{"vi":"Mặt nạ collagen Hàn Quốc, làm dịu da sau triệt","en":"Korean collagen mask, soothes after laser"}'::jsonb,
         180000, 15);
END $$;

-- Booking item gains an "add_on_codes" array + add_on_total — the booking
-- service writes both at create time.
SET search_path TO booking;

ALTER TABLE booking_items
    ADD COLUMN IF NOT EXISTS add_on_codes  TEXT[]        NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS add_on_total  NUMERIC(15,2) NOT NULL DEFAULT 0;
