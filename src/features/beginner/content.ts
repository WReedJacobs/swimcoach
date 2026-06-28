// Static beginner-mode content: stroke guides, glossary, and the 4-week program.

export interface StrokeGuide {
  stroke: string
  blurb: string
  tips: string[]
  mistakes: string[]
  coachSpeak: { phrase: string; meaning: string }[]
}

export const strokeGuides: StrokeGuide[] = [
  {
    stroke: 'Freestyle',
    blurb:
      'The fastest and most common stroke. You lie on your front and pull one arm over at a time while kicking your legs.',
    tips: [
      'Keep your body long and flat, like an arrow.',
      'Turn your head to the side to breathe — don\'t lift it up.',
      'Kick from your hips, not your knees, with relaxed ankles.',
      'Reach forward fully with each arm before you pull.',
    ],
    mistakes: [
      'Lifting the head to breathe (your legs sink).',
      'Bending the knees too much when kicking.',
      'Pulling with a straight arm instead of bending the elbow.',
    ],
    coachSpeak: [
      { phrase: 'Catch-up drill', meaning: 'One arm waits stretched out in front while the other completes a full stroke.' },
      { phrase: 'High elbow', meaning: 'Keep your elbow above your hand during the recovery over the water.' },
      { phrase: 'Bilateral breathing', meaning: 'Breathe to both sides — every third arm stroke.' },
    ],
  },
  {
    stroke: 'Backstroke',
    blurb: 'Swum on your back. You pull with alternating arms and flutter-kick, looking up at the ceiling.',
    tips: [
      'Keep your ears in the water and eyes looking up.',
      'Roll your shoulders with each stroke.',
      'Enter the water with your little finger first.',
      'Keep a steady, gentle kick the whole time.',
    ],
    mistakes: [
      'Sitting up so your hips drop.',
      'Bending at the waist.',
      'Slapping the water with a flat hand on entry.',
    ],
    coachSpeak: [
      { phrase: 'Streamline off the wall', meaning: 'Push off tightly with arms squeezed by your ears.' },
      { phrase: 'Pinky-first entry', meaning: 'Rotate your hand so the little finger enters the water first.' },
    ],
  },
  {
    stroke: 'Breaststroke',
    blurb: 'A slower, rhythmic stroke. Your arms sweep out and in while your legs do a "frog" kick.',
    tips: [
      'Pull, breathe, kick, then glide — in that order.',
      'Keep the glide: stretch forward after every kick.',
      'Point your feet outward for the kick (like a frog).',
      'Keep the kick narrow and snappy.',
    ],
    mistakes: [
      'Rushing and skipping the glide.',
      'A flutter kick instead of a frog kick.',
      'Lifting the whole upper body out of the water to breathe.',
    ],
    coachSpeak: [
      { phrase: 'Whip kick', meaning: 'The frog-style kick where your feet whip together at the end.' },
      { phrase: 'Glide phase', meaning: 'The streamlined pause after the kick before the next pull.' },
    ],
  },
  {
    stroke: 'Butterfly',
    blurb: 'The hardest stroke. Both arms come over together while your body moves in a dolphin-like wave.',
    tips: [
      'Think of two kicks per arm pull — one as the hands enter, one as they exit.',
      'Lead the wave with your chest, not your head.',
      'Keep the rhythm smooth, not forced.',
      'Breathe forward low, keeping your chin near the water.',
    ],
    mistakes: [
      'Lifting the head too high to breathe.',
      'Forgetting the second kick.',
      'Pulling the arms too wide.',
    ],
    coachSpeak: [
      { phrase: 'Dolphin kick', meaning: 'Both legs kick together in a wave-like motion.' },
      { phrase: 'Two-beat timing', meaning: 'Two dolphin kicks for every full arm cycle.' },
    ],
  },
]

export interface GlossaryTerm {
  term: string
  definition: string
}

export const glossary: GlossaryTerm[] = [
  { term: 'Broken swim', definition: 'A race-distance swim split into sections with brief rests. e.g. "200 broken at 100" means swim 100m, rest 10 seconds, then swim the remaining 100m.' },
  { term: 'Catch', definition: 'The moment your hand grabs the water at the start of a pull.' },
  { term: 'Cool-down', definition: 'Easy swimming at the end of a session to recover.' },
  { term: 'CSS', definition: 'Critical Swim Speed — your aerobic threshold pace per 100m, calculated from a 400m and a 200m time trial. Used to set interval training paces.' },
  { term: 'Descending', definition: 'A set where each rep is faster than the last. "4 × 100m descending" means rep 4 should be your fastest.' },
  { term: 'Dolphin kick', definition: 'Both legs kicking together in a wave, used in butterfly.' },
  { term: 'DPS', definition: 'Distance Per Stroke — how far you travel per complete arm cycle. Improving DPS means fewer strokes and less wasted energy.' },
  { term: 'Drill', definition: 'A focused exercise that isolates one part of a stroke to improve it.' },
  { term: 'Flip turn', definition: 'A somersault turn at the wall used in freestyle and backstroke.' },
  { term: 'Glide', definition: 'A streamlined pause where you stretch and let momentum carry you.' },
  { term: 'IM', definition: 'Individual Medley — all four strokes swum in one race.' },
  { term: 'Interval', definition: 'The total time given for a swim plus rest, e.g. "on 1:30".' },
  { term: 'Kickboard', definition: 'A float you hold to isolate and train your kick.' },
  { term: 'Lap', definition: 'One length of the pool (sometimes two, depending on the club).' },
  { term: 'Negative split', definition: 'Swimming the second half of a race or set faster than the first half — a sign of smart pacing and controlled effort.' },
  { term: 'On the top', definition: 'Starting each rep when the clock hits :00 (the top of the minute). Your coach may say "leave on the top" to mean send-off on the minute.' },
  { term: 'PB', definition: 'Personal Best — your fastest ever time for an event.' },
  { term: 'Pull buoy', definition: 'A float held between the thighs to isolate the arm stroke.' },
  { term: 'Recovery', definition: 'The part of the stroke where your arm travels back over the water.' },
  { term: 'Send-off', definition: 'The total time for one rep plus rest. A "1:30 send-off" means you leave for the next rep 1 min 30 s after you started the previous one.' },
  { term: 'Set', definition: 'A group of swims with a shared purpose, e.g. "8 × 50m".' },
  { term: 'Streamline', definition: 'The tight, arrow-like shape you hold off the wall to reduce drag.' },
  { term: 'Taper', definition: 'Reducing training load before a big competition.' },
  { term: 'Warm-up', definition: 'Easy swimming at the start of a session to prepare your body.' },
]

export interface ProgramWeek {
  week: number
  focus: string
  sessions: { title: string; what: string; distance: string }[]
}

// ─── Pool Guide ──────────────────────────────────────────────────────────────

export interface PoolRule {
  title: string
  body: string
}

export const laneEtiquette: PoolRule[] = [
  {
    title: 'Pick the right lane',
    body: "Pools divide lanes by speed: slow, medium, fast (sometimes marked by signs or colours). Be honest — pick the lane where you'll be mid-pack. If you're overtaking everyone, move up. If everyone overtakes you, move down. No shame either way.",
  },
  {
    title: 'Circle swimming',
    body: "When there are two or more people in a lane, you swim in a circle: always keep to the left side of the lane (in most countries). Go up on the left, come back on the right. Never swim down the middle.",
  },
  {
    title: 'Joining a lane',
    body: "Before jumping in, sit at the end of the lane and catch the eye of a swimmer coming to the wall. Hold up a finger to signal you're joining. Give them a moment to move over. Don't just dive in.",
  },
  {
    title: 'Resting at the wall',
    body: "Rest in the corner of the lane end, not the middle. The middle blocks incoming swimmers from doing their tumble turn. Tuck yourself into a corner and you can stay as long as you need.",
  },
  {
    title: 'Getting overtaken',
    body: "If someone taps your feet twice, they're faster and want to pass. At the next wall, pull into the corner and let them go ahead before you push off. Don't speed up to block them — it's bad form.",
  },
  {
    title: 'Overtaking someone',
    body: "Tap their feet once or twice to signal you're faster. They should pull into the corner at the next wall. If they don't, overtake carefully mid-lane only if there's clear space. Never overtake at a turn.",
  },
  {
    title: 'Push-off spacing',
    body: 'Leave at least 5 seconds between yourself and the person in front before you push off. This stops you swimming into their feet every length.',
  },
  {
    title: 'No stopping mid-lane',
    body: "If you need to stop for any reason — coughing, adjusting goggles, catching your breath — get to the wall first. Stopping in the middle of a lane is dangerous for anyone swimming behind you.",
  },
]

export interface EquipmentItem {
  name: string
  emoji: string
  essential: boolean
  what: string
  when: string
}

export const equipment: EquipmentItem[] = [
  {
    name: 'Goggles',
    emoji: '🥽',
    essential: true,
    what: 'Seal around your eyes to keep chlorine out and let you see underwater.',
    when: 'Every session. Try them on before buying — a good seal means light suction without pain. Anti-fog coating matters more than looks.',
  },
  {
    name: 'Swim cap',
    emoji: '🏊',
    essential: true,
    what: 'Keeps your hair out of your face, reduces drag slightly, and protects your hair from chlorine.',
    when: 'Every session. Silicone caps last longer than latex. Some pools require them.',
  },
  {
    name: 'Kickboard',
    emoji: '🧊',
    essential: false,
    what: "A foam float you hold in front of you. Isolates your kick so you can train it without worrying about your arms.",
    when: "Kick sets in warm-up, or when your coach wants to work on leg technique. Don't use it as a rest aid — you'll develop a lazy kick.",
  },
  {
    name: 'Pull buoy',
    emoji: '🔵',
    essential: false,
    what: 'A figure-8 float you grip between your thighs. Holds your hips up so you can focus entirely on your arm pull.',
    when: 'Pull sets. Great for building arm strength and feeling a high body position. Overusing it means your kick gets weak — balance it with kick sets.',
  },
  {
    name: 'Fins',
    emoji: '🐟',
    essential: false,
    what: "Short rubber fins (not scuba-length) that amplify your kick and help you feel a fast body position.",
    when: "Technique drills and some fitness sets. They make everything faster and less tiring — useful for learning butterfly or backstroke drills. Short fins only; long fins change your kick timing.",
  },
  {
    name: 'Paddles',
    emoji: '🏓',
    essential: false,
    what: 'Plastic plates that strap to your hands, making each pull move more water. Builds arm and shoulder strength.',
    when: 'Only once your technique is solid — bad technique with paddles means shoulder injury. Usually paired with a pull buoy. Start with smaller paddles.',
  },
  {
    name: 'Swim watch / lap counter',
    emoji: '⌚',
    essential: false,
    what: 'A waterproof watch that counts laps and tracks your pace automatically, or a simple lap counter ring you click each length.',
    when: "From day one if counting laps drives you mad. A lap counter ring costs almost nothing and solves the problem immediately.",
  },
]

// ─── Training basics ─────────────────────────────────────────────────────────

export interface EffortLevel {
  name: string
  pace: string
  breathing: string
  feel: string
  usedFor: string
}

export const effortLevels: EffortLevel[] = [
  {
    name: 'Easy',
    pace: 'CSS + 20s or slower per 100m',
    breathing: 'Comfortable — you could hold a short conversation',
    feel: 'You could keep going for a long time. Relaxed stroke, no burning.',
    usedFor: 'Warm-up, cool-down, recovery swims, building base fitness',
  },
  {
    name: 'Threshold (CSS)',
    pace: 'Your CSS pace per 100m',
    breathing: 'Controlled but working — a few words between breaths',
    feel: "Comfortably hard. You're working but not desperate. Sustainable for 20–30 min.",
    usedFor: 'Main training sets — this is the pace that builds the most fitness',
  },
  {
    name: 'Hard',
    pace: 'CSS − 5 to 10s per 100m',
    breathing: 'Laboured — single words only',
    feel: "You're working hard. Sustainable for short reps (50m–100m) with rest.",
    usedFor: 'Speed sets, short hard reps, race pace work',
  },
  {
    name: 'Sprint',
    pace: 'CSS − 15s or faster per 100m',
    breathing: 'No talking — focused entirely on going fast',
    feel: "All out. Only sustainable for 10–25m. You need full recovery between reps.",
    usedFor: 'Short sprints, starts, building raw speed',
  },
]

export interface TrainingFact {
  question: string
  answer: string
}

export const trainingFacts: TrainingFact[] = [
  {
    question: 'Why am I exhausted after 2 lengths?',
    answer: "Swimming uses muscles you've never loaded this way, requires precise timing between breathing and movement, and offers zero chance to coast. A fit runner will be gasping after 50m and feel completely confused. This is normal. It passes in 3–4 weeks as your body adapts. Don't measure your swimming fitness against your running or gym fitness — they don't transfer the way you expect.",
  },
  {
    question: 'Why should I swim slower to get faster?',
    answer: 'Going flat out every length trains your body to use technique that falls apart under fatigue. Easy swimming at correct technique builds the movement patterns that last. Most improvements in swimming come from better technique, not more effort. Your threshold pace (CSS) is where the most fitness gains happen — not your sprint pace.',
  },
  {
    question: 'Why are intervals better than just swimming straight?',
    answer: 'Swimming 20 × 50m with 15s rest gives you more total quality distance than swimming 1,000m straight, because you can hold better technique and pace on each rep. The rest lets you recover enough to maintain form. Straight swims build endurance; intervals build speed, technique, and fitness faster.',
  },
  {
    question: 'How do I count laps without losing track?',
    answer: 'Count by 25m, not by "lengths" or "laps" (the word is used differently everywhere). Use a lap counter ring — it costs a few pounds and clicks once per length. Or structure your session so you don\'t need to count: "8 × 100m" means you just need to count to 4 lengths per rep and know when you\'ve done 8 reps.',
  },
  {
    question: "How do I know I'm getting better?",
    answer: 'Times improve slowly at first. The earlier signs of progress are: needing fewer breaths per length, reaching the wall less desperate, your stroke feeling less chaotic, holding a conversation after getting out. Your CSS pace is the best single number to track — retest it every 6–8 weeks.',
  },
  {
    question: 'How long should a session be?',
    answer: '45 minutes is a solid beginner session including warm-up and cool-down. Quality beats quantity in swimming. 2,000m done with intention beats 3,000m done sloppy and exhausted. Three sessions a week with at least one rest day between is a good starting cadence.',
  },
]

// ─── Fitness program (replaces the old beginnerProgram) ──────────────────────

export interface FitnessSession {
  title: string
  totalDistance: string
  effortSummary: string
  blocks: { label: string; content: string; effort: 'easy' | 'threshold' | 'hard' }[]
  coachNote: string
}

export interface FitnessProgramWeek {
  week: number
  focus: string
  sessions: FitnessSession[]
}

export const fitnessProgram: FitnessProgramWeek[] = [
  {
    week: 1,
    focus: 'Building a repeatable session structure',
    sessions: [
      {
        title: 'Session 1 — Find your rhythm',
        totalDistance: '800–1,000m',
        effortSummary: 'All easy. No pushing.',
        blocks: [
          { label: 'Warm-up', content: '4 × 50m easy freestyle. Rest 20s between each. Focus on breathing every 3 strokes.', effort: 'easy' },
          { label: 'Main set', content: '8 × 50m with 30s rest. Swim at a pace you could hold forever. Count your strokes per length — try to keep it consistent.', effort: 'easy' },
          { label: 'Cool-down', content: '4 × 25m very easy backstroke. Just breathe and relax.', effort: 'easy' },
        ],
        coachNote: "The goal this week isn't fitness — it's learning what \"easy\" feels like. Most new swimmers go too hard. If you're gasping, slow down.",
      },
      {
        title: 'Session 2 — Add some kick work',
        totalDistance: '800–1,000m',
        effortSummary: 'Easy with some kick focus.',
        blocks: [
          { label: 'Warm-up', content: '200m easy freestyle, stopping at each 50m to rest 15s.', effort: 'easy' },
          { label: 'Main set', content: '4 × 50m kick with a kickboard (rest 30s) then 4 × 50m full stroke (rest 20s). Repeat once.', effort: 'easy' },
          { label: 'Cool-down', content: '100m easy choice of stroke.', effort: 'easy' },
        ],
        coachNote: "Kick sets feel slow and tiring. That's fine — most people's kick is weak at first. The kickboard lets you feel the movement without worrying about breathing.",
      },
    ],
  },
  {
    week: 2,
    focus: 'Introducing intervals',
    sessions: [
      {
        title: 'Session 3 — Your first interval set',
        totalDistance: '1,000–1,200m',
        effortSummary: 'Easy warm-up, working pace on main set.',
        blocks: [
          { label: 'Warm-up', content: '200m easy. 4 × 25m kick. Rest as needed.', effort: 'easy' },
          { label: 'Main set', content: '10 × 50m leaving on 1:30 (or 2:00 if needed). Aim to arrive at the wall with 20–30s to rest. If you\'re arriving with less than 10s, your pace is too fast.', effort: 'threshold' },
          { label: 'Cool-down', content: '100m easy backstroke or breaststroke.', effort: 'easy' },
        ],
        coachNote: '"Leaving on 1:30" means you push off every 1 minute 30 seconds, regardless of when you arrived. Watch the pace clock on the wall. This is the core skill of lane swimming.',
      },
      {
        title: 'Session 4 — Longer reps',
        totalDistance: '1,200m',
        effortSummary: 'Controlled effort throughout.',
        blocks: [
          { label: 'Warm-up', content: '4 × 50m easy (rest 15s). 4 × 25m kick (rest 20s).', effort: 'easy' },
          { label: 'Main set', content: "4 × 100m with 30s rest. Aim for the same time on each rep — pace yourself. Don't go out fast and die on rep 3.", effort: 'threshold' },
          { label: 'Cool-down', content: '100m very easy.', effort: 'easy' },
        ],
        coachNote: 'If your 4th rep is much slower than your 1st, you went too hard early. Negative splitting (second 50m faster than first) is the goal.',
      },
    ],
  },
  {
    week: 3,
    focus: 'Building volume and pace awareness',
    sessions: [
      {
        title: 'Session 5 — Mixed intensity',
        totalDistance: '1,400–1,600m',
        effortSummary: 'Mix of easy and working pace.',
        blocks: [
          { label: 'Warm-up', content: '300m: 100m easy free, 100m pull buoy, 100m kick.', effort: 'easy' },
          { label: 'Main set', content: '3 × (4 × 50m on 1:20, rest 1 min between rounds). Each round: first 2 reps easy, last 2 reps working hard.', effort: 'threshold' },
          { label: 'Cool-down', content: '100m easy.', effort: 'easy' },
        ],
        coachNote: 'The 1 minute rest between rounds is intentional — it lets you actually go harder on the last 2 reps of each round rather than surviving.',
      },
      {
        title: 'Session 6 — Time trial 400m',
        totalDistance: '1,200m including trial',
        effortSummary: 'Easy bookends, hard 400m in the middle.',
        blocks: [
          { label: 'Warm-up', content: '400m easy: 200m freestyle, 100m kick, 4 × 25m building pace.', effort: 'easy' },
          { label: 'Main set', content: '400m time trial — swim it as evenly and fast as you can sustain. Note your time. This is the basis for your CSS calculation.', effort: 'hard' },
          { label: 'Cool-down', content: "200m very easy. You've earned it.", effort: 'easy' },
        ],
        coachNote: 'This time feeds into your CSS test alongside a 200m trial. Log this time — it\'s your benchmark for the whole program.',
      },
    ],
  },
  {
    week: 4,
    focus: 'Your first proper training week',
    sessions: [
      {
        title: 'Session 7 — CSS pace work',
        totalDistance: '1,600m',
        effortSummary: 'Threshold pace on the main set.',
        blocks: [
          { label: 'Warm-up', content: '400m: 200m free, 4 × 50m alternating kick and pull. Rest 15s between each.', effort: 'easy' },
          { label: 'Main set', content: "8 × 100m at your CSS pace with 20s rest. Use your CSS test result to set your target time. If you don't have a CSS yet, swim at \"comfortably hard\" — a pace you could hold but not much faster.", effort: 'threshold' },
          { label: 'Cool-down', content: '4 × 25m easy. Focus on long relaxed strokes.', effort: 'easy' },
        ],
        coachNote: "This is the session structure you'll return to for months. Vary the distance (50s, 100s, 200s), the interval count, and the rest time — the shape stays the same.",
      },
      {
        title: 'Session 8 — Longer and easier',
        totalDistance: '2,000m',
        effortSummary: 'Mostly easy — just get the distance done.',
        blocks: [
          { label: 'Warm-up', content: '400m easy mix.', effort: 'easy' },
          { label: 'Main set', content: '1,000m continuous at easy pace. No stopping. If you need to slow down, slow down — but keep moving. Note your time.', effort: 'easy' },
          { label: 'Cool-down', content: '4 × 50m very easy.', effort: 'easy' },
        ],
        coachNote: "1,000m continuous is a real milestone. If you can do this by the end of week 4, you're a swimmer. From here the question is pace, not distance.",
      },
    ],
  },
]

export const beginnerProgram: ProgramWeek[] = [
  {
    week: 1,
    focus: 'Getting comfortable in the water',
    sessions: [
      { title: 'Session 1', what: 'Walk and float. Practise putting your face in the water and blowing bubbles.', distance: '~100m total' },
      { title: 'Session 2', what: 'Push off the wall and glide as far as you can on your front. Repeat 8 times.', distance: '~150m total' },
    ],
  },
  {
    week: 2,
    focus: 'Building a steady kick',
    sessions: [
      { title: 'Session 1', what: 'Hold a kickboard and kick to the end and back. Rest 30 seconds. Repeat 4 times.', distance: '~200m total' },
      { title: 'Session 2', what: 'Freestyle kick with face down, breathing every few kicks. 6 lengths with rest.', distance: '~150m total' },
    ],
  },
  {
    week: 3,
    focus: 'Putting arms and breathing together',
    sessions: [
      { title: 'Session 1', what: 'Swim to the end and back without stopping. Rest 30 seconds. Repeat 4 times.', distance: '~200m total' },
      { title: 'Session 2', what: 'Practise side breathing every 3 strokes for 6 lengths.', distance: '~150m total' },
    ],
  },
  {
    week: 4,
    focus: 'Swimming continuously',
    sessions: [
      { title: 'Session 1', what: 'Swim 100m without stopping at an easy pace.', distance: '100m continuous' },
      { title: 'Session 2', what: 'Swim 6 × 50m freestyle with 20 s rest between each. Focus on holding the same pace every rep, then log your fastest 50m time.', distance: '300m total' },
    ],
  },
]
