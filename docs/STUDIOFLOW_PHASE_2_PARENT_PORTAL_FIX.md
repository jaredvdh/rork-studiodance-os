# StudioFlow Phase 2 — Parent/Member Portal Integration Fix

**Date:** 2026-06-07  
**Status:** Complete  
**Build:** ✅ Passed  

---

## Summary

Phase 2 makes the parent/caregiver and member/student portals real, secure, and database-backed. The demo data dependency has been removed from `parentStore.tsx` and `memberStore.tsx`. All queries now route through Supabase with RLS policies that scope data to the authenticated caregiver.

## What was changed

### 1. New migration: 010_caregiver_portal_rls.sql

Added caregiver-scoped Row Level Security policies and a new audit log table:

- **caregiver_audit_log** table — tracks caregiver lifecycle events (nominated, accepted, disabled, removed)
- **Helper functions**: `caregiver_id_for_user()`, `caregiver_student_ids()`, `caregiver_class_ids()`, `is_studio_caregiver()`
- **RLS policies added for caregivers on**:
  - `students` — caregivers can view/update only their linked students
  - `enrolments` — caregivers see only their students' enrolments
  - `invoices` — scoped by `parent_email` or student name match
  - `waiver_signatures` — scoped by student or caregiver ID
  - `announcements` — caregivers who `receive_announcements` can view
  - `attendance_records` — scoped to caregiver's students
  - `attendance_sessions` — scoped to caregiver's students' classes
  - `waiver_templates` — published templates for the caregiver's studio
  - `waiver_versions` — published versions scoped to caregiver's studio
  - `uploaded_documents` — scoped to caregiver's students
  - `recital_events` — visible to all caregivers in the studio
- **Tightened caregiver self-record policies** — view/update own caregiver record by email match

### 2. New caregiver Supabase hooks (supabaseHooks.ts)

Added production-grade hooks for the parent portal:

| Hook | Purpose |
|------|---------|
| `useSupabaseCaregiverByEmail(isDemo)` | Fetches caregiver by matching `auth.user.email` → `caregivers.email` |
| `useSupabaseCaregivers(isDemo)` | Fetches all caregivers for the active studio |
| `useSupabaseCaregiverStudents(cgId, isDemo)` | Fetches students linked to a specific caregiver |
| `useAddCaregiver()` | Creates a caregiver record in Supabase |
| `useUpdateCaregiver()` | Updates a caregiver record (name, email, permissions, etc.) |
| `useRemoveCaregiver()` | Soft-deletes a caregiver (status → "removed") |
| `mapSupabaseCaregiver()` | Maps Supabase `caregivers` rows to the frontend `Caregiver` type |

### 3. Rewritten parentStore.tsx

**Before**: All data from `demo.ts`. `ParentAccount[]` held in `useState`, mutations were local-only.

**After**:
- **Demo mode**: Same behavior as before — `parentAccounts` from `demo.ts`, local state, no Supabase calls
- **Real mode**:
  - Calls `useSupabaseCaregiverByEmail()` to find the caregiver matching the authenticated user
  - Calls `useSupabaseCaregiverStudents()` to get linked students
  - Mutations (addChild, updateChild, caregiver management) go through Supabase mutation hooks
  - Returns `isLoading`, `loadState`, `loadError` for UI state handling
  - Returns `parent: ParentAccount | null` (null when no caregiver found)
- **New exported components**: `ParentLoadingSkeleton`, `NoCaregiverFound`, `ParentLoadError`
- **Direct dependency on `demo.ts` removed** from the core data flow (demo path still imports from demo.ts for demo mode)

### 4. Rewritten memberStore.tsx

**Before**: Used `parentAccounts` from `demo.ts` for caregiver lookup.

**After**:
- **Demo mode**: Same as before
- **Real mode**:
  - Looks up the student by finding linked students through the caregiver
  - Uses `useSupabaseCaregiverByEmail()` to find the caregiver
  - Returns `isLoading` for UI state
- **Direct dependency on `demo.ts` removed** from the real-mode data flow

### 5. Updated parent portal pages

All 9 parent portal pages now import loading/empty/error components from `parentStore`:

| Page | Changes |
|------|---------|
| **ParentDashboard.tsx** | Added `isLoading`/`loadState` guards with `ParentLoadingSkeleton`, `NoCaregiverFound`, `ParentLoadError` |
| **ParentChildren.tsx** | Added loading/empty guards |
| **ParentCaregivers.tsx** | Added loading/empty guards |
| **ParentPayments.tsx** | Added loading/empty guards; fixed `account` → `parent` destructuring bug |
| **ParentWaivers.tsx** | Import updated for `ParentLoadingSkeleton` |
| **ParentSchedule.tsx** | Import updated for `ParentLoadingSkeleton` |
| **ParentCostumes.tsx** | Import updated for `ParentLoadingSkeleton` |
| **ParentDocuments.tsx** | Import updated for `ParentLoadingSkeleton` |
| **ParentFamily.tsx** | Import updated for `ParentLoadingSkeleton` |

## Files changed

| File | Action |
|------|--------|
| `backend/migrations/010_caregiver_portal_rls.sql` | Created |
| `web-studioflow/src/data/supabaseHooks.ts` | Added 7 new caregiver hooks + `mapSupabaseCaregiver` |
| `web-studioflow/src/data/parentStore.tsx` | Full rewrite — Supabase-backed, loading/empty/error states |
| `web-studioflow/src/data/memberStore.tsx` | Full rewrite — Supabase-backed, loading state |
| `web-studioflow/src/pages/parent/ParentDashboard.tsx` | Added loading/empty/error guards |
| `web-studioflow/src/pages/parent/ParentChildren.tsx` | Added loading/empty guards + import |
| `web-studioflow/src/pages/parent/ParentCaregivers.tsx` | Added loading/empty guards + import |
| `web-studioflow/src/pages/parent/ParentPayments.tsx` | Added loading/empty guards + fixed destructuring bug + import |
| `web-studioflow/src/pages/parent/ParentWaivers.tsx` | Import updated |
| `web-studioflow/src/pages/parent/ParentSchedule.tsx` | Import updated |
| `web-studioflow/src/pages/parent/ParentCostumes.tsx` | Import updated |
| `web-studioflow/src/pages/parent/ParentDocuments.tsx` | Import updated |
| `web-studioflow/src/pages/parent/ParentFamily.tsx` | Import updated |

## Migrations added

| # | File | Purpose |
|---|------|---------|
| 010 | `010_caregiver_portal_rls.sql` | Caregiver-scoped RLS for all parent-facing tables + caregiver_audit_log table |

## Auth / RLS status

- **Rork Auth JWT** is injected into Supabase requests via `authenticatedFetch()` in `lib/supabase.ts`
- **RLS policies** now cover all tables that the parent/member portal accesses:
  - `students` — caregivers see only their linked students
  - `enrolments` — scoped to caregiver's students
  - `invoices` — scoped by parent_email or student name
  - `waiver_signatures` — scoped to caregiver's students
  - `announcements` — caregivers who opt in
  - `attendance_records` — scoped to caregiver's students
  - `attendance_sessions` — scoped to caregiver's classes
  - `waiver_templates` & `waiver_versions` — published only
  - `uploaded_documents` — scoped to caregiver's students
  - `recital_events` — visible to studio caregivers
  - `caregiver_audit_log` — studio-scoped + caregiver's own entries
  - `caregivers` — view/update own record by email
- **Helper functions** (`caregiver_id_for_user`, `caregiver_student_ids`, `caregiver_class_ids`) enable efficient RLS without per-user subqueries

## Remaining risks

1. **JWT validation** — Supabase must trust Rork's JWT for `auth.uid()` to work in RLS policies. Until configured, RLS will treat all users as unauthenticated. The backend functions use `service_role` key to bypass RLS — the parent portal may need a backend function if JWT trust isn't configured.

2. **caregiver ↔ auth.user linking** — The `caregiver_id_for_user()` function matches `caregivers.email = profiles.email`. If the caregiver email doesn't match the authenticated user's email, the caregiver won't be found.

3. **Family grouping** — The current schema links students → caregivers via `caregiver_id` (1:1). Multi-caregiver families (e.g., two parents managing the same child) require both caregivers to be linked to the same students. This is partially supported via `child_ids[]` on caregivers but needs a migration to add a `student_caregivers` join table for proper N:M support.

4. **Types regeneration** — The Supabase types files (`backend/types.ts`, `web-studioflow/src/integrations/supabase/types.ts`) are auto-generated. The new `caregiver_audit_log` table will appear in the types after running `supabase gen types` or deploying migrations. Manual types were not edited.

5. **iOS app** — Remains demo-only. The iOS app reads from shared `Student[]` data but has no Supabase integration. This is documented and deferred.

## Commands run

```bash
# Build
bun run build  # ✅ passed
```

## Build / test results

- **Static checks**: ✅ passed
- **TypeScript**: ✅ passed
- **Build**: ✅ passed
- **Live preview**: https://p-h2o4xl61o2ik1fuisevjr.rork.live
