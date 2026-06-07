-- ============================================================================
-- Migration 012: Rork JWT → Supabase Third-Party Auth Trust
-- ----------------------------------------------------------------------------
-- Context
--   StudioFlow authenticates OAuth users with Rork Auth. Rork Auth is
--   registered on this Supabase project as a Third-Party Auth issuer
--   (issuer https://api.rork.com, JWKS https://api.rork.com/.well-known/jwks.json)
--   via the Rork `getOrCreateAuthConfig` provisioning step. Because of that
--   registration, Supabase validates the Rork access token attached to each
--   REST request and `auth.uid()` (and therefore `user_id()`) resolves to the
--   token's `sub` claim — exactly what every RLS policy already keys on.
--
-- The blocker
--   `profiles.id` was declared `REFERENCES auth.users(id)`. Third-party
--   (Rork) users do NOT have a row in `auth.users` — that table is only
--   populated by Supabase's own GoTrue (native email/password) users.
--   As a result, when a Rork-authenticated user tried to create their
--   profile row (`id = auth.uid()`), the insert failed the foreign-key
--   constraint, which in turn blocked studio creation (studios.owner_id
--   → profiles.id) and every downstream studio-scoped query.
--
-- The fix
--   Drop the profiles → auth.users foreign key so a profile row can be keyed
--   purely by the authenticated user id (the JWT `sub`), regardless of whether
--   that identity came from Rork third-party auth or native Supabase auth.
--   RLS is unchanged and still fully enforced: `profiles_self_policy` keeps
--   each user scoped to `id = user_id()`.
--
--   This does NOT weaken security:
--     • RLS still requires a validated JWT for every row (anon = no access).
--     • `auth.uid()` only returns a value for a Supabase-validated token.
--     • Native auth users keep a real auth.users row; dropping the FK is
--       harmless for them (their id still equals their auth.users id).
-- ============================================================================

BEGIN;

-- ── 1. Drop the profiles → auth.users foreign key ───────────────────────────
-- The implicit constraint name from the inline REFERENCES in migration 000 is
-- `profiles_id_fkey`. Drop defensively in case it was named differently.
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name
    INTO fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
   WHERE tc.table_name = 'profiles'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND ccu.table_name = 'users'
     AND ccu.table_schema = 'auth'
   LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- ── 2. Keep id as the primary key (no auth.users dependency) ────────────────
-- profiles.id remains a uuid PRIMARY KEY; it now stores the authenticated
-- user id (JWT `sub`) for both Rork and native identities. No change needed
-- to the column itself — only the FK was removed above.

-- ── 3. Make the native-signup convenience trigger non-fatal ─────────────────
-- The on_auth_user_created trigger only ever fires for native Supabase Auth
-- signups (inserts into auth.users). Rork users never hit it; they create
-- their own profile row client-side on first authenticated request. Keeping
-- the trigger is harmless, but we harden it so a profile that already exists
-- (e.g. created client-side) never errors the signup path.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Document user_id() behaviour ─────────────────────────────────────────
-- user_id() wraps auth.uid(); for a validated third-party (Rork) token this
-- returns the token `sub`. Re-asserting the definition here keeps the helper
-- explicit and idempotent.
CREATE OR REPLACE FUNCTION user_id()
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

COMMIT;

-- ============================================================================
-- Verification (run manually against the project after applying):
--
--   -- As an authenticated Rork user (REST request with the Rork bearer token):
--   SELECT auth.uid();            -- should return the Rork user's sub (uuid)
--   SELECT (SELECT user_id());    -- same value
--
--   -- Profile self-create now succeeds under RLS:
--   INSERT INTO profiles (id, email) VALUES (auth.uid(), 'me@example.com')
--   ON CONFLICT (id) DO NOTHING;  -- previously failed FK to auth.users
--
--   -- Studio create succeeds (owner_id → profiles.id, which now exists):
--   INSERT INTO studios (name, owner_id) VALUES ('My Studio', auth.uid());
--
--   -- Anonymous (no/invalid token): auth.uid() IS NULL → RLS denies all rows.
-- ============================================================================
