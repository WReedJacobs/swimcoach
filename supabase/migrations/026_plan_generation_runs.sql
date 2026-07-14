-- ─── 026_plan_generation_runs.sql ─────────────────────────────────────────────
-- Milestone 2: audit log for generate-training-plan edge function calls, so a
-- bad generation can be inspected or regenerated without re-deriving inputs.
-- Written by the edge function using the service role (bypasses RLS) — these
-- policies only cover read access for the swimmer/coach who own the goal race.

create table plan_generation_runs (
  id uuid primary key default gen_random_uuid(),
  goal_race_id uuid not null references goal_races (id) on delete cascade,
  week_number int, -- null = full-plan generation; set = single-week regeneration
  input_snapshot jsonb not null,
  output jsonb,
  model text not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table plan_generation_runs enable row level security;

create policy "swimmer reads own plan generation runs"
  on plan_generation_runs for select
  using (exists (
    select 1 from goal_races gr
    join swimmers s on s.id = gr.swimmer_id
    where gr.id = goal_race_id and s.profile_id = auth.uid()
  ));

create policy "coach reads plan generation runs for their swimmers"
  on plan_generation_runs for select
  using (exists (
    select 1 from goal_races gr
    join swimmers s on s.id = gr.swimmer_id
    where gr.id = goal_race_id and s.coach_id = auth.uid()
  ));

create index plan_generation_runs_goal_race_idx on plan_generation_runs (goal_race_id, created_at desc);
