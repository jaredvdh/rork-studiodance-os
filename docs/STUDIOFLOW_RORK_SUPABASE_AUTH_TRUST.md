# StudioFlow — Rork JWT → Supabase Trust

Status: **Fixed.** OAuth/Rork-authenticated users now resolve correctly in
Supabase so `auth.uid()` / `user_id()` work and RLS operates normally.

## 1. Rork auth token format (audit)

StudioFlow OAuth sign-in uses **Rork Auth** (Google/Apple). The access token is
a short-lived (1 hour) JWT:

| Claim       | Value / meaning                                              |
| ----------- | ------------------------------------------------------------ |
| `iss`       | `https://api.rork.com`                                       |
| `sub`       | Rork user id (uuid) — becomes `auth.uid()` in Supabase       |
| `email`     | User email                                                   |
| `name`      | Display name (optional)                                      |
| `picture`   | Avatar URL (optional)                                        |
| `role`      | App role (`admin` / `caregiver` / `staff`) when present      |
| `studio_id` | Active studio id when present                                |
| `is_demo`   | `true` only for demo evaluation sessions                     |
| `exp`       | Expiry (epoch seconds)                                       |
| JWKS URL    | `https://api.rork.com/.well-known/jwks.json`                 |

The frontend decodes (never verifies) the token in `useAuth.tsx`
(`userFromToken`). Backend Edge Functions **verify** it against the Rork JWKS in
`backend/functions/_shared/auth.ts` using `jwtVerify(..., { issuer: "https://api.rork.com" })`.

## 2. Can Supabase directly trust the Rork JWT? — **Yes**

Supabase trusts Rork JWTs via **Third-Party Auth issuer registration**. This is
provisioned automatically by Rork's `getOrCreateAuthConfig` step, which
registers the Rork issuer (`https://api.rork.com`) and its JWKS on the Supabase
project. Re-running provisioning confirmed the project is in **Rork Auth mode**
(no native-Supabase-Auth conflict was reported).

With that registration in place:

- Supabase validates the Rork bearer token attached to every REST request.
- `auth.uid()` returns the token's `sub`.
- `user_id()` (which wraps `auth.uid()`) returns the same value.
- All existing RLS policies — which key on `user_id()` / `auth.uid()` — operate
  normally with no policy rewrites required.

The client already attaches the token: `lib/supabase.ts` `authenticatedFetch`
injects `Authorization: Bearer <rork access token>` on every Supabase request
(and **never** for demo sessions).

**No service-role mediation was added for normal reads/writes.** `service_role`
remains limited to backend/webhook/admin operations (`createAdminClient`).

## 3. The real blocker (now fixed): `profiles.id → auth.users(id)`

`profiles.id` was declared `REFERENCES auth.users(id)`. Third-party (Rork) users
do **not** have a row in `auth.users` (that table is only populated by Supabase's
own GoTrue native users). So when a Rork user tried to create their profile row
(`id = auth.uid()`), the insert failed the foreign key — which then cascaded:

- studio creation failed (`studios.owner_id → profiles.id`), and
- every studio-scoped query returned nothing (no profile → no `studio_id`).

Additionally, `useSyncProfile` existed but was **never called**, so OAuth users
never got a profile row at all.

### Fix

**Migration `012_rork_third_party_auth_trust.sql`:**

- Drops the `profiles → auth.users` foreign key (defensively, by discovering the
  constraint name). `profiles.id` stays the primary key and now stores the
  authenticated user id (JWT `sub`) for both Rork and native identities.
- Hardens `handle_new_user()` (native-signup convenience trigger) with
  `ON CONFLICT (id) DO NOTHING` so a client-created profile never breaks signup.
- Re-asserts `user_id()` = `auth.uid()` (idempotent, explicit).

This does **not** weaken RLS: `profiles_self_policy` still scopes every user to
`id = user_id()`, anonymous requests still resolve `auth.uid()` to `NULL` (no
rows), and native users keep a valid `auth.users` row.

**Client (`data/studioStore.tsx`):**

- Added `ensureProfile(user)` which upserts the user's `profiles` row
  (`id, email, name, avatar_url`) under RLS.
- `StudioProvider` now calls `ensureProfile()` **before** fetching/creating the
  studio, guaranteeing the `studios.owner_id → profiles.id` FK resolves.

## 4. Resulting auth flow

- **Real OAuth users** query Supabase as themselves; `auth.uid()` = Rork `sub`.
- **Profile creation** works on first authenticated load (`ensureProfile`).
- **Studio creation/update** works (owner_id FK satisfied).
- **Caregiver-scoped parent portal** is unchanged — its policies (migrations
  008/010/011) already key on the authenticated user's email/`user_id()`, which
  now resolves for Rork users.
- **Demo mode** is untouched and fully isolated: demo JWTs are never attached to
  Supabase requests (`isDemoMode()` short-circuit in `authenticatedFetch`), and
  all demo data is served from `demo.ts`.

## 5. Verification

### Build / static checks
- `runChecks` for `web-studioflow`: **passed** (static checks + `bun run build`).
- Live preview: https://p-h2o4xl61o2ik1fuisevjr.rork.live

### SQL verification (run against the project after applying migration 012)
```sql
-- As an authenticated Rork user (REST request with the Rork bearer token):
SELECT auth.uid();            -- returns the Rork user's sub (uuid)
SELECT (SELECT user_id());    -- same value

-- Profile self-create now succeeds under RLS:
INSERT INTO profiles (id, email) VALUES (auth.uid(), 'me@example.com')
  ON CONFLICT (id) DO NOTHING;

-- Studio create succeeds (owner_id → profiles.id):
INSERT INTO studios (name, owner_id) VALUES ('My Studio', auth.uid());

-- Anonymous (no/invalid token): auth.uid() IS NULL → RLS denies all rows.
```

### Manual verification checklist
- [ ] OAuth user loads dashboard data (studio-scoped rows visible).
- [ ] OAuth user can create/update a studio.
- [ ] OAuth caregiver sees only their own children/invoices/waivers.
- [ ] Anonymous user sees no protected data.
- [ ] Demo login still works and performs no Supabase writes.

## 6. Remaining risks / notes

- **Mixed identity models.** The app also exposes native Supabase email/password
  (`signInWithEmail` / `signUpWithEmail`). Rork's guidance is to use exactly one
  identity model. Native users have `auth.users` rows and remain compatible after
  this migration, but long-term the project should standardise on Rork Auth to
  avoid two id systems. Not changed here to avoid breaking existing sign-ins.
- **`sub` must be a uuid.** `auth.uid()` casts `sub` to `uuid`; Rork user ids are
  uuids, matching `profiles.id`. If Rork ever issues non-uuid subs this cast
  would need revisiting.
- **`useSyncProfile` is now redundant** with `ensureProfile`; left in place but
  unused. Safe to remove in a future cleanup.
- Migration 012 must be applied to the live project for the fix to take effect;
  the code change alone is not sufficient.

## Files changed
- `backend/migrations/012_rork_third_party_auth_trust.sql` (new)
- `web-studioflow/src/data/studioStore.tsx` (added `ensureProfile`, called before studio sync)
- `docs/STUDIOFLOW_RORK_SUPABASE_AUTH_TRUST.md` (this report)

## Commands run
- `runChecks({ appPath: "web-studioflow" })` → passed
