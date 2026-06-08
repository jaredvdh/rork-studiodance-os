-- ============================================================================
-- Migration 015: Attendance staff RLS (teachers can mark attendance)
--
-- Migration 009 scoped attendance_sessions, attendance_records, and
-- recital_performances to the studio owner only, which blocked teachers from
-- marking attendance. This migration drops and recreates those three policies
-- so studio staff (owner OR a teacher linked to the studio) can manage them.
-- ============================================================================

BEGIN;

-- ── attendance_sessions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Studio owner manages attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS attendance_sessions_studio_policy ON attendance_sessions;
CREATE POLICY "Studio staff manages attendance sessions"
  ON attendance_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM studios WHERE id = attendance_sessions.studio_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teachers WHERE studio_id = attendance_sessions.studio_id AND user_id = auth.uid())
  );

-- ── attendance_records ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Studio owner manages attendance records" ON attendance_records;
DROP POLICY IF EXISTS attendance_records_studio_policy ON attendance_records;
CREATE POLICY "Studio staff manages attendance records"
  ON attendance_records FOR ALL
  USING (
    EXISTS (SELECT 1 FROM studios WHERE id = attendance_records.studio_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teachers WHERE studio_id = attendance_records.studio_id AND user_id = auth.uid())
  );

-- ── recital_performances ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Studio owner manages recital performances" ON recital_performances;
DROP POLICY IF EXISTS recital_performances_studio_policy ON recital_performances;
CREATE POLICY "Studio staff manages recital performances"
  ON recital_performances FOR ALL
  USING (
    EXISTS (SELECT 1 FROM studios WHERE id = recital_performances.studio_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teachers WHERE studio_id = recital_performances.studio_id AND user_id = auth.uid())
  );

COMMIT;
