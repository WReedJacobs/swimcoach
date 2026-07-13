-- 'advanced' was added to the swim_level enum at the end of 010_swimmer_plans.sql —
-- has to land in an earlier, separately-committed transaction because Postgres
-- forbids using a brand-new enum value in the same transaction that adds it,
-- and this file's own INSERT below needs it.

-- Add focus column for technique cue
ALTER TABLE drills ADD COLUMN IF NOT EXISTS focus text;

-- Unique index on global drill titles so the seed is idempotent
CREATE UNIQUE INDEX IF NOT EXISTS drills_global_title_unique
  ON drills (title) WHERE coach_id IS NULL;

-- ─── 45 built-in drills ──────────────────────────────────────────────────────
INSERT INTO drills (title, stroke, level, description_plain, description_technical, focus) VALUES

-- FREESTYLE
('Catch-Up Drill', 'freestyle', 'beginner',
 'One arm stays stretched out in front while the other completes a full stroke. They "catch up" before the next arm goes.',
 'Promotes early vertical forearm and improves stroke timing. Lead arm held at extension until recovering arm catches up at full reach.',
 'Stroke timing and extension'),

('Fingertip Drag', 'freestyle', 'beginner',
 'As your arm recovers over the water, drag your fingertips lightly along the surface. It forces a high elbow.',
 'Reinforces high elbow recovery and shortens the recovery arc. Prevents wide swinging arm recovery.',
 'High elbow recovery'),

('Fist Drill', 'freestyle', 'intermediate',
 'Swim with your hands in a fist. When you open them again, the water feels like a paddle — it teaches you to use your whole forearm.',
 'Reduces hand-dependent catch mechanics. Forces engagement of the forearm as the primary catch surface. Improves feel for the water.',
 'Forearm catch awareness'),

('Side Kick', 'freestyle', 'beginner',
 'Kick on your side with the bottom arm extended and the top arm along your body. Focus on keeping your body flat and kicking from the hip.',
 'Develops body rotation awareness and hip-driven kick. Bottom arm in streamline, head in neutral position, kick for 25m each side.',
 'Body rotation and kick'),

('6-3-6 Kick', 'freestyle', 'intermediate',
 'Kick 6 times on one side, take 3 strokes, then kick 6 times on the other side. Pause to breathe during the side-kick phases.',
 'Isolates body rotation timing relative to the catch. Develops the connection between shoulder roll and hand entry. Common in high-performance squads.',
 'Rotation timing'),

('Sighting Drill', 'freestyle', 'beginner',
 'Every 5-6 strokes, lift your eyes forward just above the water surface (don''t lift your head) to see where you''re going.',
 'Teaches open-water sighting technique with minimal head lift. Eyes clear the water on the inhale — head drops immediately on exhale.',
 'Head position and sighting'),

('Unco Drill', 'freestyle', 'advanced',
 'One arm pulls while the other recovers at the same time — the opposite of normal. It feels strange but builds timing awareness.',
 'Counter-rotation drill that exposes timing asymmetries. Opposite arm moves simultaneously — in while the other is out. Reveals shoulder dominance.',
 'Stroke symmetry'),

('Zipper Drill', 'freestyle', 'beginner',
 'During recovery, drag your thumb up your side like you''re doing up a zip. Keeps your elbow high and close to your body.',
 'Shortens the recovery lever and ensures elbow-lead recovery. Thumb traces the lateral line from hip to armpit. Prevents crossover entry.',
 'Elbow-lead recovery'),

('Single Arm Freestyle', 'freestyle', 'intermediate',
 'Swim using only one arm at a time, with the other arm stretched out in front. Swap arms each length.',
 'Isolates the catch and pull phase. Non-stroking arm held at full extension. Exposes asymmetry in catch depth and pull pathway.',
 'Catch and pull isolation'),

('Doggy Paddle', 'freestyle', 'beginner',
 'Keep your face in the water and pull your hands back under your chest, like a dog swimming. Shows you what the catch and pull phase feels like.',
 'Demonstrates the early vertical forearm catch at slow speed. Hands enter shallow, elbow bends immediately, pull under centreline.',
 'Early vertical forearm'),

('Pull Buoy Freestyle', 'freestyle', 'beginner',
 'Put a float between your thighs and swim using only your arms. Your legs float up and you can focus on your arm pull.',
 'Eliminates kick contribution. Elevates hips artificially to isolate arm mechanics. Used to overload the pull or reduce fatigue during technique sets.',
 'Arm pull isolation'),

('Hypoxic Freestyle', 'freestyle', 'intermediate',
 'Breathe every 3 strokes, then every 5, then every 7 — in that order. Challenging but teaches controlled breathing.',
 'Progressive breath restriction set. Develops CO2 tolerance and bilateral breathing habit. Drop back to 3 if form breaks down.',
 'Breathing control'),

-- BACKSTROKE
('Single Arm Backstroke', 'backstroke', 'beginner',
 'Swim using only one arm, with the other resting on your hip. Focus on reaching back and pulling through straight.',
 'Isolates the catch-to-finish pathway. Non-stroking arm rests at the hip. Focus on little-finger entry and full extension before the pull.',
 'Catch and finish'),

('Backstroke Catch-Up', 'backstroke', 'intermediate',
 'Hold one arm pointing at the ceiling while the other completes a full stroke. They meet overhead before the next arm goes.',
 'Extends the front quadrant and promotes full hip rotation. Arms meet at the top of the stroke before the next arm initiates entry.',
 'Hip rotation and timing'),

('6-Kick Switch Backstroke', 'backstroke', 'intermediate',
 'Kick 6 times on your side, then take one backstroke and kick 6 times on the other side. Pause and feel your body position.',
 'Side-lying kick drill emphasising head-neutral position and hip-driven rotation. One pull initiates the rotation to the opposite side.',
 'Body rotation awareness'),

('Backstroke Sculling', 'backstroke', 'beginner',
 'Float on your back and move just your hands in small figure-8 patterns near your hips to move yourself along the water.',
 'Develops feel for the water at the wrist and forearm. Flat sculling position — hands pitch slightly to generate propulsion.',
 'Water feel and catch'),

('Pinky-First Entry Drill', 'backstroke', 'beginner',
 'Focus on entering your hand little-finger first, with your arm in line with your shoulder. Avoid entry across your centreline.',
 'Corrects crossover entry by reinforcing lateral hand entry. Hand enters at 11 and 1 o''clock positions, not past centre.',
 'Hand entry position'),

('Backstroke Flags Awareness', 'backstroke', 'beginner',
 'On backstroke, count your strokes from when you pass under the flags (5m from the wall). Know your number so you always hit the turn right.',
 'Develops the stroke count to the turn — crucial for backstroke racing and training. Count from flags to touch — usually 3-5 strokes.',
 'Turn awareness'),

-- BREASTSTROKE
('Breaststroke Kick Only', 'breaststroke', 'beginner',
 'Hold a kickboard and use only your legs in a frog kick to move forward. Focus on drawing your heels up and snapping your feet together.',
 'Isolates the whip kick mechanics. Arms extended over kickboard. Heels draw toward glutes, feet evert, then snap together.',
 'Whip kick mechanics'),

('Pull Buoy Breaststroke', 'breaststroke', 'intermediate',
 'Put a pull buoy between your legs to stop your legs moving, then swim breaststroke using only your arms.',
 'Isolates arm pull and breathing timing. Eliminates kick contribution. Focus on the narrow inward scull and quick recovery.',
 'Pull timing and breath'),

('2-Kick 1-Pull Breaststroke', 'breaststroke', 'intermediate',
 'Do two breaststroke kicks for every one arm pull. Odd rhythm at first, but it builds a feel for the glide phase.',
 'Develops feel for the glide and strengthens the kick. Forces patience in the glide before initiating the pull.',
 'Glide phase and kick'),

('Breaststroke Timing Drill', 'breaststroke', 'beginner',
 'Swim normal breaststroke but pause for 2 seconds in the stretched glide position after every kick. Count: pull, breathe, kick, glide-2-3.',
 'Reinforces the pull-breathe-kick-glide sequence. Builds patience in the glide phase and ensures full streamline between cycles.',
 'Pull-breathe-kick-glide timing'),

('Breaststroke on Back', 'breaststroke', 'advanced',
 'Float on your back and do a breaststroke kick — heels up toward your bottom, then push out and together. Easier to see your own kick.',
 'Provides visual feedback on kick symmetry and foot position. Reveals asymmetric kick patterns invisible when prone.',
 'Kick symmetry'),

-- BUTTERFLY
('Body Dolphin', 'butterfly', 'beginner',
 'Lie flat and let your whole body undulate like a wave — starting from your chest, through your hips, and out through your feet. No arms yet.',
 'Develops the fundamental undulation pattern before adding arm mechanics. Focus on chest-down initiation — not hip-first.',
 'Full body undulation'),

('Kick on Back Butterfly', 'butterfly', 'beginner',
 'Lie on your back and dolphin kick underwater. Both legs move together in a wave. You can watch your feet and see your kick.',
 'Provides visual feedback on kick amplitude and symmetry. Less physically taxing starting position for developing the dolphin kick.',
 'Dolphin kick development'),

('One-Arm Butterfly', 'butterfly', 'intermediate',
 'Swim butterfly using only one arm. The other arm stays stretched out in front. Swap arms each length.',
 'Reduces coordination demand. Allows focus on timing of single arm relative to the kick. Two kicks per single arm cycle — one at entry, one at exit.',
 'Arm-kick timing'),

('Butterfly Timing Drill', 'butterfly', 'advanced',
 'Swim butterfly but pause briefly when both hands enter the water. Feel the second kick drive you forward before you pull.',
 'Develops second kick timing. Pause on hand entry — feel the kick drive before initiating the pull. Common in elite technique work.',
 'Second kick timing'),

('Underwater Dolphin Kick', 'butterfly', 'intermediate',
 'Push off the wall and dolphin kick underwater for 10-15 metres before surfacing. Arms in streamline. This is one of the fastest positions in swimming.',
 'Develops underwater phase — the 15m rule allows maximum underwater streamline. Core engagement maintains amplitude without over-kicking.',
 'Streamline and underwater speed'),

-- GENERAL / MULTI-STROKE
('Streamline Push-Off', 'freestyle', 'beginner',
 'Push off the wall with your arms squeezed tightly by your ears, thumbs crossed, hands stacked. Hold the position as long as possible.',
 'Establishes the foundational streamline shape — arms locked, head neutral, core braced. Timed distance from wall is a useful benchmark.',
 'Streamline position'),

('Flat Sculling', 'freestyle', 'beginner',
 'Float face-down with arms stretched forward. Make small figure-8 movements with your hands to pull yourself forward without pulling your arms back.',
 'Develops feel for the water at the catch. Flat pitch generates forward propulsion. Foundation for catch and pull technique.',
 'Water feel'),

('Feet-First Sculling', 'freestyle', 'intermediate',
 'Float face-down and scull with your hands near your hips to move yourself backwards, feet-first. Builds strong feel for pushing water.',
 'Develops the finish and exit. Hands near hips, pitch changes to push water toward the feet. Improves finish mechanics across all strokes.',
 'Finish and exit feel'),

('Kick on Side', 'freestyle', 'beginner',
 'Roll onto your side and kick with one arm extended and the other resting on your hip. Face down slightly. Builds kick strength and body position.',
 'Side-lying flutter kick drill. Head in neutral position with one goggle submerged. Develops the balance point for a rotation-based freestyle.',
 'Balance and kick'),

('Vertical Kick', 'freestyle', 'intermediate',
 'Tread water using only a flutter kick — no arm movement. Keep your arms folded on your chest or crossed. 20-30 seconds at a time.',
 'High-resistance kick drill that builds strength and ankle flexibility. Both flutter and dolphin kick variations are used.',
 'Kick strength'),

('Tarzan Freestyle', 'freestyle', 'beginner',
 'Swim freestyle with your head up, looking forward the whole time, like a lifeguard swim. Your hips will drop — notice how much harder it is.',
 'Demonstrates effect of head position on body position. Hips drop significantly when the head is lifted. Used in open water training.',
 'Head position effect'),

('IM Transition Drill', 'freestyle', 'advanced',
 'Swim one length of each stroke in IM order (butterfly, backstroke, breaststroke, freestyle) but focus on the transition — the turn between each stroke.',
 'Develops open turn mechanics at the breaststroke-to-freestyle wall and the IM transition. Reinforces stroke order and legal turn requirements.',
 'IM turns and transitions'),

('Kick Without Board', 'freestyle', 'beginner',
 'Flutter kick with your arms stretched out in front — no kickboard. Breathe every 6 kicks by pressing your head down and looking forward.',
 'More demanding than kickboard kick — requires body position maintenance and breathing control without the float assistance.',
 'Kick and body position'),

('High Elbow Catch Drill', 'freestyle', 'intermediate',
 'Swim with focus on bending your elbow as soon as your hand enters the water — keeping your elbow high while your hand drops. Think "show your armpit".',
 'Develops early vertical forearm position. Elbow flexes to approximately 90 degrees at the catch, hand drops vertically — maximising projected area.',
 'Early vertical forearm'),

('Distance Per Stroke', 'freestyle', 'intermediate',
 'Count your strokes each lap and try to reduce the number. The fewer strokes to cross the pool, the better your efficiency.',
 'DPS (distance per stroke) training. Count strokes per length — attempt to reduce count while maintaining or increasing pace. Combine with SWOLF score.',
 'Stroke efficiency'),

('Broken Swims', 'freestyle', 'advanced',
 'Swim a longer distance but pause for 10 seconds at the halfway point. Compare your split times and see if you can go negative (faster second half).',
 'Pacing and threshold development. 5-10 second rest at 50m in a 100m. Target is a negative split — second 50 faster than first.',
 'Pacing and splits'),

('Pull Pattern Practice', 'freestyle', 'intermediate',
 'Focus only on where your hand goes underwater — try to pull in a straight line from in front of your shoulder down to your hip.',
 'Addresses crossover pull and corrects the S-pull myth. Straight-line pull from catch to exit. Maintain high elbow throughout.',
 'Pull pathway'),

('Sprint Kick Set', 'freestyle', 'intermediate',
 '8 x 25m kick sprints with 20 seconds rest. Go as hard as you can for each one. Builds kick power and anaerobic capacity.',
 'Alactic and glycolytic kick training. Maximum intensity for 25m, full rest. Measures kick power degradation across the set.',
 'Kick power and speed'),

('Breaststroke Glide Challenge', 'breaststroke', 'beginner',
 'See how far you can glide after each kick without adding another kick. The further you glide, the better your streamline.',
 'Quantifies streamline efficiency. Time or distance the glide from kick completion to momentum cessation. Improves narrow streamline position.',
 'Streamline and glide distance'),

('Catch-Up Backstroke', 'backstroke', 'beginner',
 'Swim backstroke with both arms stretched above your head to start. Pull one arm through, then wait until it returns to the top before the other arm goes.',
 'Slows the stroke cycle to allow focus on hip rotation and clean entry. Reduces timing errors for newer backstroke swimmers.',
 'Stroke timing'),

('Fin Butterfly', 'butterfly', 'beginner',
 'Put on short fins and swim butterfly. The extra propulsion from the fins makes the timing easier to feel and sustain.',
 'Reduces the fitness demand of butterfly so technique development can occur. Short fins (not long) — long fins alter kick timing.',
 'Butterfly rhythm with support'),

('Negative Split 100', 'freestyle', 'intermediate',
 'Swim a 100m and aim to make the second 50m faster than the first. Start conservatively, build through the middle, and finish strong.',
 'Pacing discipline drill. Forces conservative first half. Second split should be 1-3 seconds faster in training conditions.',
 'Pacing and race control')

ON CONFLICT (title) WHERE coach_id IS NULL DO NOTHING;
