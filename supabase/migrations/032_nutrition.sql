-- ---------- nutrition_profiles ----------
-- Training + preference inputs only — deliberately no weight/BMI columns.
-- One row per profile, editable in settings.
create table nutrition_profiles (
  profile_id uuid primary key references profiles (id) on delete cascade,
  training_volume text not null check (training_volume in ('recreational', 'club', 'high_performance')),
  typical_session_time text not null check (typical_session_time in ('morning', 'afternoon_evening', 'varies')),
  diet_pattern text[] not null default '{}',
  allergies text,
  age_bracket text not null check (age_bracket in ('under_18', '18_plus')),
  updated_at timestamptz not null default now()
);

alter table nutrition_profiles enable row level security;

create policy "manage own nutrition profile"
  on nutrition_profiles for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------- hydration_logs ----------
-- Tap-to-log fluid intake only — no calories, no weight, ever.
create table hydration_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml int not null check (amount_ml > 0)
);

create index hydration_logs_profile_logged_at on hydration_logs (profile_id, logged_at);

alter table hydration_logs enable row level security;

create policy "manage own hydration logs"
  on hydration_logs for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
