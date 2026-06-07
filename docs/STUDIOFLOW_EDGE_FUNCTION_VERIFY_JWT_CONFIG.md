# StudioFlow — Edge Function `verify_jwt` / Gateway Auth Configuration

## TL;DR

In this Rork-managed Supabase project, **JWT verification is already OFF at the
Supabase gateway for every Edge Function** — this is how Rork's
`deployEdgeFunction` deploys them. The gateway never blocks a request (or its
CORS `OPTIONS` preflight) for a missing/invalid JWT. Each function instead
enforces its own auth in code via `backend/functions/_shared/auth.ts`.

Therefore the CORS preflight `401` cannot be caused by gateway JWT enforcement
in this setup. Preflight `OPTIONS` requests reach the function and are answered
`204` by `handlePreflight()`. The earlier `401`s were caused by the malformed
function URL (`/rest/v1//functions/v1/...`, fixed) and CORS header
inconsistencies (fixed), not by `verify_jwt`.

**No code or deploy changes are required for this task.** This document records
the configuration, why it is correct, and the exact steps to control
`verify_jwt` if the project is ever deployed outside Rork (Supabase CLI /
self-hosted).

---

## 1. How deploy/config works here

This project has **no `supabase/config.toml`** and no per-function deploy
manifest in the repo. Edge Functions are deployed by Rork's `deployEdgeFunction`
tool, which (per the Rork Supabase backend contract) deploys with:

> **JWT verification is OFF at the gateway — functions must handle their own
> auth using the `_shared/auth.ts` helper (`requireAuth`, `createUserClient`,
> `createAdminClient`).**

Implications:

- Every function is effectively `verify_jwt = false` at the gateway.
- A browser `OPTIONS` preflight (which carries **no** `Authorization` header)
  is never rejected by the gateway and always reaches the function code, where
  `handlePreflight(req)` returns `204` before any auth/body parsing.
- Real (`POST`) requests are authenticated **inside** each function, not by the
  gateway.

---

## 2. Function-by-function classification

| Function                 | Browser-callable | Gateway `verify_jwt` | In-function auth                                  | Correct? |
| ------------------------ | ---------------- | -------------------- | ------------------------------------------------- | -------- |
| `demo-login`             | Yes (public)     | off                  | None — validates hardcoded demo credentials only  | ✅ Correct — must be public so demo users with no Supabase/Rork session can sign in |
| `seed-demo-data`         | Yes (intentional)| off                  | None — uses `createAdminClient` (service role)    | ⚠️ Works; callable without a user token. See §4 hardening note. |
| `ai-proxy`               | Yes              | off                  | `requireAuth(req)` — verifies Rork JWT via JWKS   | ✅ Protected in code |
| `stripe-create-customer` | Yes              | off                  | `requireAuth(req)`                                | ✅ Protected in code |
| `stripe-create-checkout` | Yes              | off                  | `requireAuth(req)`                                | ✅ Protected in code |
| `send-announcement`      | Yes              | off                  | `requireAuth(req)`                                | ✅ Protected in code |
| `stripe-webhook`         | No (Stripe → server) | off              | **Stripe signature** via `STRIPE_WEBHOOK_SECRET`  | ✅ Correct — must NOT require a user JWT |

### Public functions (intentionally no JWT)

- **`demo-login`** — entry point for demo sign-in. The caller has no Supabase
  Auth session and no Rork JWT yet, so it must be reachable without auth. It
  only ever returns demo data and an unsigned demo token; it performs no
  privileged action on behalf of a real user.
- **`seed-demo-data`** — seeds the fixed demo studios. Browser-callable by
  design so the demo experience can self-heal, but see the hardening note in §4.

### Protected functions (verify the Rork JWT in code)

`ai-proxy`, `stripe-create-customer`, `stripe-create-checkout`, and
`send-announcement` all call `requireAuth(req)` first, which verifies the
`Authorization: Bearer <token>` against Rork's JWKS
(`https://api.rork.com/.well-known/jwks.json`, issuer `https://api.rork.com`).
An unauthenticated `POST` returns `401` **from the function** (with CORS
headers), which is the desired behavior.

### Stripe webhook

`stripe-webhook` must never require a normal user JWT — Stripe signs requests
with the `stripe-signature` header instead. The function:

- handles the `OPTIONS` preflight,
- rejects requests when `STRIPE_WEBHOOK_SECRET` is unset (`Webhook not
  configured`),
- verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` and
  enforces a timestamp tolerance (replay protection),
- uses `createAdminClient()` (service role) to update invoices server-side.

`stripe-signature` is already in the allowed CORS request headers in
`_shared/cors.ts`.

---

## 3. Controlling `verify_jwt` outside Rork (CLI / self-hosted reference)

You do **not** need this for the Rork-managed deployment. Keep it for the day
the project is exported and deployed with the Supabase CLI, where the gateway
**does** enforce `verify_jwt = true` by default (which would 401 the CORS
preflight on public functions).

### Option A — `supabase/config.toml` (recommended for CLI deploys)

```toml
# supabase/config.toml

[functions.demo-login]
verify_jwt = false

[functions.seed-demo-data]
verify_jwt = false

[functions.stripe-webhook]
verify_jwt = false

# Protected functions: leave verify_jwt at its default (true) OR set false and
# rely on the in-code requireAuth() guard. These functions already verify the
# Rork JWT themselves, so either is safe. To keep behaviour identical to the
# current Rork deployment (gateway off, code enforces auth), set false:
[functions.ai-proxy]
verify_jwt = false

[functions.stripe-create-customer]
verify_jwt = false

[functions.stripe-create-checkout]
verify_jwt = false

[functions.send-announcement]
verify_jwt = false
```

> Note: the Rork gateway verifies against **Rork** JWTs (JWKS), not Supabase's
> own GoTrue JWT. Supabase's native `verify_jwt = true` checks a Supabase-issued
> JWT, which these Rork-authenticated requests do not carry. So on a CLI/self-
> hosted deploy you must set `verify_jwt = false` for the protected functions
> too and continue relying on the in-code `requireAuth()` guard — otherwise the
> gateway would reject valid Rork-authenticated requests.

### Option B — per-deploy flag

```bash
supabase functions deploy demo-login       --no-verify-jwt
supabase functions deploy seed-demo-data   --no-verify-jwt
supabase functions deploy stripe-webhook   --no-verify-jwt
supabase functions deploy ai-proxy         --no-verify-jwt
supabase functions deploy stripe-create-customer --no-verify-jwt
supabase functions deploy stripe-create-checkout --no-verify-jwt
supabase functions deploy send-announcement      --no-verify-jwt
```

In both cases, the in-code auth (`requireAuth` for protected functions, Stripe
signature for the webhook) is the real enforcement boundary — exactly as it is
today on Rork.

---

## 4. Hardening note — `seed-demo-data`

`seed-demo-data` is browser-callable and runs with the service-role client and
no `requireAuth`/secret guard. It only writes the fixed demo studios/data, so
the blast radius is limited, but it is technically invocable by anyone who knows
the URL. This is **not changed here** (task scope: do not change business
logic), but recommended follow-ups:

- gate it behind a shared secret header checked in-code, or
- restrict it to demo identifiers only (already the case), and/or
- disable/remove it in production environments.

---

## 5. Verification

- Code audit of all 7 functions confirms: `handlePreflight()` runs first in
  every function; protected functions call `requireAuth()`; the webhook uses
  signature verification; public functions intentionally skip auth.
- The CORS preflight cannot 401 at the gateway in the Rork deployment because
  gateway JWT verification is off for all functions.
- No business logic, auth, RLS, migration, payments, or demo-data code was
  modified for this task (documentation only).
