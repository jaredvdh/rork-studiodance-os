-- ============================================================================
-- Migration 005: Costume Management Suite
-- Adds costume library, student measurements, vendor ordering, delivery
-- tracking, alterations, distribution, reusable inventory, and rental system.
-- ============================================================================

-- 1. costumes — central costume library
CREATE TABLE IF NOT EXISTS costumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  vendor text,
  season text,
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN (
      'ballet', 'jazz', 'tap', 'contemporary', 'lyrical',
      'acro', 'hip_hop', 'musical_theatre', 'other'
    )),
  colour text,
  description text,
  images text[] DEFAULT '{}',
  vendor_pdf_url text,
  sizing_chart_pdf_url text,
  care_instructions text,
  wholesale_cost_cents integer NOT NULL DEFAULT 0,
  shipping_allocation_cents integer NOT NULL DEFAULT 0,
  markup_pct numeric(5,1) NOT NULL DEFAULT 30.0,
  retail_cost_cents integer GENERATED ALWAYS AS (
    (wholesale_cost_cents + shipping_allocation_cents) +
    ROUND((wholesale_cost_cents + shipping_allocation_cents) * markup_pct / 100.0)
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costumes_studio_id ON costumes(studio_id);
CREATE INDEX IF NOT EXISTS idx_costumes_category ON costumes(studio_id, category);

-- 2. costume_assignments — link costumes to classes, routines, or students
CREATE TABLE IF NOT EXISTS costume_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  recital_performance_id uuid,  -- FK after recitals
  routine_name text,
  assigned_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costume_assign_studio ON costume_assignments(studio_id);
CREATE INDEX IF NOT EXISTS idx_costume_assign_costume ON costume_assignments(costume_id);
CREATE INDEX IF NOT EXISTS idx_costume_assign_class ON costume_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_costume_assign_student ON costume_assignments(student_id);

-- 3. student_measurements — measurement profiles
CREATE TABLE IF NOT EXISTS student_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  height_cm numeric(5,1),
  weight_kg numeric(4,1),
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hips_cm numeric(5,1),
  girth_cm numeric(5,1),
  inseam_cm numeric(5,1),
  shoe_size text,
  measured_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  measured_at timestamptz,
  submitted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_measure_studio ON student_measurements(studio_id);
CREATE INDEX IF NOT EXISTS idx_student_measure_student ON student_measurements(student_id, created_at DESC);
-- One approved measurement per student is typical, but allow resubmission

-- 4. sizing_charts — vendor sizing references for AI auto-sizing
CREATE TABLE IF NOT EXISTS sizing_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  costume_id uuid REFERENCES costumes(id) ON DELETE CASCADE,
  vendor text NOT NULL,
  chart_name text NOT NULL,
  chart_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  file_url text,
  file_type text CHECK (file_type IN ('pdf', 'csv', 'excel', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sizing_charts_studio ON sizing_charts(studio_id);
CREATE INDEX IF NOT EXISTS idx_sizing_charts_costume ON sizing_charts(costume_id);

-- 5. size_recommendations — AI or manual size suggestions per student-costume
CREATE TABLE IF NOT EXISTS size_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  sizing_chart_id uuid REFERENCES sizing_charts(id) ON DELETE SET NULL,
  recommended_size text,
  confidence_pct integer CHECK (confidence_pct BETWEEN 0 AND 100),
  alternative_size text,
  reason text,
  flags text[] DEFAULT '{}',
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  parent_approved boolean NOT NULL DEFAULT false,
  parent_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_size_recs_studio ON size_recommendations(studio_id);
CREATE INDEX IF NOT EXISTS idx_size_recs_student ON size_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_size_recs_costume ON size_recommendations(costume_id);

-- 6. costume_fees — billing integration
CREATE TABLE IF NOT EXISTS costume_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  fee_type text NOT NULL DEFAULT 'full'
    CHECK (fee_type IN ('included_in_tuition', 'full', 'deposit_balance', 'installment')),
  total_cents integer NOT NULL,
  paid_cents integer NOT NULL DEFAULT 0,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid', 'partial', 'paid', 'waived')),
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costume_fees_studio ON costume_fees(studio_id);
CREATE INDEX IF NOT EXISTS idx_costume_fees_student ON costume_fees(student_id);

-- 7. vendor_orders — bulk purchase orders grouped by vendor
CREATE TABLE IF NOT EXISTS vendor_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  vendor text NOT NULL,
  po_number text,
  order_date timestamptz,
  expected_delivery timestamptz,
  actual_delivery timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ordered', 'shipped', 'delivered', 'quality_checked', 'ready', 'distributed', 'cancelled')),
  vendor_notes text,
  shipping_cost_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_orders_studio ON vendor_orders(studio_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_status ON vendor_orders(studio_id, status);

-- 8. vendor_order_items — line items per order
CREATE TABLE IF NOT EXISTS vendor_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id uuid NOT NULL REFERENCES vendor_orders(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_order_items_order ON vendor_order_items(vendor_order_id);

-- 9. alterations — alteration workflow
CREATE TABLE IF NOT EXISTS alterations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  alteration_type text NOT NULL,
  assigned_to text,
  due_date timestamptz,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'complete', 'delivered')),
  notes text,
  photos text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alterations_studio ON alterations(studio_id);
CREATE INDEX IF NOT EXISTS idx_alterations_status ON alterations(studio_id, status);

-- 10. costume_distributions — distribution day checklists
CREATE TABLE IF NOT EXISTS costume_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  items_checklist jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{label, checked}]
  signature_data text,
  signed_by text,
  signed_at timestamptz,
  missing_items text[] DEFAULT '{}',
  notes text,
  receipt_pdf_url text,
  distributed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costume_dist_studio ON costume_distributions(studio_id);
CREATE INDEX IF NOT EXISTS idx_costume_dist_student ON costume_distributions(student_id);

-- 11. reusable_inventory — costume inventory for reuse
CREATE TABLE IF NOT EXISTS reusable_costumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  size text NOT NULL,
  condition text NOT NULL DEFAULT 'good'
    CHECK (condition IN ('excellent', 'good', 'fair', 'damaged', 'retired')),
  purchase_date timestamptz,
  last_used timestamptz,
  storage_bin text,
  rack_number text,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'damaged', 'retired')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reusable_studio ON reusable_costumes(studio_id);
CREATE INDEX IF NOT EXISTS idx_reusable_status ON reusable_costumes(studio_id, status);

-- 12. costume_rentals — rental system
CREATE TABLE IF NOT EXISTS costume_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES reusable_costumes(id) ON DELETE SET NULL,
  costume_id uuid NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  rental_fee_cents integer NOT NULL DEFAULT 0,
  deposit_cents integer NOT NULL DEFAULT 0,
  return_date timestamptz,
  returned_at timestamptz,
  damage_fee_cents integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'returned', 'overdue', 'damaged', 'lost')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costume_rentals_studio ON costume_rentals(studio_id);
CREATE INDEX IF NOT EXISTS idx_costume_rentals_status ON costume_rentals(studio_id, status);

-- 13. quick_change_analysis — recital quick-change conflict detection
CREATE TABLE IF NOT EXISTS quick_change_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  recital_event_id uuid REFERENCES recital_events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  routine_a text,
  routine_a_end_time text,
  routine_b text,
  routine_b_start_time text,
  estimated_change_minutes integer,
  conflict_detected boolean NOT NULL DEFAULT false,
  recommendation text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(studio_id, recital_event_id, student_id, routine_a, routine_b)
);

CREATE INDEX IF NOT EXISTS idx_quick_change_studio ON quick_change_analyses(studio_id);

-- ── RLS Policies ─────────────────────────────────────────────────────────

-- Helper: owner of a studio should have full access
-- Profiles.studio_id links the user to their studio
CREATE OR REPLACE FUNCTION is_studio_owner(studio_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND studio_id = $1 AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_studio_member(studio_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND studio_id = $1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Apply RLS to all costume tables
ALTER TABLE costumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizing_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reusable_costumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_change_analyses ENABLE ROW LEVEL SECURITY;

-- Policies: studio owners/admins get full access; caregivers see their children's data
-- Each table scoped by studio_id

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'costumes', 'costume_assignments', 'sizing_charts', 'vendor_orders',
    'vendor_order_items', 'alterations', 'reusable_costumes'
  ] LOOP
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

  -- Tables with student-specific visibility for caregivers
  FOREACH tbl IN ARRAY ARRAY[
    'student_measurements', 'size_recommendations', 'costume_fees',
    'costume_distributions', 'costume_rentals'
  ] LOOP
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
            JOIN parents p ON s.parent_id = p.id
            WHERE s.id = %1$s.student_id
              AND p.id::text = auth.uid()::text
          )
        )
    ', tbl);
  END LOOP;

  -- quick_change_analyses: admin full, read for members
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

-- ── Triggers ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_costumes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'costumes', 'costume_fees', 'vendor_orders', 'alterations',
    'reusable_costumes', 'costume_rentals', 'size_recommendations'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%1$s_updated_at
           BEFORE UPDATE ON %1$s
           FOR EACH ROW EXECUTE FUNCTION trg_costumes_updated_at()',
        tbl
      );
    END IF;
  END LOOP;
END $$;
