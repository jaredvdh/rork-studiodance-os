# StudioFlow Phase 3 — Payments & Billing Readiness

## Status: ✅ Complete

Build: Passed (web-studioflow)
Date: 2026-06-07

---

## What was changed

### 1. `IS_STRIPE_SIMULATED` — Hardcoded → Environment-Controlled

**Before:** `export const IS_STRIPE_SIMULATED = true;` — always simulated regardless of config.

**After:** Runtime-derived from `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`:
- If the env var is unset, empty, or contains a placeholder prefix (`pk_test_placeholder`, `pk_placeholder`) → simulated mode
- If a real key is set → live mode

No code changes needed to toggle — just set or unset the env var.

### 2. Stripe Edge Functions (New)

Three new Supabase Edge Functions were created:

| Function | Purpose | Auth |
|----------|---------|------|
| `stripe-create-customer` | Creates/retrieves Stripe customer for a caregiver. Stores `stripe_customer_id` on the caregivers record. | Rork Auth (user JWT) |
| `stripe-create-checkout` | Creates a Stripe Checkout Session for an invoice. Updates invoice to `processing`, stores `stripe_payment_intent_id`. Returns checkout URL. | Rork Auth (user JWT) |
| `stripe-webhook` | Handles Stripe webhook events. Verifies webhook signature via HMAC-SHA256. Uses `service_role` key (bypasses RLS). Updates invoice status (paid/failed/expired). | Stripe signature verification |

**Secrets required (set in Supabase Dashboard → Edge Functions):**
- `SUPABASE_STRIPE_SECRET_KEY` — Stripe secret key for API calls
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

**No Stripe secret keys are exposed to the client.** The publishable key (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is the only Stripe key in frontend code.

### 3. Database Migration (`011_payment_hardening.sql`)

Adds:
| Table | New Column | Type | Purpose |
|-------|-----------|------|---------|
| invoices | `caregiver_id` | uuid FK → caregivers | Direct link to caregiver for RLS |
| invoices | `stripe_customer_id` | text | Stripe customer reference |
| invoices | `currency` | text (default 'usd') | ISO currency code |
| invoices | `enrolment_id` | text | Link to specific enrolment |
| caregivers | `stripe_customer_id` | text | Stripe customer for the caregiver |

Also adds:
- **`webhook_update_invoice_status()`** — idempotent PL/pgSQL function for webhook updates. Prevents duplicate events from corrupting invoice state. Uses `SECURITY DEFINER`.
- Indexes on `caregiver_id`, `stripe_customer_id`, `currency`, and compound `(status, due_date)` for invoice views.
- Backfill of `caregiver_id` from `parent_email` where possible.

### 4. RLS Policies (Tightened)

**Invoices:**
- **Admins/owners**: Full CRUD via `"Admins can manage studio invoices"` — scoped by `studio_id IN (SELECT id FROM studios WHERE owner_id = auth.uid())`
- **Caregivers**: View-only via `"Caregivers can view own invoices"` — scoped by `caregiver_id` match or `parent_email` match against the authenticated user's profile email
- **Webhooks**: Use `service_role` key via `createAdminClient()` — bypasses RLS entirely. The `webhook_update_invoice_status()` function is `SECURITY DEFINER`.

**Studio Settings (for simulated payment methods):**
- Admins can manage; also allows `studio_id = ''` for simulated payment method entries.

### 5. UI States

Both `Payments.tsx` (admin) and `ParentPayments.tsx` (caregiver) now support:

| State | Visual | When |
|-------|--------|------|
| **Draft** | Muted gray chip | Invoice created, not yet sent |
| **Sent** | Blue chip with mail icon | Sent to caregiver |
| **Due** | Amber chip with clock | Payment expected |
| **Overdue** | Red chip with alert | Past due date |
| **Processing** | Amber pulsing chip with spinner | Checkout session created, awaiting payment |
| **Paid** | Green chip with check | Payment confirmed |
| **Failed** | Red chip with X | Payment attempt failed |
| **Refunded** | Plum chip | Refund issued |
| **Demo/Simulated** | Purple banner with TestTube icon | `IS_STRIPE_SIMULATED = true` |

### 6. Graceful Error Handling

- **Missing Stripe config**: Shows `ShieldAlert` banner when live key is set but backend secret is not configured
- **Failed checkout creation**: Reverts invoice from `processing` back to `sent` on error, shows toast with error message
- **Webhook signature mismatch**: Returns 400 with "Invalid webhook signature"
- **Duplicate webhook events**: `webhook_update_invoice_status()` is idempotent — won't overwrite `paid` with `paid` or `refunded` with anything
- **Stripe not configured (503)**: Edge functions return clear "Stripe is not configured" message
- **Checkout URL redirect handling**: `ParentPayments` reads `?status=success` or `?status=cancelled` from URL params after Stripe redirect, shows appropriate toast, and cleans the URL

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `backend/functions/stripe-create-customer/index.ts` | Stripe customer creation edge function |
| `backend/functions/stripe-create-checkout/index.ts` | Stripe checkout session creation edge function |
| `backend/functions/stripe-webhook/index.ts` | Stripe webhook handler |
| `backend/migrations/011_payment_hardening.sql` | Schema, RLS, and index migration |

### Modified Files
| File | Changes |
|------|---------|
| `web-studioflow/src/lib/stripe.ts` | Env-controlled `IS_STRIPE_SIMULATED`, added `getOrCreateCustomer()`, `InvoiceStatus` now includes `"processing"`, `sendInvoice()` returns `checkoutUrl`, improved error handling throughout |
| `web-studioflow/src/pages/Payments.tsx` | Demo mode banner, `processing` status UI with pulsing animation, retry button for failed invoices, Stripe-not-configured warning, better mutation error handling |
| `web-studioflow/src/pages/parent/ParentPayments.tsx` | Demo mode banner, `processing` filter tab, Stripe checkout redirect handling (`?status=success/cancelled`), `processing` loader icon, retry button for failed payments, error messages from mutations |
| `backend/types.ts` | Added `caregiver_id`, `stripe_customer_id`, `currency`, `enrolment_id` to invoices; added `stripe_customer_id` to caregivers |
| `web-studioflow/src/integrations/supabase/types.ts` | Same schema updates as backend/types.ts |

---

## Auth/RLS Summary

| Operation | Actor | RLS Policy | Status |
|-----------|-------|-----------|--------|
| View all studio invoices | Admin/Owner | `"Admins can manage studio invoices"` (studio_id match via owner_id) | ✅ Active |
| Create/edit/delete invoices | Admin/Owner | Same policy — full CRUD WITH CHECK | ✅ Active |
| View own invoices | Caregiver | `"Caregivers can view own invoices"` (caregiver_id or parent_email match) | ✅ Active |
| Pay invoice | Caregiver | Via edge function (auth required) → service_role update | ✅ Active |
| Webhook status update | Stripe | `service_role` key → `SECURITY DEFINER` function | ✅ Active |
| Simulated payment methods | Any | `studio_settings` policy allows `studio_id = ''` | ✅ Active |

---

## Remaining Risks

1. **Stripe secret key must be configured**: Until `SUPABASE_STRIPE_SECRET_KEY` is set in Supabase, all live-mode operations will return 503. Simulated mode continues to work.

2. **Webhook URL must be configured in Stripe Dashboard**: Point Stripe webhooks to `https://<project>.supabase.co/functions/v1/stripe-webhook` with events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`.

3. **Stripe Elements not integrated**: The `AddCardForm` in `ParentPayments` collects raw card details in demo mode only. In production, Stripe Elements (or the hosted checkout page via `sendInvoice`) should be used. The checkout flow via `sendInvoice` → `stripe-create-checkout` uses Stripe's hosted checkout page, which is PCI-compliant.

4. **Auto-recover/auto-pay**: The UI shows placeholder banners for these features. They require scheduled Supabase Edge Functions (cron) which are not yet built.

5. **iOS remains demo-only**: Per Phase 1 scope, the iOS app is not yet integrated with the Stripe backend.

---

## Commands Run

```bash
runChecks({ appPath: "web-studioflow" }) → Passed ✅
```

---

## Deployment Checklist (for go-live)

- [ ] Set `SUPABASE_STRIPE_SECRET_KEY` in Supabase Dashboard → Edge Functions
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Supabase Dashboard → Edge Functions
- [ ] Set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env` (e.g., `pk_live_...` or `pk_test_...`)
- [ ] Deploy edge functions: `stripe-create-customer`, `stripe-create-checkout`, `stripe-webhook`
- [ ] Apply migration `011_payment_hardening.sql` to Supabase
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard
- [ ] Test with Stripe test mode: create invoice → send → complete test checkout (card 4242...)
- [ ] Verify webhook delivery in Stripe Dashboard → Webhooks
