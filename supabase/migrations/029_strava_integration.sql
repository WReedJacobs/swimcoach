-- ---------- strava_connections ----------
-- One row per profile that has linked Strava. Tokens are written only by the
-- strava-oauth-exchange / strava-sync edge functions (service role, bypasses
-- RLS) — regular users can read/delete their own row but never write tokens
-- directly from the client.
create table strava_connections (
  profile_id uuid primary key references profiles (id) on delete cascade,
  strava_athlete_id bigint not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

alter table strava_connections enable row level security;

create policy "read own strava connection"
  on strava_connections for select
  using (auth.uid() = profile_id);

create policy "delete own strava connection"
  on strava_connections for delete
  using (auth.uid() = profile_id);

-- ---------- times: dedupe imported activities ----------
-- external_source/external_id let strava-sync upsert idempotently — re-running
-- a sync never double-imports the same Strava activity.
alter table times add column external_source text;
alter table times add column external_id text;

create unique index times_external_unique
  on times (external_source, external_id)
  where external_source is not null;
