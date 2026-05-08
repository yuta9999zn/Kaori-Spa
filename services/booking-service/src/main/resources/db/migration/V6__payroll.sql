-- Payroll: hoa hồng theo booking_item + tổng lương theo tháng.
--
-- Workflow:
--   1. Khi BookingItem chuyển status=done → tạo staff_commissions row.
--   2. Job nightly tổng hợp salary_records cho tháng (open period).
--   3. Manager khoá kỳ lương (status=settled).
--
-- Đơn giản: hoa hồng = item.price * commission_rate.
-- Có thể nâng cấp: bậc thang theo doanh số, override theo dịch vụ, v.v.

SET search_path TO booking;

-- Cấu hình hoa hồng cấp staff (override) hoặc cấp branch (default).
CREATE TABLE staff_commission_rates (
    staff_id        UUID PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
    rate            NUMERIC(5,4) NOT NULL,    -- 0.0500 = 5%
    base_salary     NUMERIC(15,2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE branch_commission_defaults (
    branch_id       UUID PRIMARY KEY,
    rate            NUMERIC(5,4) NOT NULL DEFAULT 0.05,
    base_salary     NUMERIC(15,2) NOT NULL DEFAULT 5000000,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Một row / booking_item / staff. Ghi tại thời điểm item.done.
CREATE TABLE staff_commissions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    branch_id         UUID NOT NULL,
    staff_id          UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    booking_id        UUID NOT NULL,
    booking_item_id   UUID NOT NULL UNIQUE,
    service_code      VARCHAR(64) NOT NULL,
    service_name      JSONB NOT NULL,
    item_price        NUMERIC(15,2) NOT NULL,
    rate              NUMERIC(5,4) NOT NULL,
    commission_amount NUMERIC(15,2) NOT NULL,
    earned_at         TIMESTAMPTZ NOT NULL,
    settled_at        TIMESTAMPTZ,
    period            VARCHAR(7),               -- YYYY-MM khi đã chốt
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commissions_staff_period ON staff_commissions(staff_id, period);
CREATE INDEX idx_commissions_branch_earned ON staff_commissions(branch_id, earned_at DESC);

-- Tổng hợp lương theo tháng (snapshot).
CREATE TABLE salary_records (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    branch_id         UUID NOT NULL,
    staff_id          UUID NOT NULL REFERENCES staff(id),
    period            VARCHAR(7) NOT NULL,      -- YYYY-MM
    base_salary       NUMERIC(15,2) NOT NULL DEFAULT 0,
    commission_total  NUMERIC(15,2) NOT NULL DEFAULT 0,
    bonus             NUMERIC(15,2) NOT NULL DEFAULT 0,
    deduction         NUMERIC(15,2) NOT NULL DEFAULT 0,
    days_worked       INT NOT NULL DEFAULT 0,
    days_off          INT NOT NULL DEFAULT 0,
    days_late         INT NOT NULL DEFAULT 0,
    minutes_worked    INT NOT NULL DEFAULT 0,
    net               NUMERIC(15,2) NOT NULL DEFAULT 0,
    status            VARCHAR(16) NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','locked','paid')),
    locked_at         TIMESTAMPTZ,
    locked_by         UUID,
    paid_at           TIMESTAMPTZ,
    note              TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uniq_salary_staff_period UNIQUE (staff_id, period)
);
CREATE INDEX idx_salary_branch_period ON salary_records(branch_id, period);
