# StudioFlow — Edge Function URL Fix

## Problem

Demo login (and other Edge Function calls) failed with:

```
POST https://mxrhokaqfmfwesnzbhui.supabase.co/rest/v1//functions/v1/demo-login 401 Unauthorized
```

## Root cause

Edge Function URLs were built by appending `/functions/v1/<name>` directly to
`EXPO_PUBLIC_SUPABASE_URL`. That env var is configured with a `/rest/v1` suffix
(the PostgREST endpoint) and/or a trailing slash, so the result became:

```
.../rest/v1//functions/v1/demo-login   ❌  (double slash + wrong path)
```

Edge Functions are served from `${PROJECT_URL}/functions/v1/<name>`, not under
the REST path.

## Fix

Added a single normalising builder: `web-studioflow/src/lib/supabaseFunctions.ts`

- `getFunctionUrl(name)` strips trailing slashes and any `/rest/v1` or
  `/functions/v1` suffix from the configured URL, reducing it to the bare
  project origin, then returns `${origin}/functions/v1/<name>`.
- `isFunctionsConfigured()` reports whether a valid Supabase URL is set.
- No double slashes are possible regardless of how the env var is set.

### Callers routed through the helper

| File | Function(s) |
|------|-------------|
| `src/hooks/useAuth.tsx` | `demo-login` |
| `src/pages/DemoLogin.tsx` | `demo-login` |
| `src/components/DemoBadge.tsx` | `seed-demo-data` |
| `src/lib/aiClient.ts` | `ai-proxy` |
| `src/lib/stripe.ts` | base for `stripe-create-customer`, `stripe-create-checkout`, `stripe-webhook`, `send-announcement` |

All now resolve to `https://<project-ref>.supabase.co/functions/v1/<name>`.

## Out of scope (unchanged)

- RLS policies and migration 012 (Rork third-party auth trust)
- Payment / Stripe business logic
- Auth sign-in flows and token handling
- Demo isolation guarantees

## Validation

- `runChecks` (web-studioflow): static checks + `bun run build` passed.
