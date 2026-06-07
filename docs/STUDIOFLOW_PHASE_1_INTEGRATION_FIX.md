# StudioFlow Phase 1 Integration Hardening — Complete

**Date**: 2026-06-07  
**Status**: ✅ All 6 tasks complete — build passing

---

## 1. Auth Integration — Rork Auth ↔ Supabase RLS

### Problem
- Rork Auth JWT was stored in localStorage but never passed to Supabase REST calls
- `auth.uid()` returned null in RLS policies for Rork-authenticated users
- The backend `createUserClient()` passed the header but the frontend client didn't

### Fix
**File**: `web-studioflow/src/lib/supabase.ts`

- Added a custom `authenticatedFetch` wrapper that injects the Rork JWT from localStorage into every Supabase REST request's `Authorization` header
- The wrapper only injects when no existing Supabase session header is present (avoids clobbering email/password sessions)
- Passed `global: { fetch: authenticatedFetch }` when creating the Supabase client
- Added inline documentation explaining how to configure Supabase to validate Rork JWTs:

> **Required Supabase config**: Dashboard → Authentication → Settings → JWT Settings → Add External JWT Secret / JWKS URL: `https://api.rork.com/.well-known/jwks.json`

### Auth/RLS Status
| Path | Mechanism | RLS with Rork JWT |
|------|-----------|-------------------|
| Frontend direct Supabase calls | `authenticatedFetch` passes Rork JWT | ✅ Works IF Supabase configured with Rork JWKS |
| Backend edge functions (user) | `createUserClient` passes Authorization header | ✅ Same as above |
| Backend edge functions (admin) | `createAdminClient` uses service_role | ⚠️ Bypasses RLS entirely — functions must enforce auth |
| Supabase Auth (email/password) | Supabase native session | ✅ Full RLS support always |

---

## 2. Studio Creation / Onboarding Persistence

### Problem
- Studio data was stored ONLY in localStorage (`studioflow_studio` key)
- No Supabase persistence — studio lost on browser clear / device change
- No onboarding completion tracking in the database

### Fix
**File**: `web-studioflow/src/data/studioStore.tsx`

- **DB-backed**: `StudioProvider` now fetches the studio from Supabase on mount using `fetchStudioFromSupabase(ownerId)`
- **Auto-create**: If no studio exists in Supabase, `upsertStudioToSupabase()` creates one from the cached/local data
- **Sync on write**: `updateStudio()` saves to BOTH localStorage (cache) AND Supabase (source of truth)
- **Onboarding tracking**: `completeOnboarding()` writes `onboarding_completed` and `onboarding_completed_at` to the `profiles` table
- **Cache-aware**: localStorage remains the initial load source for instant UI; Supabase data overrides it when fetched
- Exported `useOnboarding()` hook for onboarding flow integration

### Data flow
```
Login → useAuth(user) → StudioProvider.useEffect:
  1. Load from localStorage (instant cache)
  2. Fetch from Supabase (async, becomes source of truth)
  3. If Supabase has data → update state + cache
  4. If Supabase has no studio → upsert from cache
  5. Check profiles.onboarding_completed

Update:
  updateStudio(patch) → setState + cache + upsertStudioToSupabase (async, fire-and-forget)
```

---

## 3. Critical Database Migration

**File**: `backend/migrations/009_critical_schema_fixes.sql`

### Schema changes

| Table | New columns | Type |
|-------|-------------|------|
| `invoices` | `paid_at` | `timestamptz` |
| | `stripe_invoice_id` | `text` |
| | `stripe_payment_intent_id` | `text` |
| | `parent_email` | `text` |
| `studios` | `banner_url` | `text` |
| `profiles` | `onboarding_completed` | `boolean DEFAULT false` |
| | `onboarding_completed_at` | `timestamptz` |
| `classes` | `description` | `text` |

### New tables

| Table | Purpose | Key FKs |
|-------|---------|---------|
| `attendance_sessions` | Track class attendance sessions by date | `class_id → classes`, `studio_id → studios` |
| `attendance_records` | Per-student attendance within a session | `session_id → attendance_sessions`, `student_id → students` |
| `recital_performances` | Individual performances within recital events | `recital_event_id → recital_events`, `studio_id → studios` |

### Added
- Indexes on all new columns (partial indexes for nullable columns)
- RLS policies on all 3 new tables (studio-scoped, using `user_id()` function)
- `updated_at` triggers on `attendance_sessions`, `attendance_records`, `recital_performances`, `invoices`, `classes`, `profiles`
- Backfill for `invoices.parent_email` from `caregivers` table
- FK constraint on `costume_assignments.recital_performance_id → recital_performances`

---

## 4. Broken Routes — Fixed

**File**: `web-studioflow/src/App.tsx`

| Route | Before (wrong) | After (fixed) |
|-------|---------------|---------------|
| `/instructor-pay` | Rendered `Instructors` component | Renders `InstructorPay` component |
| `/parent/children` | Rendered `ParentFamily` component | Renders `ParentChildren` component |
| `/parent/caregivers` | Rendered `ParentFamily` component | Renders `ParentCaregivers` component |

Added missing imports: `InstructorPay`, `ParentChildren`, `ParentCaregivers`

---

## 5. Supabase Types — Regenerated

**Files**: 
- `backend/types.ts`
- `web-studioflow/src/integrations/supabase/types.ts`

Both files updated with:
- All new columns in `invoices`, `studios`, `profiles`, `classes`
- Full type definitions for `attendance_sessions`, `attendance_records`, `recital_performances` (Row, Insert, Update, Relationships)

---

## 6. Validation Results

**Command**: `runChecks({ appPath: "web-studioflow" })`  
**Result**: ✅ **PASSED**

- TypeScript compilation: no errors
- Static checks: passed
- Web build (Vite): succeeded
- Live preview: https://p-h2o4xl61o2ik1fuisevjr.rork.live

---

## Files Changed

| File | Action |
|------|--------|
| `web-studioflow/src/lib/supabase.ts` | Added `authenticatedFetch` — injects Rork JWT into Supabase calls |
| `web-studioflow/src/data/studioStore.tsx` | DB-backed studio + onboarding persistence, exported `useOnboarding` |
| `web-studioflow/src/data/store.tsx` | Added `useOnboarding` to re-exports |
| `web-studioflow/src/App.tsx` | Fixed 3 broken routes, added missing imports |
| `backend/migrations/009_critical_schema_fixes.sql` | **New** — migration with all schema additions |
| `backend/types.ts` | Regenerated — new columns, new tables |
| `web-studioflow/src/integrations/supabase/types.ts` | Regenerated — same as backend types |

---

## Remaining Risks

1. **Supabase JWT configuration**: Until the Supabase project is configured to trust Rork's JWKS (`https://api.rork.com/.well-known/jwks.json`), `auth.uid()` will return `null` for Rork-authenticated users. RLS policies will deny access. The backend functions (`createAdminClient`) bypass this for now.

2. **Migration must be applied**: `009_critical_schema_fixes.sql` must be applied to the live Supabase instance. Without it, the new columns and tables don't exist.

3. **iOS remains demo-only**: The iOS Swift app (`ios-studioflow/`) was not touched in this phase. It continues to use static demo data with no Supabase integration.

4. **Studio upsert race**: If `StudioProvider` mounts before the Supabase fetch completes, a brief flash of cached/local data may appear. The fetch completes quickly in practice.

5. **Onboarding check**: `checkOnboardingFromProfile` runs async after the studio sync. A very fast user could see the setup wizard briefly before the profile check completes.

---

## Commands Run

```bash
runChecks({ appPath: "web-studioflow" })
```

---

## Next Steps (Phase 2, not in scope)

- Apply `009_critical_schema_fixes.sql` to production Supabase
- Configure Supabase JWT settings for Rork Auth
- Build the `attendance_sessions` + `attendance_records` UI
- Build the `recital_performances` management UI
- Implement Stripe invoice sync using `stripe_invoice_id` / `stripe_payment_intent_id`
- Add iOS Supabase integration
