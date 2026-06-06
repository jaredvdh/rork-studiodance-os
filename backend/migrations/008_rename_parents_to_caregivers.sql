-- ============================================================================
-- Migration 008: Rename parents → caregivers
-- Expands the table to support the full two-caregiver architecture already
-- defined in the frontend Caregiver type (web-studioflow/src/data/types.ts:420).
--
-- What this migration does:
--  1. Drops the FK on students.parent_id (cascade nulls, not deletes)
--  2. Renames parents → caregivers
--  3. Adds caregiver-specific columns: first_name, last_name, role, status,
--     permissions, relationship, household_label, custody flags, timestamps
--  4. Backfills first_name/last_name from legacy name
--  5. Renames students.parent_id → students.caregiver_id; re-creates FK
--  6. Updates indexes and RLS policies
--  7. Regenerates backend/types.ts (done automatically on deploy)
-- ============================================================================

BEGIN;

-- 1. Drop the FK so we can rename the table
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_parent_id_fkey;

-- 2. Rename the table
ALTER TABLE parents RENAME TO caregivers;

-- 3. Expand to match the frontend Caregiver type
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS relationship_to_student text,
  ADD COLUMN IF NOT EXISTS is_primary_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_billing_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_authorized_pickup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'disabled', 'removed')),
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'primary_caregiver'
    CHECK (role IN (
      'primary_caregiver', 'secondary_caregiver',
      'additional_caregiver', 'emergency_contact_only'
    )),
  -- Permission flags (mirrors CaregiverPermissions)
  ADD COLUMN IF NOT EXISTS receives_announcements boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS receives_emergency_messages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_schedule boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_billing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_pay_invoices boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_enrolments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_sign_waivers boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_medical_notes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS authorized_pickup boolean DEFAULT false,
  -- Structured address (existing address/city/state/zip kept for backward compat)
  ADD COLUMN IF NOT EXISTS structured_address jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS household_label text,
  -- Admin-only visibility flags
  ADD COLUMN IF NOT EXISTS custody_restriction boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS court_order_on_file boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS communication_only boolean DEFAULT false,
  -- Lifecycle timestamps
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- 4. Backfill first_name / last_name from legacy name
UPDATE caregivers
SET
  first_name = COALESCE(first_name, split_part(name, ' ', 1)),
  last_name  = COALESCE(last_name, CASE
    WHEN position(' ' in name) > 0
    THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END)
WHERE first_name IS NULL;

-- All existing rows represent primary contacts
UPDATE caregivers
SET
  is_primary_contact = true,
  is_billing_contact = true,
  is_authorized_pickup = true,
  can_view_billing = true,
  can_pay_invoices = true,
  can_manage_enrolments = true,
  can_sign_waivers = true,
  can_view_medical_notes = true,
  authorized_pickup = true
WHERE is_primary_contact = false; -- only update if not already set

-- 5. Rename students.parent_id → students.caregiver_id
ALTER TABLE students RENAME COLUMN parent_id TO caregiver_id;

-- Re-create the FK
ALTER TABLE students
  ADD CONSTRAINT students_caregiver_id_fkey
  FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE SET NULL;

-- 6. Update indexes
DROP INDEX IF EXISTS idx_parents_studio;
DROP INDEX IF EXISTS idx_caregivers_studio;
CREATE INDEX IF NOT EXISTS idx_caregivers_studio ON caregivers(studio_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_role ON caregivers(role);
CREATE INDEX IF NOT EXISTS idx_caregivers_status ON caregivers(status);
CREATE INDEX IF NOT EXISTS idx_caregivers_email ON caregivers(email);

-- Index on students.caregiver_id (replaces old FK index if needed)
CREATE INDEX IF NOT EXISTS idx_students_caregiver_id ON students(caregiver_id)
  WHERE caregiver_id IS NOT NULL;

-- 7. RLS — re-apply policies on the renamed table
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;

-- Drop old parent policies if they exist
DROP POLICY IF EXISTS "Studio admins can view their parents" ON caregivers;
DROP POLICY IF EXISTS "Studio admins can insert parents" ON caregivers;
DROP POLICY IF EXISTS "Studio admins can update parents" ON caregivers;
DROP POLICY IF EXISTS "Studio admins can delete parents" ON caregivers;

-- Create new caregiver policies
CREATE POLICY "Studio admins can view their caregivers"
  ON caregivers FOR SELECT
  USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

CREATE POLICY "Studio admins can insert caregivers"
  ON caregivers FOR INSERT
  WITH CHECK (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

CREATE POLICY "Studio admins can update caregivers"
  ON caregivers FOR UPDATE
  USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

CREATE POLICY "Studio admins can delete caregivers"
  ON caregivers FOR DELETE
  USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

-- Caregivers can view their own records
CREATE POLICY "Caregivers can view own record"
  ON caregivers FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = user_id()));

COMMIT;

-- ============================================================================
-- Post-migration notes:
--
-- After this migration is applied:
--   1. Deploy backend/functions/ (re-deploy seed-demo-data)
--   2. The backend/types.ts file will be auto-regenerated
--   3. Update web-studioflow/src code as described in the plan:
--      - All from("parents") → from("caregivers")
--      - All parentId / parent_id → caregiverId / caregiver_id
--      - All UI labels: "Parent" → "Parent / Caregiver"
--      - Map DB rows to the Caregiver interface directly (no more name-splitting)
-- ============================================================================
