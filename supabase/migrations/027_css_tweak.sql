-- ─── 027_css_tweak.sql ────────────────────────────────────────────────────
-- Milestone 4 of the goal-race training plan generator — adaptive CSS
-- pacing loop. Two additions:
--
-- 1. plan_set_results: the "actual pace achieved" counterpart to
--    plan_set_targets, which 024's own comment documented as write-once
--    from the LLM generator with nothing to compare against. Nothing else
--    in the schema captures a per-set result (times is a standalone PB
--    log with no link to a specific prescribed set; session_assignments
--    only tracks attendance) — this is genuinely new surface area.
--
-- 2. css_results gains a `source` column and t400/t200 become nullable.
--    There is no separate mutable "current CSS" field anywhere — every
--    read site (useMyCssResult, useCssResultForSwimmer, the edge
--    function) already does `order by recorded_at desc limit 1`, so an
--    accepted tweak is inserted as a new row (source = 'adjustment') with
--    only pace_per_100 set, and is picked up everywhere with zero changes
--    to existing read paths. Real time-trial rows keep source = 'test'.

alter table css_results
  add column source text not null default 'test' check (source in ('test', 'adjustment')),
  alter column t400 drop not null,
  alter column t200 drop not null;

create table plan_set_results (
  id uuid primary key default gen_random_uuid(),
  plan_set_target_id uuid not null references plan_set_targets (id) on delete cascade,
  swimmer_id uuid not null references swimmers (id) on delete cascade,
  actual_pace_seconds numeric(8, 2) not null check (actual_pace_seconds > 0),
  recorded_at timestamptz not null default now(),
  unique (plan_set_target_id)
);

alter table plan_set_results enable row level security;

create policy "swimmer manages own plan set results"
  on plan_set_results for all
  using (exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid()));

create policy "coach reads plan set results for their swimmers"
  on plan_set_results for select
  using (exists (select 1 from swimmers s where s.id = swimmer_id and s.coach_id = auth.uid()));

create index plan_set_results_swimmer_idx on plan_set_results (swimmer_id, recorded_at desc);
