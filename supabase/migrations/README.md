# Migrations

Migrations are numbered sequentially. The gap between 005 and 008 is intentional:
migrations 006 and 007 were applied directly to the hosted Supabase project and were
not committed to the repo. Do NOT renumber existing migrations — Supabase tracks applied
migrations by filename. If you need to reference what 006/007 contained, check the
Supabase dashboard's migration history.

| File | Description |
|------|-------------|
| 001_initial.sql | Initial schema — profiles, pools, times, sessions |
| 002_join_codes.sql | Coach join codes |
| 003_fixes.sql | RLS fixes |
| 004_css_results.sql | CSS (Critical Swim Speed) results table |
| 005_recurring_sessions.sql | Recurring session templates |
| 006 | _(applied in dashboard — not in repo)_ |
| 007 | _(applied in dashboard — not in repo)_ |
| 008_admin_expanded.sql | Expanded admin features, drills table |
| 009_swimmer_ratings.sql | Swimmer OVR rating system |
| 010_swimmer_plans.sql | Swimmer training plans |
| 011_seed_drills.sql | Seed 45 global drills + add `focus` column + `advanced` level |
| … | _(table not kept current past 011 — see filenames in this directory)_ |
| 021_google_oauth_avatar.sql | Copy Google profile photo into `profiles.avatar_url` on signup/login |
