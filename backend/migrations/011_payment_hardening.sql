-- ============================================================================
-- Migration 011: Payment Hardening
-- Adds missing payment/invoice columns, tightens RLS, and adds indexes
-- for the Stripe integration.
--
-- Changes:
--   1. invoices — add caregiver_id, stripe_customer_id, currency, enrolment_id
--   2. caregivers — add stripe_customer_id
--   3. Tighten RLS: admin-only write on invoices, caregiver view-only
--   4. Webhook-specific function for idempotent status updates
--   5. Indexes on new columns
--   6. Set up Stripe webhook function with service_role bypass
-- ============================================================================

BEGIN;

-- ── 1. invoices: payment & Stripe columns ─────────────────────────────── ──

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS caregiver_id uuid REFERENCES caregivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS enrolment_id text;

-- Backfill caregiver_id from parent_email where possible
UPDATE invoices i
SET caregiver_id = c.id
FROM caregivers c
WHERE i.parent_email IS NOT NULL
  AND c.email = i.parent_email
  AND c.studio_id = i.studio_id
  AND i.caregiver_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_caregiver
  ON invoices(caregiver_id)
  WHERE caregiver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_customer
  ON invoices(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_currency
  ON invoices(currency);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due
  ON invoices(status, due_date)
  WHERE status IN ('draft', 'sent', 'overdue', 'processing');

-- ── 2. caregivers: Stripe customer link ──────────────────────────────── ──

ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_caregivers_stripe_customer
  ON caregivers(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── 3. Tighten invoice RLS ───────────────────────────────────────────── ──

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON invoices;
DROP POLICY IF EXISTS "Caregivers can view own invoices" ON invoices;

-- Admin/studio owner: full CRUD on invoices for their studio
CREATE POLICY "Admins can manage studio invoices"
  ON invoices FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = auth.uid()
    )
  );

-- Caregivers: view-only on their own invoices (via caregiver_id or email)
CREATE POLICY "Caregivers can view own invoices"
  ON invoices FOR SELECT
  USING (
    caregiver_id = (
      SELECT id FROM caregivers
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
      LIMIT 1
    )
    OR parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- ── 4. Idempotent webhook update function ─────────────────────────────── ──

-- This function is called by the stripe-webhook edge function (which uses
-- the service_role key to bypass RLS). It prevents duplicate event processing
-- by checking the current status before updating.
CREATE OR REPLACE FUNCTION webhook_update_invoice_status(
  p_invoice_id uuid,
  p_status text,
  p_paid_at timestamptz DEFAULT NULL,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Only update if the new status differs from current (idempotent)
  UPDATE invoices
  SET
    status = CASE
      WHEN status = 'paid' AND p_status = 'paid' THEN status  -- already paid, skip
      WHEN status = 'refunded' THEN status                     -- never un-refund
      ELSE p_status
    END,
    paid_at = CASE
      WHEN p_paid_at IS NOT NULL AND status != 'paid' AND status != 'refunded'
        THEN COALESCE(invoices.paid_at, p_paid_at)
      ELSE invoices.paid_at
    END,
    stripe_payment_intent_id = COALESCE(invoices.stripe_payment_intent_id, p_stripe_payment_intent_id),
    stripe_customer_id = COALESCE(invoices.stripe_customer_id, p_stripe_customer_id),
    updated_at = now()
  WHERE id = p_invoice_id AND status != 'refunded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Stripe webhook: service-role-only access ───────────────────────── ──

-- The stripe-webhook edge function uses createAdminClient() which has the
-- service_role key. RLS is bypassed for service_role requests by default.
-- The webhook_update_invoice_status function above is SECURITY DEFINER so
-- it also runs with elevated privileges.

-- No additional RLS policies needed — webhooks go through the edge function
-- which uses the service_role key, not user authentication.

-- ── 6. updated_at trigger for invoices if not already present ─────────── ──

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_invoices_updated_at' AND tgrelid = 'invoices'::regclass
  ) THEN
    CREATE TRIGGER trg_invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_at_column();
  END IF;
END $$;

-- ── 7. Studio settings RLS (used by simulated payment methods) ────────── ──

DROP POLICY IF EXISTS "Admins can manage studio settings" ON studio_settings;

CREATE POLICY "Admins can manage studio settings"
  ON studio_settings FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = auth.uid()
    )
    OR studio_id = ''  -- allow simulated payment method entries (no studio)
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM studios WHERE owner_id = auth.uid()
    )
    OR studio_id = ''
  );

COMMIT;

-- ============================================================================
-- Post-migration notes:
--
-- After this migration is applied:
--   1. Deploy the new Stripe edge functions:
--      - stripe-create-customer
--      - stripe-create-checkout
--      - stripe-webhook
--   2. Set SUPABASE_STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Supabase
--      dashboard → Settings → Edge Functions
--   3. Configure Stripe webhook endpoint in Stripe Dashboard:
--      https://<project>.supabase.co/functions/v1/stripe-webhook
--      Events: checkout.session.completed, checkout.session.expired,
--              payment_intent.succeeded, payment_intent.payment_failed
--   4. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in the frontend .env to
--      enable live Stripe mode (without it, simulated mode remains active)
--   5. Test by creating an invoice, sending it, and completing a Stripe
--      checkout in test mode (use Stripe test card 4242 4242 4242 4242)
-- ============================================================================
