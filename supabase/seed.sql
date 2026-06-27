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
    null, 'intermediate'),

  -- Freestyle drills
  (null, 'Side kick',
    'Kick on your side with one arm extended and the other at your hip. Hold 6 kicks, then rotate and breathe.',
    'Unilateral balance drill. Maintain a rotated body position (45–70°) to develop axis of rotation awareness and reinforce the hip-driven rotation that powers an efficient freestyle stroke.',
    'freestyle', 'beginner'),
  (null, 'Zipper drill',
    'During recovery, drag your thumb up your ribs from hip to armpit before extending forward. Keeps your elbow high.',
    'Recovery pathway correction drill targeting high-elbow mechanics. Thumb-to-armpit contact enforces elbow elevation and lateral body clearance, preventing a wide swinging recovery.',
    'freestyle', 'intermediate'),
  (null, '6-1-6 drill',
    'Kick on your side for 6 kicks, take one stroke, then kick 6 more times on the other side before breathing.',
    'Timing integration drill. The pause between strokes allows conscious observation of body rotation timing and front-quadrant hand position, building coordinated hip-to-hand connection.',
    'freestyle', 'intermediate'),
  (null, 'DPS counting',
    'Count your strokes per length. Try to reduce your count by one each lap while holding speed.',
    'Distance-per-stroke optimisation drill. Reducing stroke count at constant speed requires greater propulsive efficiency per cycle — typically achieved through improved catch depth and longer reach.',
    'freestyle', 'elite'),
  (null, 'Sculling — front scull',
    'Lie flat and scull with both hands in front of your head (palms angled in and out) to move forward.',
    'Catch-phase proprioception drill. Inward and outward hand pitching at the catch position develops pressure sensitivity and correct forearm alignment for the high-elbow catch.',
    'freestyle', 'intermediate'),
  (null, 'Head-lead body rotation',
    'Float face-down, arms at sides, and rotate your body from side to side as you kick — no arm action.',
    'Isolated trunk-rotation drill. Develops the hip-shoulder separation needed to drive a powerful freestyle rotation without relying on arm momentum to initiate the movement.',
    'freestyle', 'beginner'),

  -- Backstroke drills
  (null, 'Pinky-first backstroke entry',
    'Focus on entering the water little-finger-first behind your shoulder. Pause after each entry.',
    'Entry alignment drill correcting the common flat-palm slap. Pinky-first entry rotates the hand into the correct pitch, enabling immediate lateral force application at the start of the pull.',
    'backstroke', 'beginner'),
  (null, 'Flags-to-finish counting',
    'Count your strokes from the backstroke flags (5m out) to the wall during every lap.',
    'Proprioceptive turn-preparation drill. Consistent stroke counting from the flags eliminates head-turning and allows confident closed-eye T-wall approach, critical for race turns.',
    'backstroke', 'intermediate'),
  (null, 'One-arm backstroke',
    'Swim backstroke with one arm only, keeping the other at your side. Focus on shoulder rotation.',
    'Unilateral pulling drill. Eliminates the assistance of the idle arm to expose asymmetries in shoulder rotation, catch depth, and finish position on each side independently.',
    'backstroke', 'intermediate'),

  -- Breaststroke drills
  (null, '2-1 breaststroke',
    'Take two breaststroke kicks for every one arm pull. Forces you to feel the full glide after each kick.',
    'Glide-timing drill. The extra kick cycle extends the streamlined pause, reinforcing that the glide is propulsive rather than passive, and prevents rushing into the next arm pull.',
    'breaststroke', 'beginner'),
  (null, 'Breaststroke kick on back',
    'Float on your back, arms at sides, and kick breaststroke-style. Watch your feet and toes.',
    'Visual feedback drill for breaststroke kick mechanics. Dorsiflexion (toes toward shins) and symmetric heel-recovery become visible, enabling immediate self-correction of flutter-kick errors.',
    'breaststroke', 'beginner'),
  (null, 'Prayer hands drill',
    'Keep both hands pressed together in front throughout the stroke — only your arms separate during the out-sweep.',
    'Narrowness drill constraining the out-sweep width. Prevents over-wide pulls and reinforces the narrow, in-line recovery position that minimises frontal drag in breaststroke.',
    'breaststroke', 'intermediate'),

  -- Butterfly drills
  (null, 'Body dolphin (no arms)',
    'Kick underwater with arms at your sides or extended, focusing on a wave-like motion from chest to toes.',
    'Isolated undulation drill. Emphasises the two-beat body-wave mechanics that drive butterfly without the cognitive load of arm coordination — develops core-to-toe connection and kick timing.',
    'butterfly', 'beginner'),
  (null, 'One-arm butterfly',
    'Swim butterfly using only one arm while the other stays extended in front. Breathe to the side of the working arm.',
    'Asymmetric coordination drill. Reduces the stroke to a manageable tempo and allows focus on individual arm mechanics (catch, pull, recovery) before reintegrating both arms.',
    'butterfly', 'intermediate'),
  (null, '3-3-3 butterfly',
    'Take 3 strokes breathing every stroke, 3 strokes breathing every other stroke, 3 strokes holding your breath.',
    'Breathing-pattern progression drill. Builds the aerobic capacity and neck control needed for race-legal butterfly breathing without excessive head elevation on each breath.',
    'butterfly', 'elite'),

  -- IM / General
  (null, 'IM transition drill',
    'Swim 25m of each stroke back-to-back without rest, focusing on the switch at each wall.',
    'Stroke-transition drill for Individual Medley. Addresses the often-neglected transition wall — from butterfly to backstroke (underwater dolphin kick) and breaststroke to freestyle (open turn).',
    'IM', 'intermediate'),
  (null, 'Vertical kick',
    'Tread water in the deep end using only your kick — no arm sculling. Hold 30–60 seconds.',
    'Kick strength and proprioception drill performed in a fixed vertical position. Removes body angle as a compensation variable, exposing kick power deficits and propulsive consistency.',
    null, 'intermediate'),
  (null, 'Underwater streamline push-off',
    'Push off the wall in a tight streamline and hold the glide as long as possible before breaking the surface.',
    'Hydrodynamic efficiency drill. Maximises the free speed of the push-off and develops body-position awareness at race-legal depth (0.4–0.6m), applicable to every stroke's turn or start.',
    null, 'beginner'),
  (null, 'Descending 50m repeats',
    'Swim 4–6 × 50m where each rep is 1–2 seconds faster than the last. Aim to make the last rep your best.',
    'Pacing and effort-calibration set. Develops the ability to read and distribute effort across a set — a fundamental skill for racing and threshold training. Log your split times for reference.',
    null, 'elite')
on conflict do nothing;
