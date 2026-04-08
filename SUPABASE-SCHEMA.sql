-- Performance East Sales Dashboard — Supabase schema setup
--
-- Run this ONCE in your Supabase SQL Editor to ensure all required columns exist.
-- It's safe to run multiple times — every statement uses IF NOT EXISTS.
--
-- Without these columns, the corresponding fields fall back to localStorage only,
-- which means data won't sync across devices and may be lost if the browser cache is cleared.

-- ── monthly_data table ──
-- The main blob table. Each row is one (store, year, month) bucket containing all
-- the data shown in the dashboard for that month.

CREATE TABLE IF NOT EXISTS monthly_data (
  id BIGSERIAL PRIMARY KEY,
  store_id TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on (store_id, year, month) for upsert
CREATE UNIQUE INDEX IF NOT EXISTS monthly_data_store_year_month_idx
  ON monthly_data (store_id, year, month);

-- All JSONB columns the app reads/writes. Each ALTER is idempotent.
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS deals               JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS leads               JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS floor_leads         JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS goals               JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS salespeople         JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS pga_tiers           JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS be_spiffs           JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS hit_list            JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS contests            JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS daily_lead_counts   JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS bulk_lead_counts    JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS floor_daily_counts  JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS floor_bulk_counts   JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS notes               JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS meeting_notes       JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS google_reviews      JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS gsm_checklist       JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS fi_kpis             JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS fi_checklist        JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS fi_deals            JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS fi_targets          JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS fi_menus            JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS fi_menu_config      JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS gsm_bonus_config    JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS history_counts      JSONB DEFAULT '{}';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS promos              JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS price_list          JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS promo_records       JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS pricing_records     JSONB DEFAULT '[]';
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS inventory_items     JSONB DEFAULT '[]';

-- ── crm_users table ──
-- User accounts for login + role-based permissions.

CREATE TABLE IF NOT EXISTS crm_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  pin TEXT,
  active BOOLEAN DEFAULT TRUE,
  store_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional flag controlled by Manager > Manage Reps. When TRUE, the user appears
-- in salesperson dropdowns, leaderboards, etc. When FALSE, they're hidden from
-- sales tracking but can still log in. NULL falls back to role-based defaults.
ALTER TABLE crm_users ADD COLUMN IF NOT EXISTS is_salesperson BOOLEAN;

-- ══════════════════════════════════════════════════════════════════
-- Optional: enable Row Level Security if you want fine-grained access control.
-- Skip this section if you're using a service role key from Vercel.
-- ══════════════════════════════════════════════════════════════════
-- ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "service role full access" ON monthly_data FOR ALL TO service_role USING (true);
-- CREATE POLICY "service role full access" ON crm_users    FOR ALL TO service_role USING (true);
