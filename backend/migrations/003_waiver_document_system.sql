-- ============================================================================
-- Migration 003: Waiver & Document Compliance System
-- Adds waiver templates, versioning, digital signatures, and external document storage
-- ============================================================================

-- 1. waiver_templates — studio-defined waiver/form templates
CREATE TABLE IF NOT EXISTS waiver_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'custom'
    CHECK (type IN (
      'liability', 'medical_consent', 'photo_video', 'code_of_conduct',
      'privacy_data', 'payment_auth', 'travel_consent', 'event_release', 'custom'
    )),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  current_version_id uuid, -- FK added after waiver_versions table
  required boolean NOT NULL DEFAULT false,
  applies_to jsonb DEFAULT '{"scope":"all"}'::jsonb,
  renewal_period text NOT NULL DEFAULT 'once'
    CHECK (renewal_period IN ('once', 'annual', 'per_season', 'per_event')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiver_templates_studio_id ON waiver_templates(studio_id);
CREATE INDEX IF NOT EXISTS idx_waiver_templates_status ON waiver_templates(studio_id, status);

-- 2. waiver_versions — versioned content for each template
CREATE TABLE IF NOT EXISTS waiver_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_template_id uuid NOT NULL REFERENCES waiver_templates(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  body_html text,
  body_markdown text,
  published_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Now add the FK from waiver_templates.current_version_id
ALTER TABLE waiver_templates
  ADD CONSTRAINT fk_waiver_templates_current_version
  FOREIGN KEY (current_version_id) REFERENCES waiver_versions(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_waiver_versions_template ON waiver_versions(waiver_template_id, version_number);
CREATE INDEX IF NOT EXISTS idx_waiver_versions_studio ON waiver_versions(studio_id);

-- 3. waiver_signatures — immutable signed waiver records
CREATE TABLE IF NOT EXISTS waiver_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  waiver_template_id uuid NOT NULL REFERENCES waiver_templates(id) ON DELETE RESTRICT,
  waiver_version_id uuid NOT NULL REFERENCES waiver_versions(id) ON DELETE RESTRICT,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  signer_name text NOT NULL,
  signer_relationship text,
  signature_type text NOT NULL DEFAULT 'typed'
    CHECK (signature_type IN ('typed', 'drawn')),
  signature_data text, -- base64 for drawn, null for typed
  guardian_authority_confirmed boolean NOT NULL DEFAULT false,
  e_sign_consent boolean NOT NULL DEFAULT false,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'signed'
    CHECK (status IN ('signed', 'expired', 'revoked')),
  pdf_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiver_signatures_studio ON waiver_signatures(studio_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_student ON waiver_signatures(student_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_caregiver ON waiver_signatures(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_template ON waiver_signatures(waiver_template_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_status ON waiver_signatures(student_id, status);

-- Partial unique: one active signed record per student per template
CREATE UNIQUE INDEX IF NOT EXISTS idx_waiver_signatures_active_student_template
  ON waiver_signatures(student_id, waiver_template_id)
  WHERE status = 'signed';

-- Prevent deleting signed records (immutable audit trail)
CREATE OR REPLACE FUNCTION prevent_waiver_signature_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Cannot delete signed waiver records. Use revoke instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_waiver_delete ON waiver_signatures;
CREATE TRIGGER trg_prevent_waiver_delete
  BEFORE DELETE ON waiver_signatures
  FOR EACH ROW
  WHEN (OLD.status = 'signed')
  EXECUTE FUNCTION prevent_waiver_signature_delete();

-- 4. uploaded_documents — external scanned/paper documents
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  family_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  event_id uuid REFERENCES recital_events(id) ON DELETE SET NULL,
  document_type text NOT NULL
    CHECK (document_type IN (
      'scanned_waiver', 'signed_pdf', 'medical_plan', 'allergy_plan',
      'custody_court', 'travel_consent', 'competition_release',
      'insurance', 'custom'
    )),
  title text NOT NULL,
  file_url text,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  expiry_date timestamptz,
  notes text,
  visibility text NOT NULL DEFAULT 'caregiver_visible'
    CHECK (visibility IN ('admin_only', 'caregiver_visible', 'staff_visible')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_docs_studio ON uploaded_documents(studio_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_student ON uploaded_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_family ON uploaded_documents(family_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_status ON uploaded_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_expiry ON uploaded_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- 5. Updated-at triggers
CREATE OR REPLACE FUNCTION update_waiver_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_waiver_templates_updated_at ON waiver_templates;
CREATE TRIGGER trg_waiver_templates_updated_at
  BEFORE UPDATE ON waiver_templates
  FOR EACH ROW EXECUTE FUNCTION update_waiver_updated_at();

DROP TRIGGER IF EXISTS trg_uploaded_docs_updated_at ON uploaded_documents;
CREATE TRIGGER trunc_uploaded_docs_updated_at
  BEFORE UPDATE ON uploaded_documents
  FOR EACH ROW EXECUTE FUNCTION update_waiver_updated_at();

-- 6. RLS policies

-- waiver_templates: studio-scoped
ALTER TABLE waiver_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY waiver_templates_studio_policy ON waiver_templates
  FOR ALL USING (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ));

-- waiver_versions: studio-scoped
ALTER TABLE waiver_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY waiver_versions_studio_policy ON waiver_versions
  FOR ALL USING (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ));

-- waiver_signatures: studio-scoped for admin; caregiver-scoped for parent
ALTER TABLE waiver_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY waiver_signatures_admin_policy ON waiver_signatures
  FOR ALL USING (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ));

-- uploaded_documents: studio-scoped
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY uploaded_docs_studio_policy ON uploaded_documents
  FOR ALL USING (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ))
  WITH CHECK (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = (select user_id())
  ));

-- 7. Storage buckets (note: buckets are created via Supabase dashboard or management API;
--    this comment documents the expected bucket configuration)

-- Bucket: waiver-documents
--   - Public: false
--   - Allowed MIME types: application/pdf, image/png, image/jpeg, image/webp
--   - File size limit: 10 MB
--   - RLS policy: authenticated users can read their studio's documents

-- Bucket: uploaded-family-documents
--   - Public: false
--   - Allowed MIME types: application/pdf, image/png, image/jpeg, image/webp
--   - File size limit: 25 MB
--   - RLS policy: admin read/write; caregiver can read own family's documents

-- Bucket: medical-documents
--   - Public: false
--   - Allowed MIME types: application/pdf, image/png, image/jpeg
--   - File size limit: 10 MB
--   - RLS policy: admin-only access by default; caregiver with can_view_medical_notes = true

-- 8. Helper function: check if a student has outstanding required waivers
CREATE OR REPLACE FUNCTION student_has_outstanding_waivers(p_student_id uuid, p_studio_id uuid)
RETURNS boolean AS $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM waiver_templates wt
  WHERE wt.studio_id = p_studio_id
    AND wt.status = 'published'
    AND wt.required = true
    AND NOT EXISTS (
      SELECT 1 FROM waiver_signatures ws
      WHERE ws.student_id = p_student_id
        AND ws.waiver_template_id = wt.id
        AND ws.status = 'signed'
        AND ws.waiver_version_id = COALESCE(wt.current_version_id, ws.waiver_version_id)
    );
  RETURN missing_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;
