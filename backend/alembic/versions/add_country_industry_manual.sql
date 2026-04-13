-- Run this on your database if you get 500 when loading/saving account info
-- (adds country and industry to clients table)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country VARCHAR(120);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry VARCHAR(120);
