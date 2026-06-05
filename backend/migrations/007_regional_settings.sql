-- 007_regional_settings.sql
-- Internationalization: add regional settings to studio_settings
-- and structured international address support.

/* ── Regional settings column ──────────────────────────────────────── */

-- Add a JSONB column for regional settings to studio_settings
ALTER TABLE studio_settings
ADD COLUMN IF NOT EXISTS regional JSONB
DEFAULT '{"country":"US","timezone":"America/Chicago","currency":"USD","dateFormat":"MM/DD/YYYY","timeFormat":"12h","measurementSystem":"imperial"}'::jsonb;

COMMENT ON COLUMN studio_settings.regional IS
'Platform-wide regional settings: country, timezone, currency, date format, time format, measurement system. Replaces individual hardcoded North American assumptions.';

/* ── Structured international address ──────────────────────────────── */

-- Add structured address columns to studios table
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state_province TEXT,
ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'US';

COMMENT ON COLUMN studios.address_line1 IS 'Street address line 1 — replaces free-text city field for international support';
COMMENT ON COLUMN studios.address_line2 IS 'Street address line 2 (optional)';
COMMENT ON COLUMN studios.address_city IS 'City / town';
COMMENT ON COLUMN studios.address_state_province IS 'State / province / region — label depends on country';
COMMENT ON COLUMN studios.address_postal_code IS 'Postal / ZIP code';
COMMENT ON COLUMN studios.address_country IS 'ISO country code (US, CA, NZ, AU, GB, IE, EU, OTHER)';

-- Add structured address columns to profiles (parents/caregivers)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state_province TEXT,
ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'US';

COMMENT ON COLUMN profiles.address_line1 IS 'Street address line 1';
COMMENT ON COLUMN profiles.address_state_province IS 'State / province / region — label depends on country';
COMMENT ON COLUMN profiles.address_country IS 'ISO country code';

/* ── Instructor skills (replaces hardcoded dance styles) ─────────── */

-- Add skills JSONB column to teachers table
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS skills JSONB
DEFAULT '[]'::jsonb;

COMMENT ON COLUMN teachers.skills IS
'Studio-defined skills/qualifications as JSON array of {name, category?}. Replaces hardcoded DanceStyle enum for multi-vertical support (dance, yoga, CrossFit, martial arts, music, etc.)';

-- Backfill existing teachers: derive skills from their styles array
UPDATE teachers
SET skills = (
  SELECT jsonb_agg(jsonb_build_object('name', style, 'category', 'Dance'))
  FROM unnest(styles) AS style
)
WHERE skills = '[]'::jsonb OR skills IS NULL;

/* ── Phone country code ───────────────────────────────────────────── */

-- Add phone_country_code to profiles for international phone formatting
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+1';

COMMENT ON COLUMN profiles.phone_country_code IS
'E.164 country code prefix (e.g., +1, +44, +64). Used to format phone numbers internationally.';

/* ── Waiver metadata fields ───────────────────────────────────────── */

-- Add compliance metadata to waiver_signatures for international deployment
ALTER TABLE waiver_signatures
ADD COLUMN IF NOT EXISTS signer_country TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB;

COMMENT ON COLUMN waiver_signatures.signer_country IS
'Country where the waiver was signed (for international compliance)';
COMMENT ON COLUMN waiver_signatures.device_info IS
'Device/browser metadata at time of signing (for audit trail)';

/* ── Currency code on invoices ────────────────────────────────────── */

-- Add currency_code to invoices for multi-currency support
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';

COMMENT ON COLUMN invoices.currency_code IS
'ISO 4217 currency code (USD, CAD, NZD, AUD, GBP, EUR). Inherited from studio regional settings at invoice creation time.';

/* ── Indexes ──────────────────────────────────────────────────────── */

-- Index for country-filtered queries (future multi-country reporting)
CREATE INDEX IF NOT EXISTS idx_studios_address_country ON studios(address_country);
CREATE INDEX IF NOT EXISTS idx_profiles_address_country ON profiles(address_country);
CREATE INDEX IF NOT EXISTS idx_invoices_currency_code ON invoices(currency_code);

/* ── Backfill: migrate existing free-text addresses to structured ── */

-- Studios: extract city from existing free-text city field
DO $$
BEGIN
  UPDATE studios
  SET address_city = city,
      address_country = COALESCE(address_country, 'US')
  WHERE address_city IS NULL AND city IS NOT NULL AND city != '';
END $$;

-- Profiles: extract state/zip from existing columns
DO $$
BEGIN
  UPDATE profiles
  SET address_country = COALESCE(address_country, 'US')
  WHERE address_country IS NULL;
END $$;
