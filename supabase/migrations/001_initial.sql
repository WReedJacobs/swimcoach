-- SwimCoach initial schema + RLS
-- Run against a fresh Supabase project.

-- ---------- Enums ----------
create type user_role as enum ('coach', 'swimmer', 'beginner');
create type swim_level as enum ('beginner', 'intermediate', 'elite');
create type stroke_type as enum ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'IM');
create type session_kind as enum ('training', 'race', 'dryland');
create type booking_state as enum ('pending', 'confirmed', 'cancelled');

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'beginner',
  avatar_url text,
  level swim_level,
  coach_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- swimmers ----------
create table swimmers (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  profile_id uuid references profiles (id) on delete set null,
  display_name text not null default 'Swimmer', -- shown until/unless a profile is linked
  invite_email text,
  squad text,
  level swim_level not null default 'beginner',
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- sessions ----------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  date date not null default current_date,
  type session_kind not null default 'training',
  warm_up text,
  main_set text,
  cool_down text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- session_assignments ----------
create table session_assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  swimmer_id uuid not null references swimmers (id) on delete cascade,
  attended boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- times ----------
create table times (
  id uuid primary key default gen_random_uuid(),
  swimmer_id uuid not null references swimmers (id) on delete cascade,
  coach_id uuid references profiles (id) on delete set null,
  session_id uuid references sessions (id) on delete set null,
  stroke stroke_type not null,
  distance int not null,
  time_seconds double precision not null,
  is_pb boolean not null default false,
  is_self_logged boolean not null default false,
  recorded_at timestamptz not null default now(),
  notes text
);

-- ---------- drills ----------
create table drills (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles (id) on delete cascade, -- null = global
  title text not null,
  description_plain text not null,
  description_technical text not null,
  stroke stroke_type,
  level swim_level,
  video_url text,
  created_at timestamptz not null default now()
);

-- ---------- feedback ----------
create table feedback (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  swimmer_id uuid not null references swimmers (id) on delete cascade,
  session_id uuid references sessions (id) on delete set null,
  content text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- messages ----------
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- bookings ----------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  swimmer_id uuid not null references swimmers (id) on delete cascade,
  session_id uuid references sessions (id) on delete set null,
  requested_at timestamptz not null default now(),
  status booking_state not null default 'pending',
  notes text
);

-- ---------- goals ----------
create table goals (
  id uuid primary key default gen_random_uuid(),
  swimmer_id uuid not null references swimmers (id) on delete cascade,
  stroke stroke_type not null,
  distance int not null,
  target_time_seconds double precision not null,
  deadline date,
  achieved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- milestones (beginner self-guided) ----------
create table milestones (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  label text not null,
  distance int not null,
  achieved boolean not null default false,
  achieved_at timestamptz
);

-- =====================================================
-- Helper: a swimmer row's owning profile_id
-- =====================================================

-- =====================================================
-- Row Level Security
-- =====================================================
alter table profiles enable row level security;
alter table swimmers enable row level security;
alter table sessions enable row level security;
alter table session_assignments enable row level security;
alter table times enable row level security;
alter table drills enable row level security;
alter table feedback enable row level security;
alter table messages enable row level security;
alter table bookings enable row level security;
alter table goals enable row level security;
alter table milestones enable row level security;

-- profiles: anyone authed can read (needed for rosters/messaging name lookups),
-- but you can only write your own row.
create policy "profiles readable by authenticated"
  on profiles for select using (auth.role() = 'authenticated');
create policy "update own profile"
  on profiles for update using (auth.uid() = id);
create policy "insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- swimmers: a coach owns their swimmer rows; a swimmer can read their own row.
create policy "coach manages own swimmers"
  on swimmers for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);
create policy "swimmer reads own swimmer row"
  on swimmers for select
  using (auth.uid() = profile_id);

-- sessions: coach owns; swimmers read sessions assigned to them.
create policy "coach manages own sessions"
  on sessions for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);
create policy "swimmer reads assigned sessions"
  on sessions for select
  using (
    exists (
      select 1 from session_assignments sa
      join swimmers s on s.id = sa.swimmer_id
      where sa.session_id = sessions.id and s.profile_id = auth.uid()
    )
  );

-- session_assignments: coach (via owning session) full; swimmer reads own.
create policy "coach manages assignments"
  on session_assignments for all
  using (
    exists (select 1 from sessions se where se.id = session_id and se.coach_id = auth.uid())
  )
  with check (
    exists (select 1 from sessions se where se.id = session_id and se.coach_id = auth.uid())
  );
create policy "swimmer reads own assignments"
  on session_assignments for select
  using (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );

-- times: coach manages times for own swimmers; swimmer reads/writes own.
create policy "coach manages times"
  on times for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);
create policy "swimmer reads own times"
  on times for select
  using (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );
create policy "swimmer self-logs own times"
  on times for insert
  with check (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );

-- drills: everyone authed reads (global + any). Coaches write their own.
create policy "drills readable"
  on drills for select using (auth.role() = 'authenticated');
create policy "coach manages own drills"
  on drills for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- feedback: coach manages own; swimmer reads feedback about them.
create policy "coach manages feedback"
  on feedback for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);
create policy "swimmer reads own feedback"
  on feedback for select
  using (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );

-- messages: sender and recipient can read; only sender can write.
create policy "read own messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "send messages"
  on messages for insert
  with check (auth.uid() = sender_id);
create policy "mark read by recipient"
  on messages for update
  using (auth.uid() = recipient_id);

-- bookings: coach and the swimmer involved can read; swimmer creates; coach updates.
create policy "coach reads/updates bookings"
  on bookings for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);
create policy "swimmer reads own bookings"
  on bookings for select
  using (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );
create policy "swimmer requests booking"
  on bookings for insert
  with check (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );

-- goals: coach (of the swimmer) full; swimmer reads/writes own.
create policy "coach manages goals"
  on goals for all
  using (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.coach_id = auth.uid())
  )
  with check (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.coach_id = auth.uid())
  );
create policy "swimmer manages own goals"
  on goals for all
  using (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  )
  with check (
    exists (select 1 from swimmers s where s.id = swimmer_id and s.profile_id = auth.uid())
  );

-- milestones: each user owns their own (beginner self-guided).
create policy "manage own milestones"
  on milestones for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- =====================================================
-- Trigger: auto-create a profile row on signup
-- =====================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
