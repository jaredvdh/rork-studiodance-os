# StudioFlow — Phase 4: Production Readiness & Security Cleanup

Scope: production safety, secrets, RLS verification, storage policies, and
environment configuration. **No new user-facing features.** iOS untouched
(remains demo-only — see §9). Auth, RLS, caregiver privacy, payment security and
demo isolation were preserved or strengthened, never weakened.

---

## 1. Environment variable audit

Full inventory created in **`docs/STUDIOFLOW_ENVIRONMENT_VARIABLES.md`**.

Summary:
- **Required client vars:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_RORK_AUTH_URL`, `EXPO_PUBLIC_RORK_APP_KEY`.
- **Optional client vars:** `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (enables live payments), `EXPO_PUBLIC_RORK_FUNCTIONS_URL`, `EXPO_PUBLIC_PROJECT_ID`, `EXPO_PUBLIC_TEAM_ID`.
- **Server-only secrets (edge functions):** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RORK_TOOLKIT_URL`, `RORK_TOOLKIT_SECRET_KEY`.
- **Demo-only:** none — demo needs no extra env.

A startup validator (`web-studioflow/src/lib/env.ts`) now logs clear errors for
missing required vars and a warning when payments are simulated.

---

## 2. Secret exposure cleanup

Searched the client for `SECRET`, `PRIVATE`, `SERVICE_ROLE`, `STRIPE_SECRET`,
`RORK_TOOLKIT_SECRET`, `API_KEY`.

| Finding | Status |
|---|---|
| Stripe **secret** key | ✅ Server-only (`Deno.env.get("SUPABASE_STRIPE_SECRET_KEY")` in 3 edge functions) |
| Supabase **service-role** key | ✅ Server-only (`createAdminClient` in `_shared/auth.ts`) |
| Stripe **webhook** secret | ✅ Server-only (`stripe-webhook`) |
| Resend API key | ✅ Server-only (`send-announcement`) |
| **`EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY`** | ⚠️ **Was** bundled into the client (`ai.ts`, `autoSizing.ts`) → **FIXED**, see below |

### Fix: AI toolkit key moved server-side
- Added edge function **`backend/functions/ai-proxy/index.ts`** — authenticated
  (`requireAuth`), reads `RORK_TOOLKIT_URL` + `RORK_TOOLKIT_SECRET_KEY` from
  server env, proxies chat completions. Clamps `max_tokens`, returns clear
  `503` when unconfigured and `401` when unauthenticated.
- Added **`web-studioflow/src/lib/aiClient.ts`** — sends only the user's auth
  token to `ai-proxy`; exposes `isAIConfigured()` and `aiChatCompletion()`.
- Refactored **`ai.ts`** and **`autoSizing.ts`** to use `aiClient`; removed all
  direct `EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY` / `EXPO_PUBLIC_TOOLKIT_URL`
  references. Vite no longer inlines the key into the bundle.

Result: **no service-role, private, or credit-bearing key remains in client code.**

---

## 3. RLS verification (code/policy audit)

Verified across migrations `000`, `004`, `009`, `010`, `011`.

| Scenario | Enforced by | Verdict |
|---|---|---|
| Admin accesses own studio data | `*_studio_policy` (000) — `studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid())` | ✅ |
| Admin **cannot** access another studio | Same policy scopes by the admin's own `profiles.studio_id` | ✅ |
| Caregiver sees only linked students | `students` policy via `caregiver_id_for_user()` (010) | ✅ |
| Caregiver sees only own enrolments / attendance | `caregiver_student_ids()` (010) | ✅ |
| Caregiver sees only own invoices | `invoices` SELECT via `caregiver_id`/`parent_email` (011) | ✅ |
| Caregiver waivers / announcements scoped | `waiver_*`, announcements `receives_announcements` (010) | ✅ |
| Anonymous user blocked | RLS enabled on all tables; policies require `auth.uid()` | ✅ |
| Invoice writes admin-only | `"Admins can manage studio invoices"` (`studios.owner_id = auth.uid()`) (011) | ✅ |
| Webhook updates invoices server-side only | `stripe-webhook` uses `createAdminClient()` (service-role); idempotent `webhook_update_invoice_status` is `SECURITY DEFINER` (011) | ✅ |

**Dependency note:** caregiver-scoped RLS relies on Supabase trusting the Rork
JWT so `auth.uid()` resolves. Until the Rork JWKS is configured in Supabase
(documented since Phase 1 in `lib/supabase.ts`), `auth.uid()` is null for Rork
OAuth users and caregiver queries return empty rather than leaking — a
fail-closed posture. This remains the top production prerequisite (§8).

---

## 4. Production guardrails

- **Env validation** (`lib/env.ts`, run from `main.tsx`): clear console errors
  for missing required vars; never throws (UI still renders).
- **Payment mode visibility:** `IS_STRIPE_SIMULATED` is env-derived (Phase 3);
  `Payments.tsx` shows "Connect Stripe" and "setup incomplete" banners; the env
  validator warns when simulated.
- **Demo isolation (preserved):**
  - `demoMode.ts` detects demo sessions from localStorage/JWT.
  - `lib/supabase.ts` never attaches the demo JWT to Supabase requests.
  - `useDualQuery` short-circuits to demo data when `isDemo` (no network).
  - `studioStore.tsx` guards all writes with `!user.isDemo`; `useSyncProfile`
    skips upserts for demo users.
  - Conclusion: **demo users cannot write to or read production tables.**

---

## 5. Supabase Storage audit

All buckets created **private** in migration `004` (no public/anon policies).

| Bucket | Access model | Sensitivity |
|---|---|---|
| `studio-logos` | Studio members (path `studio_id/...`) | Low (branding) |
| `waiver-documents` | Studio members | Medium |
| `student-documents` | Studio members | Medium |
| `medical-files` | **Admins only** (`role = 'admin'`) | High — tightened |
| `recital-exports` | Studio members | Low |
| `migration-files` | Studio members | Medium (imported CSVs) |

Path convention `studio_id/category/file` enforced by policies using
`storage.foldername(name)[1]`. `medical-files` has a dedicated admin-only policy
set. **Minor risk:** `storage.ts` uses `getPublicUrl()` for display; since
buckets are private these resolve only for authorized sessions — consider
switching to `createSignedUrl()` for medical/waiver files (noted in §8).

---

## 6. Deployment readiness

- **Rork preview:** works today; uses preview Supabase + Rork Auth. Simulated
  payments unless a publishable key is set.
- **Vercel/Netlify:** set the four required `EXPO_PUBLIC_*` client vars; do
  **not** set the toolkit key client-side. Build: `bun run build` → `dist/`.
- **Supabase:** apply migrations `000`–`011` in order; set all edge-function
  secrets (§2); deploy `ai-proxy`, `stripe-create-customer`,
  `stripe-create-checkout`, `stripe-webhook`, `send-announcement`, `demo-login`,
  `seed-demo-data`.
- **Stripe webhook:** endpoint `https://<project>.supabase.co/functions/v1/stripe-webhook`;
  events `checkout.session.completed`, `checkout.session.expired`,
  `payment_intent.succeeded`, `payment_intent.payment_failed`; set
  `STRIPE_WEBHOOK_SECRET`.
- **Custom domain:** update `demo-login`/`send-announcement` hard-coded
  `CORS_ORIGIN` (currently the `*.rork.live` preview origin) to the production
  origin before go-live (noted in §8).

---

## 7. Commands run

- `runChecks({ appPath: "web-studioflow" })` → **static checks + `bun run build` passed.**

---

## 8. Remaining risks / follow-ups

1. **Rork JWT trust in Supabase (highest priority):** configure Supabase to
   trust Rork's JWKS so `auth.uid()` resolves for OAuth users; otherwise
   RLS-scoped reads return empty for real Rork-auth users.
2. **CORS origins:** `demo-login` and `send-announcement` hard-code the preview
   origin — update for production domain.
3. **Signed URLs for sensitive files:** prefer `createSignedUrl()` over
   `getPublicUrl()` for `medical-files`/`waiver-documents`.
4. **AI proxy auth for email/password users:** `ai-proxy` verifies Rork JWTs;
   Supabase-email-only admins would get `401`. AI features degrade gracefully
   (they are optional). Revisit if email auth becomes a primary path.
5. **`studio_settings` simulated-payment rows** use `studio_id = ''`; acceptable
   for simulated mode but should be removed once live payment methods land.

---

## 9. iOS status

Untouched in Phase 4. The iOS app (`ios-studioflow`) remains **demo-only** with
local sample data and no production Supabase/Stripe wiring. No secrets are
embedded in the iOS target. Production integration is out of scope until a later
phase.

---

## Files changed

**Added**
- `backend/functions/ai-proxy/index.ts` — server-side AI proxy
- `web-studioflow/src/lib/aiClient.ts` — client caller for the proxy
- `web-studioflow/src/lib/env.ts` — startup env validation
- `docs/STUDIOFLOW_ENVIRONMENT_VARIABLES.md`
- `docs/STUDIOFLOW_PHASE_4_PRODUCTION_SECURITY.md`

**Modified**
- `web-studioflow/src/lib/ai.ts` — use `aiClient`, drop client toolkit key
- `web-studioflow/src/lib/autoSizing.ts` — use `aiClient`, drop client toolkit key
- `web-studioflow/src/main.tsx` — call `validateEnvironment()` at startup
