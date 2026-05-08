-- Seed Natural Beauty rooms/beds/staff for both Kim Mã branches.
--
-- Branch UUIDs are derived from tenant-service seed slug. Production
-- bootstrap should resolve real UUIDs; for dev/CI we use deterministic v5.

SET search_path TO booking;

DO $$
DECLARE
    nb_tenant   UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    branch_575  UUID := uuid_generate_v5(nb_tenant, 'nb-kim-ma-575');
    branch_625  UUID := uuid_generate_v5(nb_tenant, 'nb-kim-ma-625');
    r1 UUID; r2 UUID; r3 UUID; r4 UUID;
    s1 UUID; s2 UUID; s3 UUID; s4 UUID;
BEGIN
    PERFORM 1 FROM pg_extension WHERE extname = 'uuid-ossp';
    IF NOT FOUND THEN EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'; END IF;

    -- ─── Branch 575 — 3 rooms / 5 beds ──
    INSERT INTO rooms (tenant_id, branch_id, code, name, room_type, floor, capacity_beds)
    VALUES
        (nb_tenant, branch_575, 'P1', '{"vi":"Phòng 1","en":"Room 1"}'::jsonb,        'normal', 1, 2),
        (nb_tenant, branch_575, 'P2', '{"vi":"Phòng 2","en":"Room 2"}'::jsonb,        'normal', 1, 2),
        (nb_tenant, branch_575, 'VIP1','{"vi":"Phòng VIP 1","en":"VIP Room 1"}'::jsonb,'vip',  2, 1)
    RETURNING id INTO r1;

    SELECT id INTO r1 FROM rooms WHERE branch_id = branch_575 AND code = 'P1';
    SELECT id INTO r2 FROM rooms WHERE branch_id = branch_575 AND code = 'P2';
    SELECT id INTO r3 FROM rooms WHERE branch_id = branch_575 AND code = 'VIP1';

    INSERT INTO beds (tenant_id, branch_id, room_id, code, name, bed_type, status) VALUES
        (nb_tenant, branch_575, r1, 'G1A', '{"vi":"Giường 1A","en":"Bed 1A"}'::jsonb, 'standard', 'active'),
        (nb_tenant, branch_575, r1, 'G1B', '{"vi":"Giường 1B","en":"Bed 1B"}'::jsonb, 'standard', 'active'),
        (nb_tenant, branch_575, r2, 'G2A', '{"vi":"Giường 2A","en":"Bed 2A"}'::jsonb, 'laser',    'active'),
        (nb_tenant, branch_575, r2, 'G2B', '{"vi":"Giường 2B","en":"Bed 2B"}'::jsonb, 'laser',    'active'),
        (nb_tenant, branch_575, r3, 'GVIP','{"vi":"Giường VIP","en":"VIP Bed"}'::jsonb,'vip',    'active');

    -- ─── Branch 625 — 2 rooms / 3 beds ──
    INSERT INTO rooms (tenant_id, branch_id, code, name, room_type, floor, capacity_beds) VALUES
        (nb_tenant, branch_625, 'P1', '{"vi":"Phòng 1","en":"Room 1"}'::jsonb, 'normal', 1, 2),
        (nb_tenant, branch_625, 'VIP1','{"vi":"Phòng VIP","en":"VIP Room"}'::jsonb, 'vip', 2, 1);

    SELECT id INTO r4 FROM rooms WHERE branch_id = branch_625 AND code = 'P1';
    INSERT INTO beds (tenant_id, branch_id, room_id, code, name, bed_type, status) VALUES
        (nb_tenant, branch_625, r4, 'G1A', '{"vi":"Giường 1A","en":"Bed 1A"}'::jsonb, 'laser',    'active'),
        (nb_tenant, branch_625, r4, 'G1B', '{"vi":"Giường 1B","en":"Bed 1B"}'::jsonb, 'standard', 'active');
    SELECT id INTO r4 FROM rooms WHERE branch_id = branch_625 AND code = 'VIP1';
    INSERT INTO beds (tenant_id, branch_id, room_id, code, name, bed_type, status) VALUES
        (nb_tenant, branch_625, r4, 'GVIP', '{"vi":"Giường VIP","en":"VIP Bed"}'::jsonb, 'vip', 'active');

    -- ─── Staff ──
    INSERT INTO staff (tenant_id, branch_id, code, full_name, nickname, gender, role_in_branch) VALUES
        (nb_tenant, branch_575, 'NV-575-MIKO',  'Nguyễn Khánh Linh', 'miko',  'female', 'BRANCH_MANAGER'),
        (nb_tenant, branch_575, 'NV-575-YEN',   'Lê Thị Yến',        'yến',   'female', 'RECEPTIONIST'),
        (nb_tenant, branch_575, 'NV-575-MAI',   'Phạm Thị Mai',      'mai',   'female', 'THERAPIST'),
        (nb_tenant, branch_625, 'NV-625-HUONG', 'Nguyễn Lan Hương',  'hương', 'female', 'BRANCH_MANAGER'),
        (nb_tenant, branch_625, 'NV-625-LAN',   'Trần Thị Lan',      'lan',   'female', 'THERAPIST');

    -- Skills (Mai biết toàn bộ dịch vụ triệt; Lan biết VIO + làm đẹp).
    SELECT id INTO s3 FROM staff WHERE code = 'NV-575-MAI';
    SELECT id INTO s4 FROM staff WHERE code = 'NV-625-LAN';

    INSERT INTO staff_skills (staff_id, service_code, skill_level) VALUES
        (s3, 'female_combo10_vio',       5),
        (s3, 'female_vio_combo',         5),
        (s3, 'female_full_body',         4),
        (s3, 'female_face',              4),
        (s3, 'beauty_yomogi_steam',      3),
        (s4, 'female_vio_combo',         5),
        (s4, 'female_combo10_vio',       4),
        (s4, 'beauty_intimate_care',     5),
        (s4, 'beauty_skin_rejuvenation', 4);
END $$;
