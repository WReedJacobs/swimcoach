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
  { term: 'Catch', definition: 'The moment your hand grabs the water at the start of a pull.' },
  { term: 'Cool-down', definition: 'Easy swimming at the end of a session to recover.' },
  { term: 'Dolphin kick', definition: 'Both legs kicking together in a wave, used in butterfly.' },
  { term: 'Drill', definition: 'A focused exercise that isolates one part of a stroke to improve it.' },
  { term: 'Flip turn', definition: 'A somersault turn at the wall used in freestyle and backstroke.' },
  { term: 'Glide', definition: 'A streamlined pause where you stretch and let momentum carry you.' },
  { term: 'IM', definition: 'Individual Medley — all four strokes swum in one race.' },
  { term: 'Interval', definition: 'The total time given for a swim plus rest, e.g. "on 1:30".' },
  { term: 'Kickboard', definition: 'A float you hold to isolate and train your kick.' },
  { term: 'Lap', definition: 'One length of the pool (sometimes two, depending on the club).' },
  { term: 'PB', definition: 'Personal Best — your fastest ever time for an event.' },
  { term: 'Pull buoy', definition: 'A float held between the thighs to isolate the arm stroke.' },
  { term: 'Recovery', definition: 'The part of the stroke where your arm travels back over the water.' },
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
      { title: 'Session 2', what: 'Swim as far as you can comfortably, then log your distance. Celebrate!', distance: 'Your choice' },
    ],
  },
]
