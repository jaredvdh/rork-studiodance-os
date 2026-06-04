-- Migration 002: Child Registration Hardening
-- Adds legally-safe registration fields to the students table.
-- Each column is additive — no data loss for existing rows.

-- ── Legal name fields (split from display `name`) ──────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS legal_first_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS legal_last_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_name text;

-- ── Demographic / optional identity fields ─────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pronouns text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_grade text;

-- ── Emergency contact ──────────────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_secondary_phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_can_pickup boolean DEFAULT false;

-- ── Authorized pickup contacts (JSON array) ────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS authorized_pickup_contacts jsonb DEFAULT '[]'::jsonb;

-- ── Structured medical info ────────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS medications text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_conditions text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_asthma boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_inhaler boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_epipen boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS activity_restrictions text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS safety_notes text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_info_confirmed boolean DEFAULT false;

-- ── Guardian consent ───────────────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_confirmed boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_relationship text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_id text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz;

-- ── Individual waiver statuses ─────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS waiver_liability text DEFAULT 'missing';
ALTER TABLE students ADD COLUMN IF NOT EXISTS waiver_medical_consent text DEFAULT 'missing';
ALTER TABLE students ADD COLUMN IF NOT EXISTS waiver_photo_video text DEFAULT 'missing';
ALTER TABLE students ADD COLUMN IF NOT EXISTS waiver_code_of_conduct text DEFAULT 'missing';
ALTER TABLE students ADD COLUMN IF NOT EXISTS waiver_privacy_data text DEFAULT 'missing';

-- ── Indexes for common queries ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_guardian_id ON students(guardian_id)
  WHERE guardian_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_emergency_contact ON students(emergency_contact_name)
  WHERE emergency_contact_name IS NOT NULL;

-- ── Backfill: derive legal_first/last_name from name for existing rows
-- Only runs when the column was just added (NULL values exist).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM students
    WHERE legal_first_name IS NULL AND name IS NOT NULL AND name != ''
    LIMIT 1
  ) THEN
    UPDATE students
    SET
      legal_first_name = split_part(name, ' ', 1),
      legal_last_name  = CASE
        WHEN position(' ' in name) > 0
        THEN substring(name from position(' ' in name) + 1)
        ELSE ''
      END
    WHERE legal_first_name IS NULL
      AND name IS NOT NULL
      AND name != '';
  END IF;
END $$;
