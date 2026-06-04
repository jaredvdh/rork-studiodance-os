-- ============================================================================
-- Migration 001: Enrolments Table Hardening
-- Moves enrolment tracking from array/counter-based to normalized model
-- ============================================================================

-- 1. Add new columns to the enrolments table
ALTER TABLE enrolments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Add CHECK constraint for valid status values
ALTER TABLE enrolments
  ADD CONSTRAINT enrolments_status_check
  CHECK (status IN ('active', 'waitlisted', 'withdrawn', 'completed'));

-- 3. Backfill existing rows: set started_at = created_at
UPDATE enrolments
  SET started_at = created_at,
      updated_at = created_at
  WHERE started_at IS NULL
     OR updated_at IS NULL;

-- 4. Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enrolments_studio_id ON enrolments(studio_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_student_id ON enrolments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_class_id ON enrolments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_status ON enrolments(status);
CREATE INDEX IF NOT EXISTS idx_enrolments_studio_status ON enrolments(studio_id, status);

-- 5. Unique partial index: one active enrolment per student per class
--    (student_id, class_id) must be unique when status = 'active' or 'waitlisted'
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrolments_active_student_class
  ON enrolments(student_id, class_id)
  WHERE status IN ('active', 'waitlisted');

-- 6. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_enrolment_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrolments_updated_at ON enrolments;
CREATE TRIGGER trg_enrolments_updated_at
  BEFORE UPDATE ON enrolments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrolment_updated_at();

-- 7. Add enrolment_id to invoices table (optional, for linking invoices to specific enrolments)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS enrolment_id uuid REFERENCES enrolments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_enrolment_id ON invoices(enrolment_id);

-- 8. Function to derive enrolled count for a class from active enrolments
CREATE OR REPLACE FUNCTION class_enrolled_count(p_class_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM enrolments
  WHERE class_id = p_class_id AND status = 'active';
$$ LANGUAGE sql STABLE;

-- 9. Function to derive waitlist count for a class
CREATE OR REPLACE FUNCTION class_waitlist_count(p_class_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM enrolments
  WHERE class_id = p_class_id AND status = 'waitlisted';
$$ LANGUAGE sql STABLE;

-- 10. Function to get student's active class IDs from enrolments
CREATE OR REPLACE FUNCTION student_active_class_ids(p_student_id uuid)
RETURNS uuid[] AS $$
  SELECT array_agg(class_id) FROM enrolments
  WHERE student_id = p_student_id AND status = 'active';
$$ LANGUAGE sql STABLE;
