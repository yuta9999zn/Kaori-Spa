-- Track each user's most recent successful login.
-- Populated by SessionService on every initial login (NOT on token rotation).
-- Surfaced by the tenant-admin /members page and is useful for inactive-user
-- cleanup heuristics later.

SET search_path TO auth;

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login DESC);
