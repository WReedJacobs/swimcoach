-- ─── Admin RLS policies ────────────────────────────────────────────────────

-- Defined here (not just in 009, which also (re)defines it identically) so
-- this migration doesn't depend on one that runs after it. SECURITY DEFINER
-- means the internal SELECT runs as the function owner and bypasses RLS —
-- required for the profiles policy below: a plain correlated subquery on
-- profiles from within a policy ON profiles re-triggers that same policy
-- and Postgres errors with "infinite recursion detected in policy".
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;

-- profiles: admins can read and update any row
drop policy if exists "admin full access to profiles" on public.profiles;
create policy "admin full access to profiles"
  on public.profiles for all
  using (public.is_admin());

-- sessions: admins can read any session
drop policy if exists "admin read all sessions" on public.sessions;
create policy "admin read all sessions"
  on public.sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- drills: admins can read, insert, update, delete any drill
drop policy if exists "admin full access to drills" on public.drills;
create policy "admin full access to drills"
  on public.drills for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- times: admins can read any logged time
drop policy if exists "admin read all times" on public.times;
create policy "admin read all times"
  on public.times for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- bookings: admins can read and update any booking
drop policy if exists "admin full access to bookings" on public.bookings;
create policy "admin full access to bookings"
  on public.bookings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ─── Email column ──────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists email text;

-- Trigger: keep profiles.email in sync with auth.users.email
create or replace function public.sync_user_email()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_sync on auth.users;
create trigger on_auth_user_email_sync
  after insert or update of email on auth.users
  for each row execute function public.sync_user_email();

-- Backfill existing users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');
