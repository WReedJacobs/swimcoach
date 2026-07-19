-- An imported Strava swim is now a *session* the athlete can describe, not a
-- bare times row — dedupe tracking moves from times to sessions accordingly.
-- (times.external_source/external_id were added in 029 but never populated —
-- strava-sync is being rewritten before its first real sync.)
drop index if exists times_external_unique;
alter table times drop column if exists external_source;
alter table times drop column if exists external_id;

alter table sessions add column external_source text;
alter table sessions add column external_id text;

create unique index sessions_external_unique
  on sessions (external_source, external_id)
  where external_source is not null;
