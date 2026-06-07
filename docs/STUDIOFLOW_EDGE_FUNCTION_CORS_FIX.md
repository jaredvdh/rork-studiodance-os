# StudioFlow — Edge Function CORS Fix

## Problem

The browser blocked calls to Supabase Edge Functions with:

```
Access to fetch at https://<project>.supabase.co/functions/v1/demo-login
from origin https://p-h2o4xl61o2ik1fuisevjr.rork.live has been blocked by
CORS policy. Response to preflight request does not have HTTP ok status.
```

Each function had its own copy of CORS headers and OPTIONS handling. They were
inconsistent and fragile:

- `demo-login`, `seed-demo-data`, `send-announcement` used a **hardcoded**
  `Access-Control-Allow-Origin` pointing at one specific preview URL. Any other
  origin (new preview, localhost, custom domain) would be rejected by the
  browser.
- `ai-proxy`, `stripe-create-customer`, `stripe-create-checkout`,
  `stripe-webhook` used `Access-Control-Allow-Origin: "*"`.
- Headers and method lists differed per function, so requests sending
  `apikey` / `x-client-info` could fail preflight on some functions.

## Fix

### Shared helper: `backend/functions/_shared/cors.ts`

A single source of truth for CORS:

- **`corsHeaders(req)`** — reflects the incoming `Origin` header (so the
  rork.live preview, localhost, and any future custom domain all work without
  code edits). When an origin is present it also sets
  `Access-Control-Allow-Credentials: true`; with no origin (server-to-server,
  e.g. Stripe webhooks) it falls back to `*`.
- **`jsonCorsHeaders(req)`** — the above plus `Content-Type: application/json`.
- **`handlePreflight(req)`** — returns a `204` response with CORS headers for
  `OPTIONS`, or `null` so the caller continues. Called **before** any
  auth/body parsing.

Allowed methods: `GET, POST, OPTIONS`.
Allowed headers: `Content-Type, Authorization, apikey, x-client-info, stripe-signature`.
`Access-Control-Max-Age: 86400` is set so browsers cache the preflight.

### Functions updated

All seven Edge Functions now:

1. Call `handlePreflight(req)` first and return early for `OPTIONS`.
2. Attach `jsonCorsHeaders(req)` (or `corsHeaders(req)`) to **every** response,
   including errors.

| Function | Change |
| --- | --- |
| `demo-login` | Removed hardcoded origin; uses shared helper |
| `seed-demo-data` | Removed hardcoded origin; uses shared helper |
| `send-announcement` | Removed hardcoded origin; uses shared helper |
| `ai-proxy` | Replaced `*` headers; uses shared helper |
| `stripe-create-customer` | Replaced local `corsHeaders()`; uses shared helper |
| `stripe-create-checkout` | Replaced local `corsHeaders()`; uses shared helper |
| `stripe-webhook` | Replaced local `corsHeaders()`; uses shared helper (added headers to 405) |

## Scope / safety

- No changes to auth, RLS, migrations, payment logic, or demo data.
- POST behaviour is unchanged — only header construction and the OPTIONS short
  circuit were touched.
- `web-studioflow` build + static checks pass.

## Verification

- `runChecks` (web) passed: static checks + `bun run build`.
- Manual: after deploy, the browser preflight (`OPTIONS`) to
  `/functions/v1/demo-login` returns `204` with the reflected origin, and the
  follow-up `POST` succeeds without a CORS error.

> Note: if a preflight still 401s at the gateway level, confirm the function is
> deployed with JWT verification disabled for the public entrypoints
> (`demo-login`), since browsers never send an auth header on the `OPTIONS`
> preflight. The function-level CORS is now correct regardless.
