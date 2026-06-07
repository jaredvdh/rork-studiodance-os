-- ============================================================================
-- Migration 009: Critical Schema Fixes
-- Adds missing columns, tables, indexes, and RLS policies identified
-- during the Phase 1 integration hardening audit.
--
-- Changes:
--   1. invoices — add paid_at, stripe_invoice_id, stripe_payment_intent_id,
--      parent_email
--   2. studios — add banner_url
--   3. profiles — add onboarding_completed, onboarding_completed_at
--   4. classes — add description
--   5. NEW TABLE: attendance_sessions
--   6. NEW TABLE: recital_performances
--   7. Indexes and RLS for new tables
--   8. updated_at triggers where missing
-- ============================================================================

BEGIN;

-- ── 1. invoices: payment & Stripe columns ─────────────────────────────── ──

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS parent_email text;

-- Backfill parent_email from the caregivers table where possible
UPDATE invoices i
SET parent_email = c.email
FROM caregivers c
WHERE i.parent_name IS NOT NULL
  AND c.name = i.parent_name
  AND c.studio_id = i.studio_id
  AND i.parent_email IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at)
  WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_pi ON invoices(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ── 2. studios: banner_url ───────────────────────────────────────────── ──

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS banner_url text;

-- ── 3. profiles: onboarding tracking ──────────────────────────────────── ──

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed)
  WHERE onboarding_completed = true;

-- ── 4. classes: description field ─────────────────────────────────────── ──

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS description text;

-- ── 5. attendance_sessions table ──────────────────────────────────────── ──

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  marked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_studio
  ON attendance_sessions(studio_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class
  ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date
  ON attendance_sessions(studio_id, session_date);

-- attendance_records: per-student attendance within a session
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'excused', 'left_early')),
  check_in_time timestamptz,
  check_out_time timestamptz,
  notes text,
  marked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_studio
  ON attendance_records(studio_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session
  ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student
  ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status
  ON attendance_records(student_id, status);

-- ── 6. recital_performances table ─────────────────────────────────────── ──

CREATE TABLE IF NOT EXISTS recital_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  recital_event_id uuid REFERENCES recital_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  class_ids uuid[] NOT NULL DEFAULT '{}',
  "order" integer NOT NULL DEFAULT 0,
  start_time time,
  notes text,
  costume_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recital_performances_studio
  ON recital_performances(studio_id);
CREATE INDEX IF NOT EXISTS idx_recital_performances_event
  ON recital_performances(recital_event_id);
CREATE INDEX IF NOT EXISTS idx_recital_performances_order
  ON recital_performances(recital_event_id, "order");

-- Update costume_assignments FK after recital_performances table exists
-- (Migration 005 created a placeholder FK; now we can make it real)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'costume_assignments'
      AND column_name = 'recital_performance_id'
  ) THEN
    ALTER TABLE costume_assignments
      ADD CONSTRAINT costume_assignments_recital_perf_fkey
      FOREIGN KEY (recital_performance_id) REFERENCES recital_performances(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 7. RLS for new tables ─────────────────────────────────────────────── ──

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recital_performances ENABLE ROW LEVEL SECURITY;

-- Studio-scoped RLS (reuses the same pattern as base migration)
CREATE POLICY attendance_sessions_studio_policy ON attendance_sessions
  FOR ALL USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = (SELECT user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT id FROM studios WHERE owner_id = (SELECT user_id())
  ));

CREATE POLICY attendance_records_studio_policy ON attendance_records
  FOR ALL USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = (SELECT user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT id FROM studios WHERE owner_id = (SELECT user_id())
  ));

CREATE POLICY recital_performances_studio_policy ON recital_performances
  FOR ALL USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = (SELECT user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT id FROM studios WHERE owner_id = (SELECT user_id())
  ));

-- ── 8. updated_at triggers for new tables ─────────────────────────────── ──

CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
  tables_with_updated_at text[] := ARRAY[
    'attendance_sessions', 'attendance_records', 'recital_performances',
    'invoices', 'classes', 'profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables_with_updated_at LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$I;
      CREATE TRIGGER trg_%1$s_updated_at
        BEFORE UPDATE ON %1$I
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_at_column();
    ', t);
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- Post-migration notes:
--
-- After this migration is applied:
--   1. Run `supabase db remote commit` or equivalent to capture the new state
--   2. The backend/types.ts will be regenerated automatically on deploy
--   3. Update web-studioflow/src/integrations/supabase/types.ts to match
--   4. The new attendance_sessions and recital_performances tables are now
--      available for frontend features
-- ============================================================================
