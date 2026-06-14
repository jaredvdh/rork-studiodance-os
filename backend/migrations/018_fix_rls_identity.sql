-- ============================================================================
-- Migration 018: Fix RLS Identity for Rork Auth Users
-- ----------------------------------------------------------------------------
-- Problem
--   Rork OAuth users authenticate with third-party JWTs. user_id() resolves
--   correctly to the JWT `sub`, but many RLS helper functions and policies
--   route through the `profiles` table (profiles.studio_id, profiles.role) which
--   are never populated by the Rork signup flow. This causes every policy that
--   depends on those helpers to return false, blocking ALL data access.
--
--   Additionally, some policies use `auth.uid()` directly. On Rork Auth
--   projects `runMigration` requires `user_id()` instead; every occurrence must
--   be rewritten.
--
-- Fix summary
--   1. Rewrite is_studio_owner() — bypass profiles, check studios.owner_id
--   2. Rewrite is_studio_member() — bypass profiles, check studios + teachers
--   3. Rewrite user_studio_ids() — bypass profiles, check studios.owner_id
--   4. Drop & recreate ALL RLS policies that use auth.uid() → user_id()
--   5. Fix invites.studio_id column type: text → uuid
--   6. Fix caregiver helper functions: replace auth.uid() → user_id()
--   7. Recreate base dynamic studio-scoped policies (from 000)
--   8. Recreate storage bucket policies (from 004)
--   9. Recreate studio admins/members policies on costume tables (from 005)
--  10. Recreate caregiver portal policies (from 010)
--  11. Recreate payment policies (from 011)
--  12. Recreate waiver versions caregiver policy (from 014)
--  13. Recreate attendance staff policies (from 015)
-- ============================================================================

BEGIN;

-- ── 1. Fix user_id() helper (idempotent re-assertion) ────────────────────────
CREATE OR REPLACE FUNCTION user_id()
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- ── 2. Rewrite is_studio_owner() ─────────────────────────────────────────────
-- Old: checked profiles.role = 'admin' AND profiles.studio_id — never populated
-- New: checks studios.owner_id = user_id() directly
DROP FUNCTION IF EXISTS is_studio_owner(uuid);
CREATE OR REPLACE FUNCTION is_studio_owner(p_studio_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM studios WHERE id = p_studio_id AND owner_id = user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 3. Rewrite is_studio_member() ────────────────────────────────────────────
-- Old: checked profiles.studio_id — never populated
-- New: checks studios.owner_id OR teachers membership
DROP FUNCTION IF EXISTS is_studio_member(uuid);
CREATE OR REPLACE FUNCTION is_studio_member(p_studio_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM studios WHERE id = p_studio_id AND owner_id = user_id()
  )
  OR EXISTS (
    SELECT 1 FROM teachers WHERE studio_id = p_studio_id
    AND email = (SELECT email FROM profiles WHERE id = user_id())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 4. Rewrite user_studio_ids() ─────────────────────────────────────────────
-- Old: SELECT studio_id FROM profiles WHERE id = ... — studio_id never set
-- New: SELECT id FROM studios WHERE owner_id = user_id()
CREATE OR REPLACE FUNCTION user_studio_ids()
RETURNS SETOF uuid AS $$
  SELECT id FROM studios WHERE owner_id = user_id();
$$ LANGUAGE sql STABLE;

-- ── 5. Fix invites.studio_id column type (text → uuid) ───────────────────────
ALTER TABLE invites
  ALTER COLUMN studio_id TYPE uuid USING studio_id::uuid;

-- ── 6. Fix caregiver helper functions ────────────────────────────────────────
-- caregiver_id_for_user(): replace auth.uid() → user_id()
CREATE OR REPLACE FUNCTION caregiver_id_for_user()
RETURNS uuid AS $$
  SELECT id FROM caregivers
  WHERE email = (SELECT email FROM profiles WHERE id = user_id());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- is_studio_caregiver(): replace auth.uid() → user_id()
CREATE OR REPLACE FUNCTION is_studio_caregiver(studio_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM caregivers
    WHERE email = (SELECT email FROM profiles WHERE id = user_id())
      AND studio_id = $1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Base dynamic studio-scoped policies (originally from migration 000)
--    Drop and recreate for all 12 tables, switching from profiles.studio_id
--    to studios.owner_id.
-- ══════════════════════════════════════════════════════════════════════════════

-- studios: key is `id` (not studio_id)
DROP POLICY IF EXISTS studios_studio_policy ON studios;
CREATE POLICY studios_studio_policy ON studios
  FOR ALL USING (owner_id = user_id())
  WITH CHECK (owner_id = user_id());

-- All remaining tables key on studio_id
DO $$
DECLARE
  t text;
  studio_scoped text[] := ARRAY[
    'teachers','caregivers','classes','students','enrolments',
    'invoices','announcements','recital_events','activity_logs',
    'import_history','studio_settings'
  ];
BEGIN
  FOREACH t IN ARRAY studio_scoped LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_studio_policy', t);
    EXECUTE format($f$
      CREATE POLICY %1$I ON %1$I
        FOR ALL USING (studio_id IN (
          SELECT id FROM studios WHERE owner_id = user_id()
        ))
        WITH CHECK (studio_id IN (
          SELECT id FROM studios WHERE owner_id = user_id()
        ));
    $f$, t);
  END LOOP;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. Storage bucket policies (originally from migration 004)
--    user_studio_ids() is already fixed above; medical_files policies used
--    auth.uid() + profiles.role — rewrite to use user_id() + studios.owner_id.
-- ══════════════════════════════════════════════════════════════════════════════

-- Recreate studio-scoped bucket policies (now safe via fixed user_studio_ids)
DO $$
DECLARE
  b text;
  studio_buckets text[] := ARRAY[
    'studio-logos','waiver-documents','student-documents',
    'recital-exports','migration-files'
  ];
BEGIN
  FOREACH b IN ARRAY studio_buckets LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', b || '_read');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', b || '_write');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', b || '_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', b || '_delete');

    EXECUTE format($p$
      CREATE POLICY %1$I ON storage.objects
        FOR SELECT TO authenticated
        USING (
          bucket_id = %2$L
          AND ((storage.foldername(name))[1])::uuid IN (SELECT user_studio_ids())
        );
    $p$, b || '_read', b);

    EXECUTE format($p$
      CREATE POLICY %1$I ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = %2$L
          AND ((storage.foldername(name))[1])::uuid IN (SELECT user_studio_ids())
        );
    $p$, b || '_write', b);

    EXECUTE format($p$
      CREATE POLICY %1$I ON storage.objects
        FOR UPDATE TO authenticated
        USING (
          bucket_id = %2$L
          AND ((storage.foldername(name))[1])::uuid IN (SELECT user_studio_ids())
        );
    $p$, b || '_update', b);

    EXECUTE format($p$
      CREATE POLICY %1$I ON storage.objects
        FOR DELETE TO authenticated
        USING (
          bucket_id = %2$L
          AND ((storage.foldername(name))[1])::uuid IN (SELECT user_studio_ids())
        );
    $p$, b || '_delete', b);
  END LOOP;
END $$;

-- Medical files: rewrite to use studios.owner_id instead of profiles.role
DROP POLICY IF EXISTS medical_files_admin_read ON storage.objects;
DROP POLICY IF EXISTS medical_files_admin_write ON storage.objects;
DROP POLICY IF EXISTS medical_files_admin_update ON storage.objects;
DROP POLICY IF EXISTS medical_files_admin_delete ON storage.objects;

CREATE POLICY medical_files_admin_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
  );

CREATE POLICY medical_files_admin_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
  );

CREATE POLICY medical_files_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
  );

CREATE POLICY medical_files_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. Costume management RLS (originally from migration 005)
--    is_studio_owner() / is_studio_member() already fixed above.
--    Recreate all costume-table policies to pick up the fixed helpers.
--    Also fix the buggy caregiver policy that referenced `p.id`.
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl text;
BEGIN
  -- Studio-scoped costume tables: admin full access, members read-only
  FOREACH tbl IN ARRAY ARRAY[
    'costumes', 'costume_assignments', 'sizing_charts', 'vendor_orders',
    'vendor_order_items', 'alterations', 'reusable_costumes'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Studio admins full access on %1$s" ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Studio members read on %1$s" ON %1$s;', tbl);

    EXECUTE format('
      CREATE POLICY "Studio admins full access on %1$s"
        ON %1$s FOR ALL
        USING (is_studio_owner(studio_id))
        WITH CHECK (is_studio_owner(studio_id))
    ', tbl);
    EXECUTE format('
      CREATE POLICY "Studio members read on %1$s"
        ON %1$s FOR SELECT
        USING (is_studio_member(studio_id))
    ', tbl);
  END LOOP;

  -- Student-scoped costume tables: admin full, caregivers see their children
  FOREACH tbl IN ARRAY ARRAY[
    'student_measurements', 'size_recommendations', 'costume_fees',
    'costume_distributions', 'costume_rentals'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Studio admins full access on %1$s" ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Caregivers see their children on %1$s" ON %1$s;', tbl);

    EXECUTE format('
      CREATE POLICY "Studio admins full access on %1$s"
        ON %1$s FOR ALL
        USING (is_studio_owner(studio_id))
        WITH CHECK (is_studio_owner(studio_id))
    ', tbl);
    EXECUTE format('
      CREATE POLICY "Caregivers see their children on %1$s"
        ON %1$s FOR SELECT
        USING (
          is_studio_member(studio_id)
          AND EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = %1$s.student_id
              AND s.caregiver_id = caregiver_id_for_user()
          )
        )
    ', tbl);
  END LOOP;

  -- quick_change_analyses: admin full, members read
  EXECUTE 'DROP POLICY IF EXISTS "Studio admins full access on quick_change_analyses" ON quick_change_analyses;';
  EXECUTE 'DROP POLICY IF EXISTS "Studio members read on quick_change_analyses" ON quick_change_analyses;';
  EXECUTE '
    CREATE POLICY "Studio admins full access on quick_change_analyses"
      ON quick_change_analyses FOR ALL
      USING (is_studio_owner(studio_id))
      WITH CHECK (is_studio_owner(studio_id))
  ';
  EXECUTE '
    CREATE POLICY "Studio members read on quick_change_analyses"
      ON quick_change_analyses FOR SELECT
      USING (is_studio_member(studio_id))
  ';
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. Caregiver portal RLS (originally from migration 010)
--     Replace auth.uid() → user_id() in all policies and helpers.
--     Drop and recreate every policy from 010.
-- ══════════════════════════════════════════════════════════════════════════════

-- students: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view own students" ON students;
DROP POLICY IF EXISTS "Caregivers can update own students" ON students;

CREATE POLICY "Caregivers can view own students"
  ON students FOR SELECT
  USING (
    caregiver_id = caregiver_id_for_user()
    OR
    studio_id IN (SELECT id FROM studios WHERE owner_id = user_id())
  );

CREATE POLICY "Caregivers can update own students"
  ON students FOR UPDATE
  USING (caregiver_id = caregiver_id_for_user())
  WITH CHECK (caregiver_id = caregiver_id_for_user());

-- enrolments: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view own enrolments" ON enrolments;
CREATE POLICY "Caregivers can view own enrolments"
  ON enrolments FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
  );

-- invoices: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view own invoices" ON invoices;
CREATE POLICY "Caregivers can view own invoices"
  ON invoices FOR SELECT
  USING (
    parent_email = (SELECT email FROM profiles WHERE id = user_id())
    OR
    student_name IN (
      SELECT name FROM students WHERE caregiver_id = caregiver_id_for_user()
    )
  );

-- waiver_signatures: caregiver-scoped
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

-- announcements: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view announcements" ON announcements;
CREATE POLICY "Caregivers can view announcements"
  ON announcements FOR SELECT
  USING (
    is_studio_caregiver(studio_id)
    AND EXISTS (
      SELECT 1 FROM caregivers
      WHERE email = (SELECT email FROM profiles WHERE id = user_id())
        AND studio_id = announcements.studio_id
        AND receives_announcements = true
    )
  );

-- attendance_records: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view own attendance records" ON attendance_records;
CREATE POLICY "Caregivers can view own attendance records"
  ON attendance_records FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
  );

-- attendance_sessions: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view own attendance sessions" ON attendance_sessions;
CREATE POLICY "Caregivers can view own attendance sessions"
  ON attendance_sessions FOR SELECT
  USING (
    class_id = ANY(caregiver_class_ids())
  );

-- waiver_versions: caregiver can read published versions
DROP POLICY IF EXISTS "Caregivers can view published waiver versions" ON waiver_versions;
CREATE POLICY "Caregivers can view published waiver versions"
  ON waiver_versions FOR SELECT
  USING (
    published_at IS NOT NULL
    AND archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM waiver_templates wt
      WHERE wt.id = waiver_versions.waiver_template_id
        AND wt.studio_id IN (
          SELECT studio_id FROM caregivers
          WHERE email = (SELECT email FROM profiles WHERE id = user_id())
        )
    )
  );

-- waiver_templates: caregiver can view published templates
DROP POLICY IF EXISTS "Caregivers can view published waiver templates" ON waiver_templates;
CREATE POLICY "Caregivers can view published waiver templates"
  ON waiver_templates FOR SELECT
  USING (
    status = 'published'
    AND studio_id IN (
      SELECT studio_id FROM caregivers
      WHERE email = (SELECT email FROM profiles WHERE id = user_id())
    )
  );

-- caregivers: view/update own record
DROP POLICY IF EXISTS "Caregivers can view own record" ON caregivers;
DROP POLICY IF EXISTS "Caregivers can update own record" ON caregivers;

CREATE POLICY "Caregivers can view own record"
  ON caregivers FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = user_id())
  );

CREATE POLICY "Caregivers can update own record"
  ON caregivers FOR UPDATE
  USING (
    email = (SELECT email FROM profiles WHERE id = user_id())
  )
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = user_id())
  );

-- caregiver_audit_log: studio-scoped + caregiver self-read
DROP POLICY IF EXISTS caregiver_audit_log_studio_policy ON caregiver_audit_log;
DROP POLICY IF EXISTS "Caregivers can view own audit log" ON caregiver_audit_log;

CREATE POLICY caregiver_audit_log_studio_policy ON caregiver_audit_log
  FOR ALL USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ))
  WITH CHECK (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

CREATE POLICY "Caregivers can view own audit log"
  ON caregiver_audit_log FOR SELECT
  USING (
    caregiver_id = caregiver_id_for_user()
  );

-- uploaded_documents: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view own documents" ON uploaded_documents;
CREATE POLICY "Caregivers can view own documents"
  ON uploaded_documents FOR SELECT
  USING (
    student_id = ANY(caregiver_student_ids())
  );

-- recital_events: caregiver-scoped
DROP POLICY IF EXISTS "Caregivers can view recital events" ON recital_events;
CREATE POLICY "Caregivers can view recital events"
  ON recital_events FOR SELECT
  USING (
    is_studio_caregiver(studio_id)
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- 11. Payment RLS (originally from migration 011)
--     Replace auth.uid() → user_id()
-- ══════════════════════════════════════════════════════════════════════════════

-- invoices: admin full CRUD
DROP POLICY IF EXISTS "Admins can manage studio invoices" ON invoices;
CREATE POLICY "Admins can manage studio invoices"
  ON invoices FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
  );

-- invoices: caregiver view-only
DROP POLICY IF EXISTS "Caregivers can view own invoices" ON invoices;
CREATE POLICY "Caregivers can view own invoices"
  ON invoices FOR SELECT
  USING (
    caregiver_id = (
      SELECT id FROM caregivers
      WHERE email = (SELECT email FROM profiles WHERE id = user_id())
      LIMIT 1
    )
    OR parent_email = (SELECT email FROM profiles WHERE id = user_id())
  );

-- studio_settings: admin manage
DROP POLICY IF EXISTS "Admins can manage studio settings" ON studio_settings;
CREATE POLICY "Admins can manage studio settings"
  ON studio_settings FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
    OR studio_id = ''
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = user_id()
    )
    OR studio_id = ''
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- 12. Waiver versions caregiver policy (originally from migration 014)
--     Replace auth.uid() → user_id()
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Caregivers can view published waiver versions" ON waiver_versions;
CREATE POLICY "Caregivers can view published waiver versions"
  ON waiver_versions FOR SELECT
  USING (
    published_at IS NOT NULL
    AND archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM waiver_templates wt
      WHERE wt.id = waiver_versions.waiver_template_id
        AND wt.studio_id IN (
          SELECT studio_id FROM caregivers
          WHERE email = (SELECT email FROM profiles WHERE id = user_id())
        )
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- 13. Attendance staff RLS (originally from migration 015)
--     Replace auth.uid() → user_id()
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Studio staff manages attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS attendance_sessions_studio_policy ON attendance_sessions;
CREATE POLICY "Studio staff manages attendance sessions"
  ON attendance_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM studios WHERE id = attendance_sessions.studio_id AND owner_id = user_id())
    OR EXISTS (SELECT 1 FROM teachers WHERE studio_id = attendance_sessions.studio_id AND user_id = user_id())
  );

DROP POLICY IF EXISTS "Studio staff manages attendance records" ON attendance_records;
DROP POLICY IF EXISTS attendance_records_studio_policy ON attendance_records;
CREATE POLICY "Studio staff manages attendance records"
  ON attendance_records FOR ALL
  USING (
    EXISTS (SELECT 1 FROM studios WHERE id = attendance_records.studio_id AND owner_id = user_id())
    OR EXISTS (SELECT 1 FROM teachers WHERE studio_id = attendance_records.studio_id AND user_id = user_id())
  );

DROP POLICY IF EXISTS "Studio staff manages recital performances" ON recital_performances;
DROP POLICY IF EXISTS recital_performances_studio_policy ON recital_performances;
CREATE POLICY "Studio staff manages recital performances"
  ON recital_performances FOR ALL
  USING (
    EXISTS (SELECT 1 FROM studios WHERE id = recital_performances.studio_id AND owner_id = user_id())
    OR EXISTS (SELECT 1 FROM teachers WHERE studio_id = recital_performances.studio_id AND user_id = user_id())
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- 14. Invites RLS (originally from migration 017)
--     Replace user_id() — already correct, but drop/recreate for consistency
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS invites_studio_owner_policy ON invites;
DROP POLICY IF EXISTS invites_public_token_read ON invites;
DROP POLICY IF EXISTS invites_owner_update ON invites;
DROP POLICY IF EXISTS invites_owner_delete ON invites;

CREATE POLICY invites_studio_owner_policy ON invites
  FOR ALL
  USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ))
  WITH CHECK (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

CREATE POLICY invites_public_token_read ON invites
  FOR SELECT
  USING (true);

CREATE POLICY invites_owner_update ON invites
  FOR UPDATE
  USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));

CREATE POLICY invites_owner_delete ON invites
  FOR DELETE
  USING (studio_id IN (
    SELECT id FROM studios WHERE owner_id = user_id()
  ));


COMMIT;

-- ============================================================================
-- Verification (run manually against the project after applying):
--
--   -- As an authenticated Rork user:
--   SELECT user_id();                    -- should return the user's uuid
--   SELECT * FROM user_studio_ids();     -- should return owned studio ids
--   SELECT is_studio_owner('<studio_id>');  -- should return true for owner
--   SELECT is_studio_member('<studio_id>'); -- should return true for owner/staff
--
--   -- Verify all policies are recreated:
--   SELECT tablename, policyname FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ============================================================================
