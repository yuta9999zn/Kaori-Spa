-- Match the customer's real "DATA KH" Excel sheet format:
--   * Customer code follows pattern: YY + 'D' + month1d + nationality1d + seq3
--     e.g. 24D11001 = year 2024, January (first visit month), nationality 1 (VN), seq 001
--   * Bilingual labels (VN+JP) are handled at API layer via locale.
--   * Nickname column for Japanese-style names (Akari, Nao, Aki).
--   * Nationality enum: VN, JP, KR, OTHER (mapped to 1/2/3/4 in code).

SET search_path TO customer;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS nickname VARCHAR(64),
    ADD COLUMN IF NOT EXISTS nationality VARCHAR(8) NOT NULL DEFAULT 'VN'
        CHECK (nationality IN ('VN','JP','KR','OTHER')),
    ADD COLUMN IF NOT EXISTS first_visit_month SMALLINT
        CHECK (first_visit_month BETWEEN 1 AND 12);

CREATE INDEX IF NOT EXISTS idx_customers_nationality ON customers(org_id, nationality);

-- Per-(org, year, month, nationality) sequence for code generation.
CREATE TABLE customer_code_seq (
    org_id          UUID NOT NULL,
    year            SMALLINT NOT NULL,
    month           SMALLINT NOT NULL,
    nationality_idx SMALLINT NOT NULL,
    last_seq        INT NOT NULL DEFAULT 0,
    PRIMARY KEY (org_id, year, month, nationality_idx)
);

CREATE OR REPLACE FUNCTION next_customer_code(
    p_org UUID, p_year SMALLINT, p_month SMALLINT, p_nationality VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    n_idx SMALLINT;
    n_seq INT;
BEGIN
    n_idx := CASE p_nationality
        WHEN 'VN'    THEN 1
        WHEN 'JP'    THEN 2
        WHEN 'KR'    THEN 3
        ELSE              4
    END;

    INSERT INTO customer_code_seq (org_id, year, month, nationality_idx, last_seq)
    VALUES (p_org, p_year, p_month, n_idx, 1)
    ON CONFLICT (org_id, year, month, nationality_idx)
        DO UPDATE SET last_seq = customer_code_seq.last_seq + 1
        RETURNING last_seq INTO n_seq;

    RETURN to_char(p_year % 100, 'FM00')
        || 'D'
        || p_month::TEXT
        || n_idx::TEXT
        || lpad(n_seq::TEXT, 3, '0');
END $$ LANGUAGE plpgsql;
