# StudioFlow — Demo Mode End-to-End Verification

Pre-Phase-4 gate. Confirms demo mode is functional, fully isolated from
production Supabase, and that the web build is green.

Live preview: https://p-h2o4xl61o2ik1fuisevjr.rork.live
Build status: **PASS** (static checks + `bun run build`).

---

## How demo mode is isolated (verified by code audit)

Demo sessions are entirely client-side and never touch production tables:

- **Synthetic JWT** — `DemoLogin.tsx` issues an unsigned token carrying
  `is_demo: true` (falls back to the `demo-login` edge function when reachable).
- **`isDemoMode()` / `isDemoUser()`** (`lib/demoMode.ts`) — single source of
  truth, readable both inside and outside React.
- **No token on Supabase requests** — `authenticatedFetch` (`lib/supabase.ts`)
  returns plain `fetch()` when `isDemoMode()` is true, so the demo JWT is never
  attached.
- **Reads short-circuit** — `useDualQuery` returns seeded `demo.ts` data and
  skips the Supabase round-trip entirely when `isDemo` is true.
- **Writes guarded** — every mutation path checks `!user.isDemo`
  (`studioStore.upsertStudioToSupabase`, `markOnboardingComplete`,
  `updateStudio`, `completeOnboarding`). Demo edits stay in local React state.

---

## Test checklist

| # | Test | Result | Evidence |
|---|------|--------|----------|
| 1 | Clear local/session storage | ✅ | `checkAuth()` finds no token → unauthenticated; demo login re-seeds storage. |
| 2 | Admin demo login | ✅ | `demo.admin@studioflow.app` → `is_demo` JWT, role `studio_admin`, redirect `/dashboard`. |
| 3 | Parent demo login | ✅ | `demo.parent@studioflow.app` → role `parent`, redirect `/parent`. |
| 4 | Parent dashboard shows seeded children | ✅ | `ParentProvider` (demo) → `parentAccounts[0]` (Diane Walsh); `children` = shared students filtered by `childIds`; shared students = `demoStudents`. |
| 5 | Parent Children page shows seeded children | ✅ | `ParentChildren` consumes `useParent().children`; `loadState` is `"loaded"` in demo so it renders the list. |
| 6 | Parent Payments shows seeded invoices | ✅ | `useStudioData().invoices` → `demoInvoices`; filtered by child name / caregiver. |
| 7 | Member demo login | N/A | No dedicated demo member account exists (`DEMO_ACCOUNTS` = admin, parent, crossfit-admin). `MemberProvider` is wired for real members; nothing to regress in demo. |
| 8 | No Supabase writes during demo | ✅ | Reads short-circuit; writes gated by `!user.isDemo`; demo JWT never sent. |
| 9 | Web build passes | ✅ | `runChecks(web-studioflow)` — static checks + build succeeded. |

---

## Demo data wiring (key paths)

```
DemoLogin → JWT{is_demo:true,role} → localStorage
useAuth.userFromToken → user.isDemo = true
  ├─ StudioProvider:  isDemo → skips Supabase fetch/upsert, uses cached/demo studio
  ├─ useDualQuery:    isDemo → returns demo.ts arrays (students, invoices, classes…)
  ├─ ParentProvider:  isDemo → demoParent = parentAccounts[0]; children filtered by childIds
  └─ MemberProvider:  isDemo → first demo student with classes
```

---

## Notes / residual risks (out of scope for this gate)

- **`ParentChildren.tsx` hooks order** — two early `return`s (loading/empty)
  precede `useState` calls. Harmless in demo (`loadState` is always `"loaded"`
  from first render, so hook count is stable), but it is a latent rules-of-hooks
  issue for real accounts whose `loadState` transitions `loading → loaded`.
  Not touched here to avoid altering live-auth render paths; flag for a future
  real-mode pass.
- **Member portal** has no demo account, so it can only be exercised with a real
  caregiver-linked Supabase session.
- Manual click-through in the live preview is recommended as a final visual
  confirmation; all logic paths above are verified by code audit + green build.

## Commands run
- `runChecks(web-studioflow)` → static checks + `bun run build`: **PASS**
