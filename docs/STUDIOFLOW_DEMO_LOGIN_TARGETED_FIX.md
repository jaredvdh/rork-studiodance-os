# StudioFlow — Targeted Demo Login Fixes

## Summary

Hardened the separation between demo mode and real Supabase-backed auth so demo
sessions never touch production data, never attach their synthetic JWT to
Supabase requests, and reliably load seeded `demo.ts` data. Live auth, RLS, and
payment security logic were not changed.

## What changed

### 1. Central demo-mode helper — `web-studioflow/src/lib/demoMode.ts` (new)

- `isDemoMode()` — framework-free check that reads the persisted session from
  `localStorage` (`rork:user_meta` first, then decodes the `rork:access_token`
  JWT payload for `is_demo`). Safe to call outside React.
- `isDemoUser(user)` — convenience check against a user object's `isDemo` flag,
  for use inside React components/hooks.

### 2. No demo JWTs attached to Supabase — `web-studioflow/src/lib/supabase.ts`

- `authenticatedFetch` now short-circuits when `isDemoMode()` is true and issues
  a plain `fetch` with no `Authorization` header. The synthetic, unsigned demo
  token is never sent to Supabase (it would be rejected and could leak the demo
  session into RLS-evaluated requests).

### 3. Demo-safe hooks — `web-studioflow/src/data/supabaseHooks.ts`

- `useSupabaseCaregiverStudents` now returns seeded demo students linked to the
  demo parent (resolved from `parentAccounts[0]` via `childIds` /
  `caregiverId`) instead of an empty array, so the parent demo portal shows real
  seeded children.
- `useSyncProfile` is now disabled in demo mode (`enabled: !!user && !isDemo`
  and an early `return null` in the query fn), preventing a production `profiles`
  upsert from demo users.

## Files changed

- `web-studioflow/src/lib/demoMode.ts` (new)
- `web-studioflow/src/lib/supabase.ts`
- `web-studioflow/src/data/supabaseHooks.ts`

## Demo / real separation status

- **Demo login**: validated client-side, issues a synthetic JWT, loads `demo.ts`
  data. No Supabase Auth or Rork JWT required.
- **Demo queries**: `useDualQuery` already short-circuits to seeded data when
  `isDemo` is true; the caregiver-students gap is now closed.
- **Demo writes**: blocked — profile sync disabled; existing store mutations
  already guard on `isDemo`; no `Authorization` header is sent to Supabase.
- **Real users**: unchanged — caregiver-scoped Supabase queries and RLS behaviour
  are preserved; the JWT is still attached for non-demo sessions.

## Not touched (per scope)

- Live OAuth / email auth flows, refresh logic.
- RLS policies and migrations.
- Stripe / payment security logic.
- iOS app (remains demo-only).

## Commands run

- `runChecks` (web-studioflow): static checks + `bun run build` — **passed**.

## Remaining risks

- Demo detection relies on `localStorage`; clearing storage mid-session reverts
  to a signed-out state (expected).
- If a real Rork JWT ever carried `is_demo`, it would be treated as demo — this
  matches the intended contract from the auth layer.
