-- SwimCoach seed data.
-- NOTE: auth.users rows must exist first. Create the coach + swimmer auth
-- accounts via the Supabase dashboard or admin API, then map their UUIDs
-- to the placeholders below. For local dev these fixed UUIDs are used.

-- Fixed UUIDs for deterministic local seeding ------------------------------
-- coach@swimcoach.app
\set coach_id '00000000-0000-0000-0000-000000000001'
\set sw1 '00000000-0000-0000-0000-000000000011'  -- beginner
\set sw2 '00000000-0000-0000-0000-000000000012'  -- intermediate
\set sw3 '00000000-0000-0000-0000-000000000013'  -- intermediate
\set sw4 '00000000-0000-0000-0000-000000000014'  -- elite

-- Profiles (these assume matching auth.users rows already exist) -----------
insert into profiles (id, full_name, role, level) values
  (:'coach_id', 'Alex Carter', 'coach', null),
  (:'sw1', 'Mia Lopez', 'swimmer', 'beginner'),
  (:'sw2', 'Jordan Reed', 'swimmer', 'intermediate'),
  (:'sw3', 'Sam Patel', 'swimmer', 'intermediate'),
  (:'sw4', 'Taylor Nguyen', 'swimmer', 'elite')
on conflict (id) do nothing;

-- Swimmers ------------------------------------------------------------------
insert into swimmers (id, coach_id, profile_id, display_name, squad, level, notes) values
  ('10000000-0000-0000-0000-000000000001', :'coach_id', :'sw1', 'Mia Lopez', 'Development', 'beginner', 'New to squad, building endurance.'),
  ('10000000-0000-0000-0000-000000000002', :'coach_id', :'sw2', 'Jordan Reed', 'Senior', 'intermediate', 'Strong freestyle, working on turns.'),
  ('10000000-0000-0000-0000-000000000003', :'coach_id', :'sw3', 'Sam Patel', 'Senior', 'intermediate', 'Breaststroke specialist.'),
  ('10000000-0000-0000-0000-000000000004', :'coach_id', :'sw4', 'Taylor Nguyen', 'Performance', 'elite', 'Regional qualifier, IM focus.')
on conflict (id) do nothing;

-- Sessions: one past, one today, one future -------------------------------
insert into sessions (id, coach_id, title, date, type, warm_up, main_set, cool_down, notes) values
  ('20000000-0000-0000-0000-000000000001', :'coach_id', 'Endurance Base', current_date - 3, 'training',
    '400m easy free, 200m kick', '8 x 100m free on 1:40', '200m easy backstroke', 'Aerobic focus.'),
  ('20000000-0000-0000-0000-000000000002', :'coach_id', 'Threshold Friday', current_date, 'training',
    '300m mixed, 4 x 50m drill', '10 x 100m free on 1:30, build each 4th', '200m easy', 'Hold pace on the back half.'),
  ('20000000-0000-0000-0000-000000000003', :'coach_id', 'Time Trials', current_date + 4, 'race',
    '600m progressive warm-up', '100m free for time, full rest, 200m IM for time', '300m loosen down', 'Race pace.')
on conflict (id) do nothing;

-- Assignments ---------------------------------------------------------------
insert into session_assignments (session_id, swimmer_id, attended) values
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', false),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', false),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', false),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', false)
on conflict do nothing;

-- Times: spread across strokes/dates so charts render ----------------------
insert into times (swimmer_id, coach_id, stroke, distance, time_seconds, is_pb, recorded_at) values
  -- Jordan (sw2) freestyle 100m progression
  ('10000000-0000-0000-0000-000000000002', :'coach_id', 'freestyle', 100, 68.4, false, now() - interval '40 days'),
  ('10000000-0000-0000-0000-000000000002', :'coach_id', 'freestyle', 100, 66.9, false, now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000002', :'coach_id', 'freestyle', 100, 65.2, true,  now() - interval '8 days'),
  ('10000000-0000-0000-0000-000000000002', :'coach_id', 'freestyle', 50, 31.1, true, now() - interval '8 days'),
  -- Taylor (sw4) elite IM + fly
  ('10000000-0000-0000-0000-000000000004', :'coach_id', 'IM', 200, 138.2, false, now() - interval '30 days'),
  ('10000000-0000-0000-0000-000000000004', :'coach_id', 'IM', 200, 135.6, true,  now() - interval '10 days'),
  ('10000000-0000-0000-0000-000000000004', :'coach_id', 'butterfly', 100, 61.3, true, now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000004', :'coach_id', 'freestyle', 100, 56.8, true, now() - interval '5 days'),
  -- Sam (sw3) breaststroke
  ('10000000-0000-0000-0000-000000000003', :'coach_id', 'breaststroke', 100, 82.5, false, now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000003', :'coach_id', 'breaststroke', 100, 80.9, true,  now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000003', :'coach_id', 'breaststroke', 50, 38.4, true, now() - interval '6 days'),
  -- Mia (sw1) beginner first times
  ('10000000-0000-0000-0000-000000000001', :'coach_id', 'freestyle', 25, 24.9, true, now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000001', :'coach_id', 'freestyle', 50, 58.2, true, now() - interval '4 days'),
  ('10000000-0000-0000-0000-000000000001', :'coach_id', 'backstroke', 25, 28.7, true, now() - interval '4 days')
on conflict do nothing;

-- Goals ---------------------------------------------------------------------
insert into goals (swimmer_id, stroke, distance, target_time_seconds, deadline, achieved) values
  ('10000000-0000-0000-0000-000000000002', 'freestyle', 100, 63.0, current_date + 60, false),
  ('10000000-0000-0000-0000-000000000004', 'IM', 200, 132.0, current_date + 45, false),
  ('10000000-0000-0000-0000-000000000001', 'freestyle', 50, 55.0, current_date + 90, false)
on conflict do nothing;

-- Built-in global drills ----------------------------------------------------
insert into drills (coach_id, title, description_plain, description_technical, stroke, level) values
  (null, 'Catch-up drill',
    'One arm waits stretched out in front while the other arm does a full stroke and comes back to meet it. Teaches a long, patient stroke.',
    'Front-quadrant timing drill. The lead hand remains extended at full reach until the recovering hand touches it before initiating the catch. Reinforces stroke length and reduces overlap-induced drag.',
    'freestyle', 'beginner'),
  (null, 'Fingertip drag',
    'During the recovery, drag your fingertips along the surface of the water. Keeps your elbow high.',
    'High-elbow recovery drill. Maintaining fingertip contact with the surface enforces elbow elevation above the wrist, promoting an efficient recovery path and proper hand entry alignment.',
    'freestyle', 'intermediate'),
  (null, 'Bilateral breathing',
    'Breathe to both sides — every third arm stroke. Helps you swim straight and balanced.',
    'Alternate-side breathing pattern (breath every 3 strokes) to develop symmetrical body roll and reduce unilateral muscular dominance and tracking deviation.',
    'freestyle', 'intermediate'),
  (null, 'Kick sets',
    'Hold a kickboard out in front and kick from the hips to the end of the pool and back.',
    'Isolated propulsion development using a board to fix the upper body, emphasising hip-driven flutter kick with minimal knee flexion and pointed ankles for plantar-flexion propulsion.',
    null, 'beginner'),
  (null, 'Pull buoy set',
    'Put a float between your thighs so your legs rest, and focus only on your arm pulls.',
    'Lower-body flotation aid isolates the propulsive arm stroke, allowing focus on catch mechanics and pull-through power while removing kick-derived propulsion and body-position confounds.',
    null, 'intermediate')
on conflict do nothing;
