-- ============================================================================
-- Migration 006: Global Unit System, Notifications & Costume Images
-- Adds studio-level and profile-level unit preferences, in-app notification
-- feed, and multi-image support for the costume library.
-- ============================================================================

-- 1. Add preferred_units to studio_settings (as jsonb key for flexibility)
-- The studio_settings.settings jsonb column already exists. This migration
-- adds a standardised preferred_units key via an idempotent merge.
UPDATE studio_settings
SET settings = settings || '{"preferred_units":"metric"}'::jsonb
WHERE settings->>'preferred_units' IS NULL;

-- 2. Add preferred_units to profiles (parent-level override)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_units text
DEFAULT 'metric'
CHECK (preferred_units IN ('metric', 'imperial'));

COMMENT ON COLUMN profiles.preferred_units IS
  'Unit system preference for the user — metric (cm/kg) or imperial (ft-in/lb). Stored independently from studio default so parents can override.';

-- 3. Notifications table — in-app notification feed
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL
    CHECK (type IN (
      'costume_assigned', 'delivery_update', 'fee_due', 'fee_overdue',
      'measurement_requested', 'measurement_rejected', 'measurement_approved',
      'size_approved', 'size_changed', 'distribution_ready',
      'alteration_complete', 'announcement', 'system'
    )),
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  target_url text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_studio
  ON notifications(studio_id, created_at DESC);

-- 4. Costume images table — multiple images per costume with sort order
CREATE TABLE IF NOT EXISTS costume_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costume_images_costume
  ON costume_images(costume_id, sort_order);

-- 5. Add a unit field annotation to sizing_chart_rows (stored in chart_data jsonb)
-- Existing chart_data is jsonb; we document that each row may include a "unit"
-- field but don't force migration of existing data. New charts should include it.

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Notifications: user can see their own; studio admins can see all for their studio
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_self_policy ON notifications
  FOR SELECT USING (user_id = (SELECT user_id()));

CREATE POLICY notifications_studio_admin_policy ON notifications
  FOR ALL USING (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = (SELECT user_id())
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = (SELECT user_id())
    )
  );

-- Costume images: studio-scoped, readable by studio members
ALTER TABLE costume_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY costume_images_studio_policy ON costume_images
  FOR ALL USING (
    costume_id IN (
      SELECT id FROM costumes WHERE studio_id IN (
        SELECT studio_id FROM profiles WHERE id = (SELECT user_id())
      )
    )
  )
  WITH CHECK (
    costume_id IN (
      SELECT id FROM costumes WHERE studio_id IN (
        SELECT studio_id FROM profiles WHERE id = (SELECT user_id())
      )
    )
  );

-- ============================================================================
-- Helper function: create a notification
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_studio_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_target_url text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (studio_id, user_id, type, title, body, metadata, target_url)
  VALUES (p_studio_id, p_user_id, p_type, p_title, p_body, p_metadata, p_target_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Add new tables to the costume RLS registration set (if re-running phase 5)
-- ============================================================================
-- The 005 migration's RLS block already covers its tables. These two are
-- covered by the inline policies above.
