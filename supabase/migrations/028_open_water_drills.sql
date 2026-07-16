-- ─── 028_open_water_drills.sql ────────────────────────────────────────────
-- Milestone 6 — open-water / taper-aware content. `environment` follows
-- 011_seed_drills.sql's own convention (closed-value field -> enum,
-- matching 001_initial.sql's stroke_type/swim_level), defaulting existing
-- rows to 'pool' so nothing already in the drill library changes meaning.

create type drill_environment as enum ('pool', 'open_water');

alter table drills
  add column environment drill_environment not null default 'pool';

-- ─── A handful of built-in open-water/sighting drills ─────────────────────
-- Pickable from the drill library like any other (per 011_seed_drills.sql's
-- coach_id IS NULL "global" convention), not just generator output.
--
-- A "Sighting Drill" already exists globally (predates this migration) —
-- same concept this milestone calls for, so it's tagged open_water in
-- place rather than duplicated.
update drills set environment = 'open_water' where title = 'Sighting Drill' and coach_id is null;

insert into drills (title, stroke, level, description_plain, description_technical, focus, environment) values

('Bilateral Sight-and-Breathe', 'freestyle', 'advanced',
 'Combine a sight with your breath: lift your eyes forward on one stroke, then rotate and breathe to the side on the very next one.',
 'Chains the sighting action directly to the existing breathing pattern rather than treating it as a separate interruption, keeping stroke tempo more consistent in race conditions.',
 'Sighting integrated with bilateral breathing', 'open_water'),

('Draft & Pack Swim Simulation', 'freestyle', 'advanced',
 'Swim close behind or beside a lane-mate''s feet or hip, like drafting in open water. Practice holding position without touching.',
 'Builds comfort swimming in close proximity and turbulent water, and teaches pacing off another swimmer''s rhythm — a core open-water/triathlon skill pools don''t naturally teach.',
 'Drafting and race-contact comfort', 'open_water'),

('Eyes-Closed Straight Swim', 'freestyle', 'intermediate',
 'Swim 10-15 strokes with your eyes closed, staying in your lane, then open your eyes and check your line.',
 'Surfaces a swimmer''s natural drift bias (most people veer to one side without a line to follow) so they know which way to compensate for when sighting in open water.',
 'Straight-line body awareness without a lane line', 'open_water'),

('Wetsuit Shoulder Mobility Swim', 'freestyle', 'beginner',
 'Swim continuous freestyle focusing on a shorter, higher-elbow recovery — the same adjustment a wetsuit''s restricted shoulder movement forces in open water.',
 'Pre-conditions the stroke pattern for reduced shoulder external rotation before race week, when a real wetsuit will impose the same constraint — reduces the shock of first-time wetsuit swims.',
 'Shoulder-restricted stroke pattern (wetsuit prep)', 'open_water'),

('Choppy-Water Breathing Control', 'freestyle', 'intermediate',
 'Swim with a deliberately shortened, punchier breath — in and out quickly — as if timing a breath between waves.',
 'Builds tolerance for the irregular, hurried breathing pattern open water and chop force, versus the unhurried breath a still pool allows.',
 'Breath control under simulated chop', 'open_water');
