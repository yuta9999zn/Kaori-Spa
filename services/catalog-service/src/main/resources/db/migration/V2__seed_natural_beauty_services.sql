-- Seed catalog with the real Natural Beauty price list (mirror of
-- /docs/pricing.md). Each service is keyed by `code` so backend and
-- frontend stay in sync.

SET search_path TO catalog;

DO $$
DECLARE
    nb_tenant UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    nb_org    UUID := uuid_generate_v5(nb_tenant, 'org:natural-beauty');
    cat_male_face UUID; cat_male_body UUID;
    cat_female_face UUID; cat_female_body UUID; cat_beauty UUID;
BEGIN
    PERFORM 1 FROM pg_extension WHERE extname = 'uuid-ossp';
    IF NOT FOUND THEN EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'; END IF;

    INSERT INTO service_categories (tenant_id, org_id, code, name, sort_order)
    VALUES
        (nb_tenant, nb_org, 'male_face',   '{"vi":"Triệt lông Mặt - Nam","en":"Men Face","ja":"メンズ顔"}'::jsonb, 1),
        (nb_tenant, nb_org, 'male_body',   '{"vi":"Triệt lông Cơ thể - Nam","en":"Men Body","ja":"メンズ体"}'::jsonb, 2),
        (nb_tenant, nb_org, 'female_face', '{"vi":"Triệt lông Mặt - Nữ","en":"Women Face","ja":"レディース顔"}'::jsonb, 3),
        (nb_tenant, nb_org, 'female_body', '{"vi":"Triệt lông Cơ thể - Nữ","en":"Women Body","ja":"レディース体"}'::jsonb, 4),
        (nb_tenant, nb_org, 'beauty',      '{"vi":"Làm đẹp","en":"Beauty","ja":"美容"}'::jsonb, 5)
    ON CONFLICT DO NOTHING;

    SELECT id INTO cat_male_face   FROM service_categories WHERE org_id = nb_org AND code = 'male_face';
    SELECT id INTO cat_male_body   FROM service_categories WHERE org_id = nb_org AND code = 'male_body';
    SELECT id INTO cat_female_face FROM service_categories WHERE org_id = nb_org AND code = 'female_face';
    SELECT id INTO cat_female_body FROM service_categories WHERE org_id = nb_org AND code = 'female_body';
    SELECT id INTO cat_beauty      FROM service_categories WHERE org_id = nb_org AND code = 'beauty';

    -- ─── MEN ──
    INSERT INTO services (tenant_id, org_id, code, name, category_id, gender, region, duration_min, base_price, is_combo, sessions) VALUES
    (nb_tenant, nb_org, 'male_arm_upper',         '{"vi":"Triệt Bắp Tay (Nam)","en":"Upper Arm (Men)"}'::jsonb,           cat_male_body, 'male','arm', 30, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_arm_lower_hand',    '{"vi":"Triệt Cẳng Tay Và Bàn Tay (Nam)","en":"Forearm & Hand (Men)"}'::jsonb, cat_male_body, 'male','arm', 40, 300000, FALSE, 1),
    (nb_tenant, nb_org, 'male_underarm',          '{"vi":"Triệt Nách (Nam)","en":"Underarm (Men)"}'::jsonb,               cat_male_body, 'male','arm', 15,  50000, FALSE, 1),
    (nb_tenant, nb_org, 'male_chest',             '{"vi":"Triệt Ngực (Nam)","en":"Chest (Men)"}'::jsonb,                  cat_male_body, 'male','chest', 30, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_belly',             '{"vi":"Triệt Bụng (Nam)","en":"Belly (Men)"}'::jsonb,                   cat_male_body, 'male','belly', 30, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_navel_around',      '{"vi":"Triệt Quanh Rốn (Nam)","en":"Navel (Men)"}'::jsonb,             cat_male_body, 'male','belly', 20, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_back',              '{"vi":"Triệt Lưng (Nam)","en":"Back (Men)"}'::jsonb,                    cat_male_body, 'male','back', 40, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_lower_back',        '{"vi":"Triệt Thắt Lưng (Nam)","en":"Lower Back (Men)"}'::jsonb,        cat_male_body, 'male','back', 30, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_butt',              '{"vi":"Triệt Mông (Nam)","en":"Buttocks (Men)"}'::jsonb,                cat_male_body, 'male','back', 30, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_vio_part',          '{"vi":"Triệt V-I-O Từng Vùng (Nam)","en":"V-I-O Per Area (Men)"}'::jsonb, cat_male_body, 'male','vio', 30, 500000, FALSE, 1),
    (nb_tenant, nb_org, 'male_vio_combo',         '{"vi":"Triệt V-I-O Combo (Nam)","en":"V-I-O Combo (Men)"}'::jsonb,     cat_male_body, 'male','vio', 60, 1000000, TRUE, 1),
    (nb_tenant, nb_org, 'male_thigh_upper_knee',  '{"vi":"Triệt Đùi Trên Đầu Gối (Nam)","en":"Upper Thigh (Men)"}'::jsonb, cat_male_body, 'male','leg', 40, 250000, FALSE, 1),
    (nb_tenant, nb_org, 'male_calf_foot',         '{"vi":"Triệt Bắp Chân Và Bàn Chân (Nam)","en":"Calf & Foot (Men)"}'::jsonb, cat_male_body, 'male','leg', 40, 300000, FALSE, 1),
    (nb_tenant, nb_org, 'male_full_body',         '{"vi":"Triệt Toàn Thân (Nam)","en":"Full Body (Men)"}'::jsonb,         cat_male_body, 'male','full_body', 120, 1600000, TRUE, 1),
    (nb_tenant, nb_org, 'male_combo10_vio',       '{"vi":"Combo 10 Buổi VIO (Nam)","en":"10x VIO Combo (Men)"}'::jsonb,    cat_male_body, 'male','vio', 60, 9000000, TRUE, 10),
    (nb_tenant, nb_org, 'male_combo10_face',      '{"vi":"Combo 10 Buổi Mặt (Nam)","en":"10x Face Combo (Men)"}'::jsonb,   cat_male_face, 'male','face', 30, 15000000, TRUE, 10),
    (nb_tenant, nb_org, 'male_combo10_full_body', '{"vi":"Combo 10 Buổi Toàn Thân (Nam)","en":"10x Full Body Combo (Men)"}'::jsonb, cat_male_body, 'male','full_body', 120, 15000000, TRUE, 10),
    (nb_tenant, nb_org, 'male_mustache',          '{"vi":"Triệt Ria Mép (Nam)","en":"Mustache (Men)"}'::jsonb,            cat_male_face, 'male','face', 15, 600000, FALSE, 1),
    (nb_tenant, nb_org, 'male_face',              '{"vi":"Triệt Mặt (Nam)","en":"Face (Men)"}'::jsonb,                     cat_male_face, 'male','face', 30, 1600000, FALSE, 1),
    (nb_tenant, nb_org, 'male_cheek',             '{"vi":"Triệt Má (Nam)","en":"Cheek (Men)"}'::jsonb,                     cat_male_face, 'male','face', 20, 600000, FALSE, 1),
    (nb_tenant, nb_org, 'male_chin',              '{"vi":"Triệt Cằm (Nam)","en":"Chin (Men)"}'::jsonb,                     cat_male_face, 'male','face', 15, 600000, FALSE, 1),
    (nb_tenant, nb_org, 'male_sideburns',         '{"vi":"Triệt Mai Tóc (Nam)","en":"Sideburns (Men)"}'::jsonb,           cat_male_face, 'male','face', 20, 600000, FALSE, 1),
    (nb_tenant, nb_org, 'male_nape',              '{"vi":"Triệt Lông Sau Gáy (Nam)","en":"Nape (Men)"}'::jsonb,           cat_male_face, 'male','face', 20, 300000, FALSE, 1);

    -- ─── WOMEN ──
    INSERT INTO services (tenant_id, org_id, code, name, category_id, gender, region, duration_min, base_price, is_combo, sessions) VALUES
    (nb_tenant, nb_org, 'female_mustache',         '{"vi":"Triệt Ria Mép (Nữ)","en":"Mustache (Women)"}'::jsonb,             cat_female_face, 'female','face', 15, 500000, FALSE, 1),
    (nb_tenant, nb_org, 'female_face',             '{"vi":"Triệt Mặt (Nữ)","en":"Face (Women)"}'::jsonb,                      cat_female_face, 'female','face', 30, 1500000, FALSE, 1),
    (nb_tenant, nb_org, 'female_cheek',            '{"vi":"Triệt Má (Nữ)","en":"Cheek (Women)"}'::jsonb,                      cat_female_face, 'female','face', 20, 500000, FALSE, 1),
    (nb_tenant, nb_org, 'female_chin',             '{"vi":"Triệt Cằm (Nữ)","en":"Chin (Women)"}'::jsonb,                      cat_female_face, 'female','face', 15, 500000, FALSE, 1),
    (nb_tenant, nb_org, 'female_sideburns',        '{"vi":"Triệt Mai Tóc (Nữ)","en":"Sideburns (Women)"}'::jsonb,            cat_female_face, 'female','face', 20, 500000, FALSE, 1),
    (nb_tenant, nb_org, 'female_nape',             '{"vi":"Triệt Lông Sau Gáy (Nữ)","en":"Nape (Women)"}'::jsonb,            cat_female_face, 'female','face', 20, 200000, FALSE, 1),
    (nb_tenant, nb_org, 'female_arm_lower_hand',   '{"vi":"Triệt Cẳng Tay Và Bàn Tay (Nữ)","en":"Forearm & Hand (Women)"}'::jsonb, cat_female_body, 'female','arm', 40, 200000, FALSE, 1),
    (nb_tenant, nb_org, 'female_arm_upper',        '{"vi":"Triệt Bắp Tay (Nữ)","en":"Upper Arm (Women)"}'::jsonb,           cat_female_body, 'female','arm', 30, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_underarm',         '{"vi":"Triệt Nách (Nữ)","en":"Underarm (Women)"}'::jsonb,                cat_female_body, 'female','arm', 15,  20000, FALSE, 1),
    (nb_tenant, nb_org, 'female_chest',            '{"vi":"Triệt Ngực (Nữ)","en":"Chest (Women)"}'::jsonb,                    cat_female_body, 'female','chest', 30, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_belly',            '{"vi":"Triệt Bụng (Nữ)","en":"Belly (Women)"}'::jsonb,                    cat_female_body, 'female','belly', 30, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_navel_around',     '{"vi":"Triệt Quanh Rốn (Nữ)","en":"Navel (Women)"}'::jsonb,              cat_female_body, 'female','belly', 20, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_back',             '{"vi":"Triệt Lưng (Nữ)","en":"Back (Women)"}'::jsonb,                     cat_female_body, 'female','back', 40, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_lower_back',       '{"vi":"Triệt Thắt Lưng (Nữ)","en":"Lower Back (Women)"}'::jsonb,         cat_female_body, 'female','back', 30, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_butt',             '{"vi":"Triệt Mông (Nữ)","en":"Buttocks (Women)"}'::jsonb,                 cat_female_body, 'female','back', 30, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_vio_part',         '{"vi":"Triệt V-I-O Từng Vùng (Nữ)","en":"V-I-O Per Area (Women)"}'::jsonb, cat_female_body, 'female','vio', 30, 300000, FALSE, 1),
    (nb_tenant, nb_org, 'female_vio_combo',        '{"vi":"Triệt V-I-O Combo (Nữ)","en":"V-I-O Combo (Women)"}'::jsonb,      cat_female_body, 'female','vio', 60, 600000, TRUE, 1),
    (nb_tenant, nb_org, 'female_thigh_upper_knee', '{"vi":"Triệt Đùi Trên Đầu Gối (Nữ)","en":"Upper Thigh (Women)"}'::jsonb, cat_female_body, 'female','leg', 40, 150000, FALSE, 1),
    (nb_tenant, nb_org, 'female_calf_foot',        '{"vi":"Triệt Bắp Chân Và Bàn Chân (Nữ)","en":"Calf & Foot (Women)"}'::jsonb, cat_female_body, 'female','leg', 40, 200000, FALSE, 1),
    (nb_tenant, nb_org, 'female_full_body',        '{"vi":"Triệt Toàn Thân (Nữ)","en":"Full Body (Women)"}'::jsonb,          cat_female_body, 'female','full_body', 120, 1000000, TRUE, 1),
    (nb_tenant, nb_org, 'female_combo10_vio',      '{"vi":"Combo 10 Buổi VIO (Nữ)","en":"10x VIO Combo (Women)"}'::jsonb,    cat_female_body, 'female','vio', 60, 5400000, TRUE, 10),
    (nb_tenant, nb_org, 'female_combo10_face',     '{"vi":"Combo 10 Buổi Mặt (Nữ)","en":"10x Face Combo (Women)"}'::jsonb,   cat_female_face, 'female','face', 30, 12000000, TRUE, 10),
    (nb_tenant, nb_org, 'female_combo10_full_body','{"vi":"Combo 10 Buổi Toàn Thân (Nữ)","en":"10x Full Body Combo (Women)"}'::jsonb, cat_female_body, 'female','full_body', 120, 8000000, TRUE, 10);

    -- ─── BEAUTY ──
    INSERT INTO services (tenant_id, org_id, code, name, category_id, gender, region, duration_min, base_price, is_combo, sessions) VALUES
    (nb_tenant, nb_org, 'beauty_intimate_care',     '{"vi":"Làm Đẹp Vùng Kín","en":"Intimate Care"}'::jsonb,            cat_beauty, 'unisex','beauty', 45, 300000,  FALSE, 1),
    (nb_tenant, nb_org, 'beauty_skin_rejuvenation', '{"vi":"Trẻ Hoá Da Bằng Công Nghệ Ánh Sáng","en":"Light Skin Rejuvenation"}'::jsonb, cat_beauty, 'unisex','beauty', 45, 300000,  FALSE, 1),
    (nb_tenant, nb_org, 'beauty_yomogi_steam',      '{"vi":"Xông Thảo Dược Yomogi","en":"Yomogi Herbal Steam"}'::jsonb, cat_beauty, 'unisex','beauty', 30, 500000,  FALSE, 1),
    (nb_tenant, nb_org, 'beauty_set_3_vip',         '{"vi":"Set Làm Đẹp 3 Dịch Vụ (VIP)","en":"3-Service Beauty Set (VIP)"}'::jsonb, cat_beauty, 'unisex','beauty', 120, 2100000, TRUE, 1);
END $$;
