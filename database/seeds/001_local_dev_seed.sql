-- Canonical JS seed is in backend/prisma/seed.js
-- This SQL file intentionally stays minimal and safe for ad-hoc local smoke testing.

INSERT INTO plans (code, name, description, interval, price_cents, currency, is_active)
VALUES
  ('FREE', 'Free', 'Ad-supported baseline access', 'MONTHLY', 0, 'USD', TRUE),
  ('PLUS_MONTHLY', 'CloudTune Plus Monthly', 'Premium monthly access', 'MONTHLY', 999, 'USD', TRUE)
ON CONFLICT (code) DO NOTHING;
