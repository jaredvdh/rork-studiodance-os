-- ============================================================================
-- Migration 014: Fix caregiver "view published waiver versions" RLS policy
-- ----------------------------------------------------------------------------
-- Problem
--   Migration 010 created the policy "Caregivers can view published waiver
--   versions" on waiver_versions referencing columns that do NOT exist on that
--   table:
--     • waiver_versions.template_id   → real column is waiver_template_id
--     • status = 'published'          → waiver_versions has no status column;
--                                       publication is tracked by published_at
--                                       (set) and archived_at (null) instead.
--   As written, that policy never matches, so caregivers cannot read published
--   waiver content in the parent/member portal.
--
-- Fix
--   Drop and recreate the policy using the correct columns:
--     • published_at IS NOT NULL  AND archived_at IS NULL  (= published)
--     • join on waiver_versions.waiver_template_id
--
-- Notes
--   • waiver_templates DOES have a status column, so migration 010's
--     "Caregivers can view published waiver templates" policy is correct and is
--     intentionally left unchanged here.
--   • auth.uid() resolves to the validated Rork (or native) JWT sub — see
--     migration 012. RLS remains fully enforced; this only fixes column names.
-- ============================================================================

BEGIN;

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
          WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
        )
    )
  );

COMMIT;
