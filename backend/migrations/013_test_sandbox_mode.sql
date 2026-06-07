-- ============================================================================
-- Migration 013: Test / Sandbox Mode
-- ----------------------------------------------------------------------------
-- Purpose
--   Adds a durable, filterable marker for sandbox/test studios so the team can
--   create real, Supabase-backed test studios (exercising the true production
--   data flow + RLS) and safely delete them later.
--
--   Test studios are created by the `test-studio` Edge Function using
--   service_role. The function provisions a real native Supabase Auth user
--   (so auth.uid() resolves and every existing RLS policy works unchanged),
--   a profile, a studio, and (optionally) realistic per-vertical sample data.
--
-- What this migration does
--   1. studios.is_test   boolean default false  — marks a studio as sandbox
--   2. profiles.is_test  boolean default false  — marks the test admin/portal
--      auth users so cleanup can target only test identities
--   3. Helpful partial indexes for fast filtering of test rows
--
-- Safety
--   • No RLS changes. Existing studio-scoped + caregiver-scoped policies are
--     untouched. Test studios are isolated exactly like any real studio.
--   • is_test defaults to false, so all existing/real data is unaffected.
--   • Deleting a studio row cascades to every studio_id-scoped table
--     (ON DELETE CASCADE in the base schema + later migrations), so removing a
--     test studio removes its teachers, classes, students, caregivers,
--     enrolments, invoices, announcements, waivers, costumes, attendance, etc.
-- ============================================================================

BEGIN;

-- ── 1. Mark studios as test/sandbox ─────────────────────────────────────────
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- ── 2. Mark test auth identities (admin + portal caregivers/members) ────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- ── 3. Fast filtering of sandbox data ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_studios_is_test
  ON studios(is_test) WHERE is_test = true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_test
  ON profiles(is_test) WHERE is_test = true;

COMMIT;

-- ============================================================================
-- Notes
--   • The test-studio Edge Function is the only writer of is_test = true.
--   • Cleanup ("Delete Test Studio Data") verifies studios.is_test = true
--     before deleting, then removes the studio (cascade) and the test
--     profiles/auth users (profiles.is_test = true) it provisioned.
-- ============================================================================
