-- Catalog refinement based on real Natural Beauty service master:
--
--   1. `uses_wax` and `uses_machine` flags — used by booking flow to show
--      "Wax/Máy" badges and to drive room/bed-type picking later.
--   2. `service_branch_prices` gains `branch_code` (per-branch SKU like
--      575: 3024, 625: 1024 for the same canonical service) and
--      `duration_min_override` for branch-specific timing.
--   3. Backfill duration overrides where the real data differs from the
--      org-level base value (e.g. Combo 10 buổi Mặt = 70 phút, not 30).
--
-- Note: the per-branch `branch_code` is what receptionists actually type at
-- the front desk. The org-level `services.code` remains the stable canonical
-- key used by analytics and APIs.

SET search_path TO catalog;

ALTER TABLE services
    ADD COLUMN IF NOT EXISTS uses_wax     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS uses_machine BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE service_branch_prices
    ADD COLUMN IF NOT EXISTS branch_code           VARCHAR(16),
    ADD COLUMN IF NOT EXISTS duration_min_override INT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_branch_prices_code
    ON service_branch_prices(branch_id, branch_code)
    WHERE branch_code IS NOT NULL;

-- ─── Wax / machine flags from the customer's real spreadsheet ───────────
-- Defaults: machine = true, wax = false. Set wax=true for the listed codes.
UPDATE services SET uses_wax = TRUE WHERE code IN (
    -- Men
    'male_underarm',
    -- Women — face / sensitive areas use wax
    'female_face', 'female_cheek', 'female_chin', 'female_sideburns', 'female_mustache',
    'female_underarm',
    'female_vio_part', 'female_vio_combo',
    'female_full_body',
    'female_combo10_face', 'female_combo10_vio', 'female_combo10_full_body',
    -- Combos always include both
    'male_vio_combo', 'male_full_body',
    'male_combo10_face', 'male_combo10_vio', 'male_combo10_full_body'
);

-- ─── Duration corrections (org-level base) — per the real list ──────────
UPDATE services SET duration_min = 70  WHERE code IN ('female_face', 'female_combo10_face');
UPDATE services SET duration_min = 30  WHERE code IN ('female_chin', 'female_cheek', 'female_sideburns', 'female_arm_lower_hand');
UPDATE services SET duration_min = 50  WHERE code IN ('female_combo10_vio');
UPDATE services SET duration_min = 45  WHERE code IN ('female_vio_combo');
UPDATE services SET duration_min = 30  WHERE code IN ('female_thigh_upper_knee', 'female_calf_foot');
UPDATE services SET duration_min = 90  WHERE code IN ('beauty_set_3_vip');
UPDATE services SET duration_min = 30  WHERE code IN ('beauty_yomogi_steam');

UPDATE services SET duration_min = 20  WHERE code = 'male_underarm';
UPDATE services SET duration_min = 40  WHERE code = 'male_vio_part';

-- ─── Seed branch-code mapping ───────────────────────────────────────────
-- 575 Kim Mã: 3xxx codes; 625 Kim Mã: 1xxx (women & beauty) and 2xxx (men).
-- Caller must compute the correct branch UUID; here we insert by (org, code)
-- pair so it works regardless of which dev seed branch UUID is used.
DO $$
DECLARE
    nb_tenant UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    nb_org    UUID := uuid_generate_v5(nb_tenant, 'org:natural-beauty');
    branch_575 UUID := uuid_generate_v5(nb_tenant, 'nb-kim-ma-575');
    branch_625 UUID := uuid_generate_v5(nb_tenant, 'nb-kim-ma-625');

    -- mapping: (service_code, code_575, code_625, price)
    rec RECORD;
BEGIN
    FOR rec IN SELECT * FROM (VALUES
        -- women
        ('female_face',              '3013', '1001', 1500000),
        ('female_mustache',          NULL,   '1002', 500000),
        ('female_cheek',             NULL,   '1003', 500000),
        ('female_chin',              '3014', '1004', 500000),
        ('female_sideburns',         NULL,   '1005', 500000),
        ('female_arm_lower_hand',    '3015', '1006', 200000),
        ('female_arm_upper',         NULL,   '1007', 150000),
        ('female_underarm',          '3016', '1008', 20000),
        ('female_chest',             NULL,   '1009', 150000),
        ('female_belly',             '3017', '1010', 150000),
        ('female_navel_around',      NULL,   '1011', 150000),
        ('female_back',              '3018', '1012', 150000),
        ('female_lower_back',        '3007', '1013', 150000),
        ('female_butt',              '3019', '1014', 150000),
        ('female_vio_part',          '3008', '1015', 300000),
        ('female_vio_combo',         '3020', '1016', 600000),
        ('female_thigh_upper_knee',  '3009', '1017', 150000),
        ('female_calf_foot',         '3021', '1018', 200000),
        ('female_full_body',         '3010', '1019', 1000000),
        ('female_nape',              '3012', NULL,   200000),
        ('female_combo10_face',      '3011', '1025', 12000000),
        ('female_combo10_vio',       '3022', '1024', 5400000),
        ('female_combo10_full_body', '3023', '1026', 8000000),
        -- beauty
        ('beauty_intimate_care',     NULL,   '1020', 300000),
        ('beauty_skin_rejuvenation', NULL,   '1021', 300000),
        ('beauty_yomogi_steam',      NULL,   '1022', 500000),
        ('beauty_set_3_vip',         NULL,   '1023', 2100000),
        -- men (575 has 3024-3026 partial, 625 has 2001-2010)
        ('male_arm_upper',           '3024', '2001', 250000),
        ('male_arm_lower_hand',      NULL,   '2002', 300000),
        ('male_underarm',            '3025', '2003', 50000),
        ('male_chest',               NULL,   '2004', 250000),
        ('male_belly',               '3026', '2005', 250000),
        ('male_navel_around',        NULL,   '2006', 250000),
        ('male_back',                NULL,   '2007', 250000),
        ('male_lower_back',          NULL,   '2008', 250000),
        ('male_butt',                NULL,   '2009', 250000),
        ('male_vio_part',            NULL,   '2010', 500000)
    ) AS t(service_code, code_575, code_625, price)
    LOOP
        IF rec.code_575 IS NOT NULL THEN
            INSERT INTO service_branch_prices (service_id, branch_id, price, branch_code)
            SELECT s.id, branch_575, rec.price, rec.code_575
            FROM services s WHERE s.org_id = nb_org AND s.code = rec.service_code
            ON CONFLICT (service_id, branch_id) DO UPDATE
                SET branch_code = EXCLUDED.branch_code, price = EXCLUDED.price;
        END IF;
        IF rec.code_625 IS NOT NULL THEN
            INSERT INTO service_branch_prices (service_id, branch_id, price, branch_code)
            SELECT s.id, branch_625, rec.price, rec.code_625
            FROM services s WHERE s.org_id = nb_org AND s.code = rec.service_code
            ON CONFLICT (service_id, branch_id) DO UPDATE
                SET branch_code = EXCLUDED.branch_code, price = EXCLUDED.price;
        END IF;
    END LOOP;
END $$;
