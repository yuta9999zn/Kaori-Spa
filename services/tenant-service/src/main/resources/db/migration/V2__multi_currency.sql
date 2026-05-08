-- Multi-currency: each organization picks its primary currency at onboarding,
-- exchange rates are versioned by date so historical bookings can be
-- displayed in any other currency.
--
-- Defaults: VND (Vietnam) base. Foreign tenants pick JPY, USD, KRW, etc.
-- Conversion is informational only — bookings + payments persist in the
-- org's primary currency to avoid rounding drift.

SET search_path TO tenant;

CREATE TABLE currencies (
    code         CHAR(3) PRIMARY KEY,
    name         VARCHAR(64) NOT NULL,
    symbol       VARCHAR(8) NOT NULL,
    decimals     SMALLINT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO currencies (code, name, symbol, decimals) VALUES
    ('VND', 'Vietnamese Dong', '₫', 0),
    ('JPY', 'Japanese Yen',     '¥', 0),
    ('KRW', 'Korean Won',       '₩', 0),
    ('USD', 'US Dollar',        '$', 2),
    ('CNY', 'Chinese Yuan',     '¥', 2),
    ('EUR', 'Euro',             '€', 2),
    ('THB', 'Thai Baht',        '฿', 2)
ON CONFLICT DO NOTHING;

-- Per-day conversion rates (base = VND so 1 unit of `code` = `rate` VND).
CREATE TABLE exchange_rates (
    base_code    CHAR(3) NOT NULL DEFAULT 'VND',
    code         CHAR(3) NOT NULL REFERENCES currencies(code),
    as_of        DATE NOT NULL,
    rate         NUMERIC(15, 6) NOT NULL,
    PRIMARY KEY (base_code, code, as_of)
);

INSERT INTO exchange_rates (base_code, code, as_of, rate) VALUES
    ('VND', 'JPY', CURRENT_DATE, 0.0061),    -- 1 VND ≈ 0.006 JPY
    ('VND', 'KRW', CURRENT_DATE, 0.054),
    ('VND', 'USD', CURRENT_DATE, 0.000040),
    ('VND', 'CNY', CURRENT_DATE, 0.000292),
    ('VND', 'EUR', CURRENT_DATE, 0.000037),
    ('VND', 'THB', CURRENT_DATE, 0.001432),
    ('VND', 'VND', CURRENT_DATE, 1)
ON CONFLICT DO NOTHING;

-- Add primary_currency to organizations.
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS primary_currency CHAR(3) NOT NULL DEFAULT 'VND'
        REFERENCES currencies(code);
