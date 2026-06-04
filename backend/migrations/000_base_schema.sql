-- ============================================================================
-- Migration 000: Base Schema (StudioFlow)
-- ----------------------------------------------------------------------------
-- Recreates the foundational StudioFlow schema for a fresh Supabase project.
-- This represents the schema BEFORE migrations 001/002/003 are applied.
-- Apply order on a new project:
--   000_base_schema.sql
--   001_enrolments_hardening.sql
--   002_child_registration_fields.sql
--   003_waiver_document_system.sql
--
-- Derived from backend/types.ts (the auto-generated client types).
-- ============================================================================

-- ── Helper: current authenticated user id ──────────────────────────────────
-- Used by RLS policies across the schema. Wraps auth.uid().
CREATE OR REPLACE FUNCTION user_id()
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- ── profiles (1:1 with auth.users) ──────────────────────────────────────────
-- studio_id FK added after studios exists (avoids circular dependency).
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  role text,                 -- 'admin' | 'caregiver' | 'staff'
  avatar_url text,
  studio_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── studios ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_color text,
  city text,
  initials text,
  logo_url text,
  tagline text,
  vertical text,             -- 'dance' | 'crossfit' | etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Now wire profiles.studio_id → studios.id
ALTER TABLE profiles
  ADD CONSTRAINT profiles_studio_id_fkey
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE SET NULL;

-- ── teachers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  hourly_rate_cents integer,
  pay_type text,             -- 'hourly' | 'salary' | 'per_class'
  styles text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── parents (families) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  child_ids text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── classes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  style text NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  age_group text,
  capacity integer,
  enrolled integer DEFAULT 0,
  waitlist integer DEFAULT 0,
  day text,
  start_time text,
  duration_mins integer,
  room text,
  price_cents integer,
  in_recital boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── students ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  dob date,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  parent_name text,
  parent_email text,
  class_ids text[],
  allergies text,
  medical_notes text,
  waiver text,               -- legacy single-status field
  payment text,
  balance_cents integer DEFAULT 0,
  attendance_rate numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── enrolments (base shape; hardened in 001) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ── invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  parent_name text,
  description text,
  amount_cents integer,
  status text,               -- 'draft' | 'sent' | 'paid' | 'overdue'
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── announcements ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  audience text,
  scope text,
  reach integer,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── recital_events ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recital_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date,
  venue text,
  costume_deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── activity_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL,
  user_id uuid,
  event text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- ── import_history ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text,
  file_name text,
  file_type text,
  total_rows integer,
  imported_rows integer,
  skipped_rows integer,
  error_count integer,
  errors jsonb,
  snapshot jsonb,
  rolled_back boolean DEFAULT false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── studio_settings (1:1 with studio) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL UNIQUE REFERENCES studios(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teachers_studio       ON teachers(studio_id);
CREATE INDEX IF NOT EXISTS idx_parents_studio         ON parents(studio_id);
CREATE INDEX IF NOT EXISTS idx_classes_studio         ON classes(studio_id);
CREATE INDEX IF NOT EXISTS idx_students_studio        ON students(studio_id);
CREATE INDEX IF NOT EXISTS idx_students_parent        ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_studio      ON enrolments(studio_id);
CREATE INDEX IF NOT EXISTS idx_invoices_studio        ON invoices(studio_id);
CREATE INDEX IF NOT EXISTS idx_announcements_studio   ON announcements(studio_id);
CREATE INDEX IF NOT EXISTS idx_recital_events_studio  ON recital_events(studio_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_studio   ON activity_logs(studio_id);
CREATE INDEX IF NOT EXISTS idx_profiles_studio        ON profiles(studio_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Studio-scoped: a user can access rows for the studio on their profile.
-- profiles: a user can always read/update their own profile row.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_policy ON profiles
  FOR ALL USING (id = (select user_id()))
  WITH CHECK (id = (select user_id()));

DO $$
DECLARE
  t text;
  studio_scoped text[] := ARRAY[
    'studios','teachers','parents','classes','students','enrolments',
    'invoices','announcements','recital_events','activity_logs',
    'import_history','studio_settings'
  ];
  col text;
BEGIN
  FOREACH t IN ARRAY studio_scoped LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    -- studios keys on id; everything else keys on studio_id
    col := CASE WHEN t = 'studios' THEN 'id' ELSE 'studio_id' END;
    EXECUTE format($f$
      CREATE POLICY %1$s_studio_policy ON %1$I
        FOR ALL USING (%2$I IN (
          SELECT studio_id FROM profiles WHERE id = (select user_id())
        ))
        WITH CHECK (%2$I IN (
          SELECT studio_id FROM profiles WHERE id = (select user_id())
        ));
    $f$, t, col);
  END LOOP;
END $$;

-- ── Auto-create profile on new auth user (optional convenience trigger) ───────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
