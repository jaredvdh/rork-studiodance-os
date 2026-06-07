# StudioFlow — Environment Variables

A complete inventory of every environment variable / secret StudioFlow uses,
where it lives, whether it is safe to expose to the browser, and what breaks
without it.

> **Golden rule:** anything prefixed `EXPO_PUBLIC_` is **inlined into the client
> bundle** and is therefore public. Real secrets (Stripe secret key, Supabase
> service-role key, Resend key, Stripe webhook secret, AI toolkit key) live
> **only** as Supabase Edge Function secrets and are never referenced from
> client code.

---

## 1. Web app (client) — `web-studioflow`

These are read via `import.meta.env.*` and **shipped in the browser bundle**.
Only non-sensitive, public values belong here.

| Variable | Required | Purpose | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase REST/auth/storage/edge-function base URL | Public by design |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Public anon key for the Supabase client | Public by design; RLS protects data |
| `EXPO_PUBLIC_RORK_AUTH_URL` | ✅ Yes | Rork Auth OAuth endpoint (Google/Apple sign-in) | Public |
| `EXPO_PUBLIC_RORK_APP_KEY` | ✅ Yes | Identifies the app to Rork Auth | Public app identifier |
| `EXPO_PUBLIC_RORK_FUNCTIONS_URL` | ⬜ Optional | Rork functions base URL | Public |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⬜ Optional | Enables **live** Stripe mode. If unset/placeholder → simulated mode | Publishable keys are safe for the client |
| `EXPO_PUBLIC_PROJECT_ID` | ⬜ Optional | Rork project id | Public |
| `EXPO_PUBLIC_TEAM_ID` | ⬜ Optional | Rork team id | Public |
| `EXPO_PUBLIC_TOOLKIT_URL` | ⬜ Legacy | Was used for direct client AI calls | **No longer referenced by client code** (moved server-side) |
| `EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY` | ⬜ Legacy | Was used for direct client AI calls | **No longer referenced by client code** — see §3. Keep out of production client env |

Startup validation lives in `web-studioflow/src/lib/env.ts` (`validateEnvironment()`,
called from `main.tsx`). Missing **required** vars log a clear console error;
missing Stripe key logs a "simulated payments" warning.

---

## 2. Supabase Edge Function secrets (server-side only)

Set these in **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
(or `supabase secrets set KEY=value`). They are **never** exposed to the browser.

| Secret | Used by | Purpose | If missing |
|---|---|---|---|
| `SUPABASE_URL` | all functions | Supabase project URL (server) | Functions fail |
| `SUPABASE_ANON_KEY` | `_shared/auth.ts` (`createUserClient`) | RLS-scoped server client | User-scoped calls fail |
| `SUPABASE_SERVICE_ROLE_KEY` | `_shared/auth.ts` (`createAdminClient`) | Service-role client that bypasses RLS for webhooks/seeding | Webhooks & demo seeding fail |
| `SUPABASE_STRIPE_SECRET_KEY` | `stripe-create-customer`, `stripe-create-checkout`, `stripe-webhook` | Real Stripe API calls | Returns `503 Stripe not configured` |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | Verifies Stripe webhook signatures | Webhook returns `400 not configured` |
| `RESEND_API_KEY` | `send-announcement` | Transactional email delivery | Falls back to log-only (no emails sent) |
| `RORK_TOOLKIT_URL` | `ai-proxy` | AI proxy base URL | AI features return `503` |
| `RORK_TOOLKIT_SECRET_KEY` | `ai-proxy` | AI proxy credit-bearing key | AI features return `503` |

> The AI toolkit key was **moved out of the client** in Phase 4. It now lives
> only as an `ai-proxy` edge function secret. See §3.

---

## 3. AI toolkit key — moved server-side (Phase 4)

**Before:** `ai.ts` and `autoSizing.ts` called the Rork AI toolkit directly from
the browser using `EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY`, which inlined a
credit-bearing key into the client bundle.

**After:**
- New edge function `backend/functions/ai-proxy/index.ts` holds the key
  server-side (`RORK_TOOLKIT_URL`, `RORK_TOOLKIT_SECRET_KEY`) and requires a
  valid authenticated user (`requireAuth`).
- Client calls go through `web-studioflow/src/lib/aiClient.ts` →
  `POST {SUPABASE_URL}/functions/v1/ai-proxy` with the user's auth token only.
- The client no longer references the toolkit key, so Vite no longer bundles it.

**Action for production:** Do **not** set `EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY`
(or `EXPO_PUBLIC_TOOLKIT_URL`) in the deployed client environment. Instead set
`RORK_TOOLKIT_URL` and `RORK_TOOLKIT_SECRET_KEY` as Supabase edge-function
secrets and deploy the `ai-proxy` function.

---

## 4. Demo-only configuration

Demo mode requires **no extra environment variables**. Demo accounts are
hard-coded in `backend/functions/demo-login/index.ts` and seeded into demo-only
rows (`is_demo = true`). The client detects demo sessions via
`web-studioflow/src/lib/demoMode.ts` and never attaches demo tokens to Supabase.

---

## 5. Quick checklist before going live

- [ ] `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in client env
- [ ] `EXPO_PUBLIC_RORK_AUTH_URL`, `EXPO_PUBLIC_RORK_APP_KEY` set in client env
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` set (only when ready for live payments)
- [ ] `EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY` / `EXPO_PUBLIC_TOOLKIT_URL` **removed** from client env
- [ ] Supabase secrets set: service-role, Stripe secret, Stripe webhook secret, Resend, toolkit URL + key
- [ ] All edge functions deployed (`ai-proxy`, `stripe-*`, `send-announcement`, `demo-login`, `seed-demo-data`)
- [ ] Stripe webhook endpoint configured in Stripe Dashboard
