-- ─── 017_recovered_baseline.sql ──────────────────────────────────────────────
-- Recovers schema items lost in missing migrations 006/007 and fixes five
-- structural dead ends identified in the Phase-1 write-path audit.
--
-- 1. Add missing is_admin column (referenced by policies in 008 but never created)
-- 2. Fix handle_new_user trigger to copy email on signup
-- 3. Backfill email for all existing profiles
-- 4. Swimmer UPDATE/DELETE on self-logged times (RLS gap)
-- 5. Unique partial index on swimmers(profile_id) (prevents duplicate rows)
-- 6. Unique constraint on milestones(profile_id, label) (enables upsert in graduation flow)

-- ─── 1. Recovered: is_admin column ───────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Promote any user flagged as admin in app metadata (Supabase dashboard or service-role write)
UPDATE public.profiles p
SET is_admin = true
FROM auth.users u
WHERE u.id = p.id
  AND (u.raw_app_meta_data->>'claims_admin')::boolean IS TRUE;

-- ─── 2. Fix handle_new_user to also copy email ───────────────────────────────
-- The original trigger only copied full_name. The email column was added in 008
-- but the trigger was never updated, so profiles.email is NULL for all users who
-- signed up after 008 deployed. On conflict (idempotent re-run guard) we only
-- overwrite a NULL or empty email, never a legitimate one.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    WHERE public.profiles.email IS NULL OR public.profiles.email = '';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. Backfill email for all existing profiles ──────────────────────────────
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND (p.email IS NULL OR p.email = '');

-- ─── 4. Swimmer can update/delete their own self-logged times ─────────────────
-- The original schema only granted swimmer INSERT (for logging) and SELECT (for
-- reading). No UPDATE or DELETE existed, so swimmers could never correct or remove
-- a time they self-logged — zero rows affected, no error surfaced.
DROP POLICY IF EXISTS "swimmer updates own self-logged times" ON public.times;
DROP POLICY IF EXISTS "swimmer deletes own self-logged times" ON public.times;

CREATE POLICY "swimmer updates own self-logged times"
  ON public.times FOR UPDATE
  USING (
    is_self_logged = true
    AND EXISTS (
      SELECT 1 FROM public.swimmers s
      WHERE s.id = swimmer_id AND s.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    is_self_logged = true
    AND EXISTS (
      SELECT 1 FROM public.swimmers s
      WHERE s.id = swimmer_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "swimmer deletes own self-logged times"
  ON public.times FOR DELETE
  USING (
    is_self_logged = true
    AND EXISTS (
      SELECT 1 FROM public.swimmers s
      WHERE s.id = swimmer_id AND s.profile_id = auth.uid()
    )
  );

-- ─── 5. Unique partial index: one swimmer row per profile ─────────────────────
-- Without this, race conditions or direct inserts could create multiple swimmers
-- rows for one profile. useMySwimmer uses .maybeSingle() which throws on > 1 row.
CREATE UNIQUE INDEX IF NOT EXISTS swimmers_profile_unique
  ON public.swimmers (profile_id)
  WHERE profile_id IS NOT NULL;

-- ─── 6. Unique constraint on milestones(profile_id, label) ───────────────────
-- Required for the upsert-on-conflict in GraduationModal that syncs beginner
-- localStorage milestone state to the DB before the role transition.
ALTER TABLE public.milestones
  DROP CONSTRAINT IF EXISTS milestones_profile_label_unique;
ALTER TABLE public.milestones
  ADD CONSTRAINT milestones_profile_label_unique UNIQUE (profile_id, label);
