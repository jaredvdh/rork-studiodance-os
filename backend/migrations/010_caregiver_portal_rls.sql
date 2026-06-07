-- ============================================================================
-- Migration 010: Caregiver Portal RLS Policies
-- Adds caregiver-scoped Row Level Security so parents/caregivers can only see
-- their own linked students, enrolments, invoices, waivers, attendance, and
-- announcements when accessing the parent/member portal.
--
-- Changes:
--   1. students — caregivers can view/update students linked to them
--   2. enrolments — caregivers can view enrolments for their students
--   3. invoices — caregivers can view invoices for their students
--   4. waiver_signatures — caregivers can view/create signatures for their students
--   5. announcements — caregivers can view studio announcements (if receives_announcements)
--   6. attendance_records — caregivers can view attendance for their students
--   7. attendance_sessions — caregivers can view sessions for classes their students attend
--   8. waiver_versions — caregivers can view published versions (needed to read waiver content)
--   9. waiver_templates — caregivers can view published templates
--  10. caregivers — tighten existing "own record" policy with proper email match
--  11. caregiver_audit_log table — for tracking caregiver lifecycle events
-- ============================================================================

BEGIN;

-- ── Helper: get caregiver ID for the authenticated user ───────────────────
-- Returns the caregiver.id that matches the authenticated user's email.
-- Returns NULL if the user is not a caregiver.
CREATE OR REPLACE FUNCTION caregiver_id_for_user()
RETURNS uuid AS $$
  SELECT id FROM caregivers
  WHERE email = (SELECT email FROM profiles WHERE id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper: get student IDs linked to the authenticated caregiver ─────────
CREATE OR REPLACE FUNCTION caregiver_student_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(array_agg(id), '{}'::uuid[])
  FROM students
  WHERE caregiver_id = caregiver_id_for_user();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper: get class IDs for the caregiver's students ────────────────────
CREATE OR REPLACE FUNCTION caregiver_class_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(array_agg(DISTINCT class_id), '{}'::uuid[])
  FROM enrolments
  WHERE student_id = ANY(caregiver_student_ids())
    AND status IN ('active', 'waitlisted');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper: is the user a caregiver for this studio? ──────────────────────
CREATE OR REPLACE FUNCTION is_studio_caregiver(studio_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM caregivers
    WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
      AND studio_id = $1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 1. students: caregiver-scoped RLS ─────────────────────────────────────
-- Drop existing studio-only policy (kept alongside for admins)
DROP POLICY IF EXISTS "Caregivers can view own students" ON students;
DROP POLICY IF EXISTS "Caregivers can update own students" ON students;

CREATE POLICY "Caregivers can view own students"
  ON students FOR SELECT
  USING (
    caregiver_id = caregiver_id_for_user()
    OR
    -- Admins still have full access via the existing studio policy
    studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Caregivers can update own students"
  ON students FOR UPDATE
  USING (caregiver_id = caregiver_id_for_user())
  WITH CHECK (caregiver_id = caregiver_id_for_user());

-- ── 2. enrolments: caregiver-scoped RLS ───────────────────────────────────
DROP POLICY IF EXISTS "Caregivers can view own enrolments" ON enrolments;

CREATE POLICY "Caregivers can view own enrolments"
  ON enrolments FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
  );

-- ── 3. invoices: caregiver-scoped RLS ─────────────────────────────────────
-- Match by student_name (legacy) or by parent_email for the caregiver
DROP POLICY IF EXISTS "Caregivers can view own invoices" ON invoices;

CREATE POLICY "Caregivers can view own invoices"
  ON invoices FOR SELECT
  USING (
    parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR
    student_name IN (
      SELECT name FROM students WHERE caregiver_id = caregiver_id_for_user()
    )
  );

-- ── 4. waiver_signatures: caregiver-scoped RLS ────────────────────────────
DROP POLICY IF EXISTS "Caregivers can view own waiver signatures" ON waiver_signatures;
DROP POLICY IF EXISTS "Caregivers can create waiver signatures" ON waiver_signatures;

CREATE POLICY "Caregivers can view own waiver signatures"
  ON waiver_signatures FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
    OR caregiver_id = caregiver_id_for_user()
  );

CREATE POLICY "Caregivers can create waiver signatures"
  ON waiver_signatures FOR INSERT
  WITH CHECK (
    student_id = ANY(caregiver_student_ids())
    OR caregiver_id = caregiver_id_for_user()
  );

-- ── 5. announcements: caregiver-scoped RLS ────────────────────────────────
-- Caregivers who receive announcements can view announcements for their studio.
-- The existing studio policy already allows this for admins; we ADD (don't drop)
-- a policy for caregivers.
DROP POLICY IF EXISTS "Caregivers can view announcements" ON announcements;

CREATE POLICY "Caregivers can view announcements"
  ON announcements FOR SELECT
  USING (
    is_studio_caregiver(studio_id)
    AND EXISTS (
      SELECT 1 FROM caregivers
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
        AND studio_id = announcements.studio_id
        AND receives_announcements = true
    )
  );

-- ── 6. attendance_records: caregiver-scoped RLS ───────────────────────────
DROP POLICY IF EXISTS "Caregivers can view own attendance records" ON attendance_records;

CREATE POLICY "Caregivers can view own attendance records"
  ON attendance_records FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
  );

-- ── 7. attendance_sessions: caregiver-scoped RLS ──────────────────────────
DROP POLICY IF EXISTS "Caregivers can view own attendance sessions" ON attendance_sessions;

CREATE POLICY "Caregivers can view own attendance sessions"
  ON attendance_sessions FOR SELECT
  USING (
    class_id = ANY(caregiver_class_ids())
  );

-- ── 8. waiver_versions: caregivers can read published versions ────────────
DROP POLICY IF EXISTS "Caregivers can view published waiver versions" ON waiver_versions;

CREATE POLICY "Caregivers can view published waiver versions"
  ON waiver_versions FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM waiver_templates wt
      WHERE wt.id = waiver_versions.template_id
        AND wt.studio_id IN (
          SELECT studio_id FROM caregivers
          WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
        )
    )
  );

-- ── 9. waiver_templates: caregivers can view published templates ──────────
DROP POLICY IF EXISTS "Caregivers can view published waiver templates" ON waiver_templates;

CREATE POLICY "Caregivers can view published waiver templates"
  ON waiver_templates FOR SELECT
  USING (
    status = 'published'
    AND studio_id IN (
      SELECT studio_id FROM caregivers
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- ── 10. Tighten caregiver self-record policy ──────────────────────────────
-- Drop the old policy and recreate with proper email matching
DROP POLICY IF EXISTS "Caregivers can view own record" ON caregivers;

CREATE POLICY "Caregivers can view own record"
  ON caregivers FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Caregivers can update own record"
  ON caregivers FOR UPDATE
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- ── 11. caregiver_audit_log table ─────────────────────────────────────────
-- Tracks caregiver lifecycle events (nominated, accepted, disabled, removed, etc.)
CREATE TABLE IF NOT EXISTS caregiver_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  event text NOT NULL,
  details text,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caregiver_audit_log_studio
  ON caregiver_audit_log(studio_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_audit_log_caregiver
  ON caregiver_audit_log(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_audit_log_event
  ON caregiver_audit_log(caregiver_id, event);

ALTER TABLE caregiver_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY caregiver_audit_log_studio_policy ON caregiver_audit_log
  FOR ALL USING (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = auth.uid()
  ));

-- Caregivers can view their own audit log entries
CREATE POLICY "Caregivers can view own audit log"
  ON caregiver_audit_log FOR SELECT
  USING (
    caregiver_id = caregiver_id_for_user()
  );

-- ── 12. uploaded_documents: caregiver-scoped RLS ──────────────────────────
DROP POLICY IF EXISTS "Caregivers can view own documents" ON uploaded_documents;

CREATE POLICY "Caregivers can view own documents"
  ON uploaded_documents FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
  );

-- ── 13. recital_events: caregiver-scoped RLS ──────────────────────────────
DROP POLICY IF EXISTS "Caregivers can view recital events" ON recital_events;

CREATE POLICY "Caregivers can view recital events"
  ON recital_events FOR SELECT
  USING (
    is_studio_caregiver(studio_id)
  );

-- ── Updated_at trigger for caregiver_audit_log ────────────────────────────
-- (No updated_at column — audit log is append-only, so no trigger needed)

COMMIT;

-- ============================================================================
-- Post-migration notes:
--
-- After this migration is applied:
--   1. Deploy backend/functions/ (re-deploy seed-demo-data if needed)
--   2. The backend/types.ts will be regenerated automatically on deploy
--   3. Parent portal pages will now receive scoped data via RLS
--   4. Test by logging in as a caregiver and verifying data isolation
--   5. The caregiver_audit_log table supports tracking all caregiver events
-- ============================================================================
