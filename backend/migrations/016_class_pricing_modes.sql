-- ============================================================================
-- Migration 016: Class Pricing Modes
-- ----------------------------------------------------------------------------
-- Adds flexible, studio-realistic billing to the classes table. Previously
-- every class implied an individual price (price_cents). Many studios bill by
-- term/season/membership/tuition or invoice manually, so a single required
-- price is wrong.
--
-- New columns (all additive, safe defaults):
--   pricing_mode       'price' | 'included' | 'none'  (default 'price')
--     • price    — explicit amount in price_cents + billing_frequency label
--     • included — folded into tuition/membership (no separate charge)
--     • none     — pricing hidden (trials, rehearsals, comp groups, manual)
--   billing_frequency  free-text label for 'price' mode: 'month', 'term',
--                       'season', 'drop-in', or any custom label
--   included_label     display label for 'included' mode, e.g.
--                       'Included in tuition' / 'Included in membership'
--
-- Existing rows keep working: pricing_mode defaults to 'price' so price_cents
-- continues to display exactly as before.
-- ============================================================================

BEGIN;

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'price'
    CHECK (pricing_mode IN ('price', 'included', 'none')),
  ADD COLUMN IF NOT EXISTS billing_frequency text,
  ADD COLUMN IF NOT EXISTS included_label text;

COMMENT ON COLUMN classes.pricing_mode IS
  'Billing mode: price (explicit price_cents), included (in tuition/membership), or none (hidden).';
COMMENT ON COLUMN classes.billing_frequency IS
  'Billing frequency/label for price mode: month, term, season, drop-in, or custom.';
COMMENT ON COLUMN classes.included_label IS
  'Display label for included mode, e.g. "Included in tuition".';

COMMIT;
