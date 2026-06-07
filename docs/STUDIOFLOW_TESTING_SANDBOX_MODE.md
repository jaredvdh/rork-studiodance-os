# StudioFlow Testing / Sandbox Mode

A reliable way to test the **entire** StudioFlow product end-to-end against the
real production data flow — onboarding, studio setup, classes, participants,
caregivers/parents, payments (test mode), waivers, attendance, announcements,
and the parent/member portal.

Unlike the legacy demo logins (which used synthetic client-side tokens and
`demo.ts` mock data), Sandbox mode creates **real Supabase-backed studios** that
you can delete later. It does **not** depend on the `demo-login` Edge Function or
on Rork→Supabase JWKS trust.

---

## How it works (architecture)

Test studios use **native Supabase Auth (email/password)**:

- The `test-studio` Edge Function (service_role) provisions a real Supabase Auth
  user via `auth.admin.createUser({ email_confirm: true })`, a `profiles` row,
  and a `studios` row marked `is_test = true`.
- The client then signs in with `supabase.auth.signInWithPassword(...)`. Because
  this is a native Supabase session, `auth.uid()` resolves and **every existing
  RLS policy works exactly as in production** — no JWKS trust required.
- Optional sample data is seeded server-side (service_role) so seeding never
  fights RLS. Everything written is scoped to the new studio.
- A portal account (caregiver for child-based verticals, member for adult
  verticals) is also provisioned so you can test the portal with proper
  caregiver-scoped RLS.

All test identities are marked `profiles.is_test = true`; the studio is marked
`studios.is_test = true` (migration `013_test_sandbox_mode.sql`).

---

## How to create a test studio

1. Go to **`/sandbox`** (links are on the Sign-in page and the Demo screen, as
   **“Create a test studio”**).
2. Choose a **business type**:
   - Dance studio
   - CrossFit / fitness gym
   - Yoga / Pilates studio (also Gym)
   - Martial arts school
   - Music / performing arts school
3. Optionally set a **studio name**.
4. Choose **Add sample data** (on) or leave it off for a blank studio.
5. Click **Create test studio**.

You are signed in automatically as the test admin. The screen shows the
**admin** and (if seeded) **portal** credentials — copy them; you can sign back
in any time from the normal sign-in pages. Password for all test accounts:
`Sandbox123!`.

A teal **“Test studio (sandbox)”** banner appears throughout the app while a
test studio is active.

---

## How to test onboarding (blank studio)

Leave **Add sample data** unchecked. You get a blank studio and go through the
real flow manually:

1. Land on the dashboard with the **Setup Wizard** (onboarding is not skipped).
2. Configure studio profile, branding colour, logo/banner.
3. Add your first class, first participant, first caregiver/parent.
4. Create an invoice (test/simulated payment mode).
5. Test the portal by creating a caregiver and signing in as them.

> Onboarding is only skipped when you choose **Add sample data** (which lands you
> on a fully populated dashboard).

---

## How to seed sample data

Choose **Add sample data** when creating (or call the `seed` action on an
existing test studio). Seeding inserts realistic, vertical-specific data:

- **Dance** — ballet/jazz/tap/hip hop classes, children linked to parents,
  recital flag on classes, costume-style fees via invoices, a recital/liability
  waiver.
- **CrossFit / Gym** — WOD/conditioning/Olympic-lifting schedule, adult members,
  coaches, membership invoices, a fitness assumption-of-risk waiver.
- **Yoga / Pilates** — adult members, vinyasa/hatha/yin classes (class packs),
  instructors, a health acknowledgement waiver.
- **Martial arts** — belt-level classes, youth & adult students linked to
  parents, grading/sparring, a participation waiver.
- **Music school** — 1:1 lessons by instrument, students linked to parents,
  recital media-consent waiver.

Each seed also creates instructors/coaches, enrolments, a mix of paid / due /
overdue invoices (test mode), announcements, and the linked portal account.

---

## How to test the parent / member portal

When seeded, the result panel shows a **portal login**:

- **Child-based verticals (dance, martial arts, music):** a **caregiver/parent**
  account linked to 2 children. Sign in → `/parent`. RLS scopes them to only
  their linked children, invoices, waivers, attendance, and announcements.
- **Adult verticals (CrossFit, yoga, gym):** a **member** account (relationship
  “Self”) linked to their own participant record. Sign in → `/parent` (member
  view) and they only see their own profile, classes, invoices, waivers, and
  schedule.

Use **“Sign in to parent/member portal”** on the result screen, or sign in later
from `/parent/login` with the portal email + `Sandbox123!`.

Scoping is enforced by the existing caregiver RLS (migration 010) — not by
`demo.ts`.

---

## How to delete test data

1. Sign in as the test **admin**.
2. Go to **Settings** → **Delete test studio** (only shown for sandbox studios).
3. Type `DELETE` and confirm.

This calls the `test-studio` `delete` action which:

- Verifies `studios.is_test = true` (refuses to delete real studios).
- Deletes the studio row — **cascades** to teachers, classes, students,
  caregivers, enrolments, invoices, announcements, waivers, costumes,
  attendance, recital events, settings, etc. (all `ON DELETE CASCADE`).
- Deletes the test `profiles` and their Supabase Auth users (`is_test = true`).

You are signed out and returned to `/sandbox`.

> Programmatic cleanup: `POST {SUPABASE_URL}/functions/v1/test-studio` with
> `{ "action": "delete", "studioId": "<uuid>" }`.

---

## Safety guarantees

- **RLS is not weakened.** Test studios are isolated by the same studio-scoped
  and caregiver-scoped policies as real studios.
- **No service-role keys on the client.** All privileged operations run inside
  the `test-studio` Edge Function.
- **No cross-studio leakage.** Each test studio is a separate tenant with its
  own owner.
- **Real studios are untouched.** `is_test` defaults to `false`; create/seed/
  delete all refuse to operate on non-test studios.
- **Payments are test/simulated.** Seeded `studio_settings` set
  `paymentMode: "test"`; invoices are local/simulated, never live charges.
- **Legacy demo mode still works** and is unchanged — Sandbox mode is the
  recommended path for real end-to-end testing.

---

## Validation checklist

- [x] Create dance test studio from scratch (blank → onboarding).
- [x] Create CrossFit test studio with sample data.
- [x] Create yoga / martial arts / music test studios.
- [x] Sign in as admin → populated dashboard with correct terminology.
- [x] Sign in to parent/member portal → only linked/own data visible.
- [x] Delete test studio → studio + linked data + test accounts removed.
- [x] Web build passes (`runChecks` on `web-studioflow`).

---

## Known limitations

- **Token lifetime:** native Supabase sessions aren’t auto-refreshed by the app
  (the client uses `persistSession: false` and restores from the stored token),
  so a test session lasts roughly an hour. Just sign in again with the saved
  credentials.
- **One studio per test admin:** the studio store resolves a studio by
  `owner_id`. Each test studio gets its own admin account, so create studios
  sequentially (create dance → test → delete → create CrossFit, etc.) or use
  different admin accounts.
- **Email confirmation:** test users are created with `email_confirm: true`, so
  they work regardless of the project’s email-confirmation setting.
- **Storage assets:** logos/banners aren’t seeded (placeholder initials are
  used); upload them manually to exercise storage buckets.
- **Deployment:** the `test-studio` function is deployed with the other Edge
  Functions (JWT verification handled in-function; CORS via `_shared/cors.ts`).
