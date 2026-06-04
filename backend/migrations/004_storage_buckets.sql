-- ============================================================================
-- Migration 004: Storage Buckets & Policies
-- ----------------------------------------------------------------------------
-- Creates the private storage buckets StudioFlow uses and the row-level
-- policies that scope access by studio_id.
--
-- Bucket names MUST match web-studioflow/src/lib/storage.ts (STORAGE_BUCKETS):
--   studio-logos       — studio branding images
--   waiver-documents   — signed-waiver PDF/HTML snapshots
--   student-documents  — general per-student documents
--   medical-files      — sensitive medical plans / allergy docs
--   recital-exports    — generated recital programmes / exports
--   migration-files    — uploaded CSVs and import snapshots
--
-- Path convention (enforced by policies): studio_id/category/file_name
--   e.g. 6f1c.../waivers/Jane_Doe/1700000000_waiver.html
--   The FIRST path segment is always the owning studio_id.
--
-- Safe to run on a fresh database and safe if partially applied
-- (idempotent inserts + drop-before-create policies).
-- ============================================================================

-- 1. Create buckets (all private). Re-running updates limits without error.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('studio-logos',      'studio-logos',      false, 5242880,
    ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('waiver-documents',  'waiver-documents',  false, 10485760,
    ARRAY['application/pdf','image/png','image/jpeg','image/webp','text/html']),
  ('student-documents', 'student-documents', false, 26214400,
    ARRAY['application/pdf','image/png','image/jpeg','image/webp']),
  ('medical-files',     'medical-files',     false, 10485760,
    ARRAY['application/pdf','image/png','image/jpeg']),
  ('recital-exports',   'recital-exports',   false, 52428800,
    ARRAY['application/pdf','text/csv','application/zip','image/png']),
  ('migration-files',   'migration-files',   false, 26214400,
    ARRAY['text/csv','application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/json'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Helper: the set of studio_ids the current user belongs to (via profiles).
--    Used by the storage policies below; mirrors the table RLS pattern.
CREATE OR REPLACE FUNCTION user_studio_ids()
RETURNS SETOF uuid AS $$
  SELECT studio_id FROM profiles WHERE id = (select auth.uid()) AND studio_id IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- 3. Policies on storage.objects.
--    The first folder of the object path must equal one of the user's studio_ids.
--    `medical-files` is admin-only (role = 'admin'); other buckets allow any
--    authenticated member of the studio (admins, staff, linked caregivers).
--    No bucket is public — there are no anon/public policies.

-- Studio-scoped buckets: members of the studio can read/write their studio's files.
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

-- Sensitive bucket: medical-files — admins of the owning studio only.
DROP POLICY IF EXISTS medical_files_admin_read ON storage.objects;
DROP POLICY IF EXISTS medical_files_admin_write ON storage.objects;
DROP POLICY IF EXISTS medical_files_admin_update ON storage.objects;
DROP POLICY IF EXISTS medical_files_admin_delete ON storage.objects;

CREATE POLICY medical_files_admin_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT studio_id FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin' AND studio_id IS NOT NULL
    )
  );

CREATE POLICY medical_files_admin_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT studio_id FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin' AND studio_id IS NOT NULL
    )
  );

CREATE POLICY medical_files_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT studio_id FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin' AND studio_id IS NOT NULL
    )
  );

CREATE POLICY medical_files_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'medical-files'
    AND ((storage.foldername(name))[1])::uuid IN (
      SELECT studio_id FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin' AND studio_id IS NOT NULL
    )
  );
