-- ─── Swimmer self-planned sessions ──────────────────────────────────────────
-- Separate from coach sessions — swimmers plan their own workouts here.
-- Sets are stored as JSONB so the schema stays flexible as the builder evolves.

CREATE TABLE IF NOT EXISTS public.swimmer_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title          text NOT NULL DEFAULT 'My Session',
  scheduled_date date NOT NULL,
  sets           jsonb NOT NULL DEFAULT '[]',
  notes          text,
  completed      boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS swimmer_plans_profile_date
  ON public.swimmer_plans (profile_id, scheduled_date);

ALTER TABLE public.swimmer_plans ENABLE ROW LEVEL SECURITY;

-- Swimmers only see and edit their own plans
CREATE POLICY "Swimmers manage own plans" ON public.swimmer_plans
  FOR ALL USING (auth.uid() = profile_id);

-- Admins can see all plans
CREATE POLICY "Admins view plans" ON public.swimmer_plans
  FOR SELECT USING (public.is_admin());

-- ─── swim_level: add 'advanced' ──────────────────────────────────────────────
-- Lives here (committed in its own transaction) rather than in
-- 011_seed_drills.sql, which needs to INSERT rows using this value — Postgres
-- disallows using a new enum value in the same transaction that adds it.
ALTER TYPE swim_level ADD VALUE IF NOT EXISTS 'advanced';
