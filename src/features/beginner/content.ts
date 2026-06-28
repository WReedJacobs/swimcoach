// Static beginner-mode content: stroke guides, glossary, pool guide, training basics, and 8-week program.

export interface StrokeGuide {
  stroke: string
  blurb: string
  breathing: string
  whyItMatters: string
  tips: string[]
  mistakes: string[]
  coachSpeak: { phrase: string; meaning: string }[]
  drills: string[]
}

export const strokeGuides: StrokeGuide[] = [
  {
    stroke: 'Freestyle',
    blurb:
      'The fastest and most common competitive stroke. You lie on your front, rotating your body as you pull alternating arms through the water while kicking your legs in a continuous flutter.',
    breathing:
      'Rotate your head to the side — not up — so one goggle stays in the water. Inhale through your mouth in the pocket of air formed by your bow wave, then return your face immediately to the water. Most swimmers breathe every 3 strokes (bilateral), which keeps the stroke balanced. Every 2 strokes is fine if you need more air.',
    whyItMatters:
      'Freestyle is the most efficient stroke per metre — improving it gives you the biggest fitness return per session and forms the core of almost every training plan.',
    tips: [
      'Keep your body long and flat, like an arrow pointing at the far wall.',
      'Rotate your shoulders with each pull — 15 to 45 degrees each side. Rotation is power.',
      'Turn your head to breathe, not lift it. One goggle stays in the water.',
      'Kick from the hips with loose, relaxed ankles — not from the knee.',
      'Enter your hand in line with your shoulder, not across the centreline.',
      'Bend your elbow early underwater — the "catch" — and think "show your armpit".',
      'Finish the stroke with your hand near your hip before your arm exits the water.',
    ],
    mistakes: [
      'Lifting the head to breathe — your hips drop immediately and create drag.',
      'Crossing the centreline with your hand entry — causes your hips to snake side to side.',
      'Kicking from the knee — bend the knee only slightly and drive from the hip.',
      'Not rotating the body — you lose the power of your large back and shoulder muscles.',
      'Pulling with a flat wrist and straight elbow — the forearm drives the pull, not just the hand.',
      'Forgetting to finish the stroke — your hand should reach your hip before it exits.',
    ],
    coachSpeak: [
      { phrase: 'High elbow recovery', meaning: 'During the arm recovery over the water, keep the elbow up and let the hand trail. Prevents a wide, flailing arm.' },
      { phrase: 'Early vertical forearm (EVF)', meaning: 'As soon as your hand enters, bend the elbow so your forearm faces backward — your largest pull surface.' },
      { phrase: 'Catch phase', meaning: 'The moment your hand grabs the water and you feel resistance. Everything before this is just setup.' },
      { phrase: 'Bilateral breathing', meaning: 'Breathing to both sides, typically every 3 strokes. Balances muscle use and keeps your stroke symmetrical.' },
      { phrase: 'DPS', meaning: 'Distance per stroke — how far you travel per arm cycle. Fewer strokes per length means better efficiency.' },
    ],
    drills: ['Catch-Up Drill', 'Fingertip Drag', 'Fist Drill', 'Side Kick'],
  },
  {
    stroke: 'Backstroke',
    blurb:
      'The only competitive stroke swum on your back. You pull with alternating arms while flutter-kicking, staring upward at the ceiling. Navigation is the main challenge.',
    breathing:
      'Your face is never submerged, so you can breathe freely. Most swimmers develop a rhythm — breathe in as one arm enters the water, out as the other enters. The key is to keep breathing relaxed rather than holding your breath out of habit.',
    whyItMatters:
      'Backstroke is ideal for recovery sets and aerobic base building because breathing is unrestricted. It also counteracts the forward-hunched position of freestyle, making it important for posture and shoulder health.',
    tips: [
      'Keep your ears in the water and eyes looking straight up — not forward.',
      'Roll your shoulders with each stroke, same rotation principle as freestyle.',
      'Enter your hand with the little finger first, arm in line with your shoulder.',
      'Count your strokes from the flags (5m from the wall) — know your number.',
      'Keep a steady flutter kick throughout to keep your hips from sinking.',
      'Press the back of your head into the water to keep your hips up.',
      'Push all the way through the pull — finish near your hip, not your chest.',
    ],
    mistakes: [
      'Sitting up so the hips drop below the water surface.',
      'Bending at the waist during the pull.',
      'Slapping the water flat on entry instead of entering with the little finger.',
      'Letting both arms move simultaneously — one arm should always be pulling.',
      'Not knowing your stroke count from the flags — swimmers hit walls regularly.',
      'Stopping the kick during the arm pull phase.',
    ],
    coachSpeak: [
      { phrase: 'Pinky-first entry', meaning: 'Rotate your hand so the little finger enters first — avoids a splashy flat-hand entry.' },
      { phrase: 'Flag count', meaning: 'The number of arm strokes you take after passing under the 5m flags before the wall.' },
      { phrase: 'Hip rotation', meaning: 'Rolling your hips with each stroke — same principle as freestyle, just on your back.' },
      { phrase: 'Streamline off the wall', meaning: 'Push off tightly with arms squeezed by your ears before surfacing.' },
      { phrase: 'Underwaters', meaning: 'The dolphin-kick phase under the surface after the push-off — the fastest part of your race.' },
    ],
    drills: ['Single Arm Backstroke', 'Backstroke Flags Awareness', 'Pinky-First Entry Drill', 'Backstroke Sculling'],
  },
  {
    stroke: 'Breaststroke',
    blurb:
      "A rhythmic stroke swum on your front with a simultaneous arm pull and a frog kick. It's the only stroke where the legs provide most of the propulsion.",
    breathing:
      'Breathe during the pull phase — as your arms sweep out and your chest naturally rises, lift your chin forward and inhale. Drop your face back into the water as your arms stretch forward into the glide. Never breathe during the kick or the glide.',
    whyItMatters:
      'Breaststroke is the most common recreational stroke. Its glide phase makes long swims naturally restorative, and mastering the timing makes it far less tiring than it initially feels.',
    tips: [
      'Sequence every stroke: pull, breathe, kick, glide — in that order, every time.',
      'Stretch into a full streamline after every kick — the glide is free speed.',
      'Point your feet outward before the kick snap and bring them together at the end.',
      'Keep your hips high during the glide — do not let them sink.',
      'Pull your arms only as wide as your shoulders — wider slows you down.',
      'Recover your hands under your chin, palms together, thumbs pointing down.',
      'Keep the kick narrow and snappy — wider is not more powerful.',
    ],
    mistakes: [
      'Rushing the cycle and skipping the glide — you lose free speed from momentum.',
      'A flutter kick or asymmetric kick instead of a proper whip kick.',
      'Lifting the whole upper body and elbows out of the water to breathe.',
      'Pulling too wide — it creates drag and kills your timing.',
      'Starting the next pull before the kick has finished.',
      'Not pointing the feet outward before the kick snap.',
    ],
    coachSpeak: [
      { phrase: 'Whip kick', meaning: 'The frog-style kick where heels draw up toward the glutes and feet snap together.' },
      { phrase: 'Pull-breathe-kick-glide', meaning: 'The full breaststroke sequence in order. Saying it as you swim helps maintain timing.' },
      { phrase: 'Glide phase', meaning: 'The streamlined pause after the kick, where you hold a tight arrow shape and coast.' },
      { phrase: 'Undulation', meaning: 'A subtle wave-like motion through the upper body during the pull and recovery.' },
      { phrase: 'Two-hand touch', meaning: 'Required on every turn and finish — both hands must touch simultaneously at the same level.' },
    ],
    drills: ['Breaststroke Kick Only', 'Breaststroke Timing Drill', '2-Kick 1-Pull Breaststroke', 'Pull Buoy Breaststroke'],
  },
  {
    stroke: 'Butterfly',
    blurb:
      'The most physically demanding stroke. Both arms pull simultaneously while your body generates a dolphin-like undulation — two kicks per arm cycle.',
    breathing:
      'Breathe forward, not upward. Your chin should barely clear the water surface. Lift your head too high and your hips drop, killing the body wave. Most swimmers breathe every 2 strokes in training; breathing every stroke causes a head-lift that collapses the rhythm.',
    whyItMatters:
      'Butterfly builds more shoulder strength and core stability than any other stroke. Even swimming it in short sets — 25m at a time — transfers directly to power and coordination in freestyle.',
    tips: [
      'Two kicks per arm cycle: one as hands enter the water, one as they exit.',
      'Initiate the undulation from your chest, not your head or hips.',
      'Enter hands shoulder-width apart — not crossing and not too wide.',
      'Pull your hands back just inside shoulder-width during the pull.',
      'Breathe forward with chin low to the water surface — your hips will stay higher.',
      'Keep the rhythm smooth and consistent — forcing more power usually kills it.',
      'Use short fins when learning — the extra propulsion makes the timing much clearer.',
    ],
    mistakes: [
      'Kicking from the knee rather than the hip — limits power significantly.',
      'Lifting the head too high to breathe — hips drop and the wave collapses.',
      'Only doing one kick per stroke — the second kick drives the arm exit.',
      'Pulling too wide with the arms — forces the hips lower.',
      'Rushing the hand entry — hands should land before the second kick fires.',
      'Trying to breathe every stroke — every two strokes is more manageable.',
    ],
    coachSpeak: [
      { phrase: 'Two-beat kick', meaning: 'Two dolphin kicks per arm cycle — one at entry, one at exit.' },
      { phrase: 'Chest-down', meaning: 'The chest drives the undulation downward first, not the hips.' },
      { phrase: 'First kick / second kick', meaning: 'First kick drives your hands in; second kick drives your hips up as hands exit.' },
      { phrase: 'Undulation', meaning: 'The full-body wave that powers butterfly — hips up and down in opposition to the chest.' },
      { phrase: 'Hand pitch', meaning: 'The angle of your hand during entry — thumbs slightly down for a clean, bubbleless entry.' },
    ],
    drills: ['Body Dolphin', 'Kick on Back Butterfly', 'One-Arm Butterfly', 'Underwater Dolphin Kick'],
  },
]

export interface GlossaryTerm {
  term: string
  definition: string
}

export const glossary: GlossaryTerm[] = [
  { term: 'Aerobic', definition: 'Training that uses oxygen to produce energy. Aerobic swimming — sustained, controlled effort — builds the engine that lets you swim longer and recover faster between hard efforts.' },
  { term: 'Anaerobic', definition: 'High-intensity effort that outpaces your oxygen supply. Sprinting is anaerobic. You accumulate lactic acid quickly, which is why sprints are kept short.' },
  { term: 'Bilateral breathing', definition: 'Breathing to both sides, usually every 3 strokes in freestyle. It balances your stroke symmetry and prevents over-rotation to one preferred side.' },
  { term: 'Black line', definition: 'The dark line on the pool floor running down the centre of each lane. Follow it to swim straight.' },
  { term: 'Block', definition: 'The starting platform at the deep end of the pool that you dive from at the start of a race. Also called a starting block.' },
  { term: 'Broken swim', definition: 'A race-distance swim split into sections with brief rests. "200 broken at 100" means swim 100m, rest 10 seconds, swim the remaining 100m.' },
  { term: 'Catch', definition: 'The moment your hand grabs the water at the start of a pull and you feel resistance. A strong catch is the foundation of an efficient stroke.' },
  { term: 'Churning', definition: 'An inefficient kick that creates lots of splash but moves you nowhere — usually caused by kicking from the knee, crossing the feet, or stiff ankles.' },
  { term: 'Cool-down', definition: 'Easy swimming at the end of a session to bring your heart rate down and flush lactic acid.' },
  { term: 'CSS (Critical Swim Speed)', definition: 'Your aerobic threshold pace per 100m, calculated from a 400m and a 200m time trial. Used to set interval training paces — the pace at which you build the most fitness.' },
  { term: 'Descending', definition: 'A set where each rep is faster than the last. "4 × 100m descending" means rep 4 should be your fastest.' },
  { term: 'Dolphin kick', definition: 'Both legs kicking together in a wave, used in butterfly and during underwaters after a push-off.' },
  { term: 'DPS (Distance Per Stroke)', definition: 'How far you travel per complete arm cycle. Improving DPS means fewer strokes and less wasted energy across the pool.' },
  { term: 'Drag suit', definition: 'An oversized baggy swimsuit worn over your regular costume in training to increase water resistance. On race day when you remove it, you feel noticeably faster.' },
  { term: 'Drill', definition: 'A focused exercise that isolates one part of a stroke to improve it. Most drills are done slowly — the point is awareness, not speed.' },
  { term: 'Drop-off', definition: 'When your pace deteriorates significantly in the later part of a set or race, usually from going out too hard in the first half.' },
  { term: 'FINA', definition: 'The former name of swimming\'s international governing body, now known as World Aquatics (since 2022). Sets the rules for legal strokes, turns, and competition equipment.' },
  { term: 'Flags', definition: 'Coloured pennants strung across the pool 5m from each wall. On backstroke, they signal the wall is coming so you can count strokes rather than looking over your shoulder.' },
  { term: 'Flip turn', definition: 'A somersault turn at the wall used in freestyle and backstroke. Also called a tumble turn. Significantly faster than an open turn once mastered.' },
  { term: 'Flutter kick', definition: 'The alternating up-down leg kick used in freestyle and backstroke. Each leg kicks independently, driven from the hip with a loose, floppy ankle.' },
  { term: 'Glide', definition: 'A streamlined pause where you stretch and let momentum carry you — most visible in breaststroke after each kick.' },
  { term: 'Hypoxic', definition: 'Training that restricts how often you breathe — e.g. every 5 or 7 strokes instead of every 3. Builds CO2 tolerance and improves breath control under pressure.' },
  { term: 'IM (Individual Medley)', definition: 'A race or set swum in all four strokes in order: butterfly, backstroke, breaststroke, freestyle. Common distances are 100m, 200m, and 400m.' },
  { term: 'Interval', definition: 'The total time given for one swim plus its rest period. "On 1:30" means you start each rep every 1 minute 30 seconds.' },
  { term: 'Kickboard', definition: 'A foam float you hold in front of you to isolate and train your kick without worrying about your arms.' },
  { term: 'Lactate threshold', definition: 'The effort level where lactic acid accumulates faster than your body can clear it. Training at CSS sits just below this threshold — the most productive place to build fitness.' },
  { term: 'Lane rope', definition: 'The floating dividers between lanes that absorb wave turbulence and keep swimmers separated. Touching them in a race is not a disqualification, but using them to rest is.' },
  { term: 'Lap', definition: 'One length of the pool (though some clubs define it as two lengths — always check locally).' },
  { term: 'Negative split', definition: 'Swimming the second half of a race or set faster than the first half — a sign of smart pacing and controlled early effort.' },
  { term: 'On the top', definition: 'Starting each rep when the pace clock hits :00 (the top of the minute).' },
  { term: 'Open turn', definition: 'A turn where you touch the wall with your hands and spin around without somersaulting — required in breaststroke and butterfly. Slower than a tumble turn.' },
  { term: 'Pace clock', definition: 'The large clock on the pool wall with a sweeping red hand that completes one revolution every 60 seconds. You use it to time intervals and measure send-off times.' },
  { term: 'PB (Personal Best)', definition: 'Your fastest ever time for a specific event and distance. The most meaningful number in competitive swimming.' },
  { term: 'Pull buoy', definition: 'A figure-8 float held between the thighs to keep your hips up and isolate the arm stroke.' },
  { term: 'Pull phase', definition: 'The underwater portion of your arm stroke, from the catch (when your hand grabs water) to the finish (when your hand exits near your hip).' },
  { term: 'Race pace', definition: 'The speed you would need to sustain to hit your goal time in a race. Training at race pace in short reps teaches your body to hold that speed under pressure.' },
  { term: 'Recovery (stroke)', definition: 'The part of the stroke where your arm travels back over the water to the start position — not generating propulsion.' },
  { term: 'Rest interval', definition: 'The gap between repetitions — either a fixed time ("take 20 seconds rest") or calculated from your send-off time.' },
  { term: 'Send-off', definition: 'The total time for one rep plus its rest. A "1:30 send-off" means you push off every 1 min 30 s, regardless of when you arrived at the wall.' },
  { term: 'Set', definition: 'A group of swims with a shared purpose, e.g. "8 × 50m" is a set of eight 50m swims.' },
  { term: 'Streamline', definition: 'The tight, arrow-like shape you hold off the wall — arms locked overhead, head neutral, core braced — to minimise drag.' },
  { term: 'Stroke rate', definition: 'How many complete arm cycles you take per minute. Higher stroke rate often means faster swimming, but only if each stroke still covers good distance.' },
  { term: 'SWOLF', definition: 'Stroke count + time for one length, added together. A SWOLF of 50 means you swam 25m in 30 seconds taking 20 strokes. Lower is better.' },
  { term: 'T-bar', definition: 'The short perpendicular bar painted on the pool floor near each wall. It signals the wall is approaching — useful for timing your tumble turn.' },
  { term: 'Taper', definition: 'Reducing training volume and intensity in the weeks before a big competition to let your body fully recover and peak.' },
  { term: 'Touch pad', definition: 'The electronic sensor board at the end of each lane that records your finish time. Breaststroke and butterfly require a simultaneous two-hand touch; freestyle and backstroke need only one.' },
  { term: 'Tumble turn', definition: 'The forward somersault turn used in freestyle and backstroke — you flip at the wall and push off on your back or side. Significantly faster than an open turn once drilled.' },
  { term: 'Underwaters', definition: 'The streamlined dolphin-kick phase after a push-off or dive, before you surface. Elite swimmers cover 10-15m underwater; it is often the fastest part of a race.' },
  { term: 'Volume', definition: 'The total distance swum in a session, week, or training block. Increasing volume gradually builds aerobic capacity.' },
  { term: 'Warm-down', definition: 'Easy swimming at the end of a session to bring your heart rate down gradually and flush lactic acid. Same as cool-down.' },
  { term: 'Warm-up', definition: 'Easy swimming at the start of a session to prepare your body, elevate your heart rate, and rehearse technique before the main set.' },
  { term: 'Wetsuit', definition: 'A neoprene suit worn in open-water swimming for buoyancy and warmth. Legal in open-water races below a temperature threshold, banned in pool competition.' },
  { term: 'Whip kick', definition: 'The breaststroke kick — heels draw up toward the glutes, feet evert outward, then snap together in a circular motion to propel you forward.' },
  { term: 'Zone 2', definition: 'Low-intensity aerobic effort (around 60-70% of max heart rate) where you can hold a conversation. Zone 2 training builds your aerobic base and fat metabolism — the foundation of endurance swimming.' },
]

// ─── Pool Guide ───────────────────────────────────────────────────────────────

export interface PoolRule {
  title: string
  body: string
}

export const laneEtiquette: PoolRule[] = [
  {
    title: 'Pick the right lane',
    body: "Pools divide lanes by speed: slow, medium, fast (sometimes marked with signs or colour codes). Be honest — pick the lane where you'll be mid-pack. If you're overtaking everyone, move up a lane. If everyone is overtaking you, move down. No shame either way.",
  },
  {
    title: 'Circle swimming',
    body: "When there are two or more people in a lane, you swim in a circle: always keep to the left side of the lane (in most countries). Go up on the left, come back on the right. Never swim down the middle.",
  },
  {
    title: 'Joining a lane',
    body: "Before jumping in, sit at the end of the lane and catch the eye of a swimmer coming to the wall. Hold up a finger to signal you're joining. Give them a moment to move over before you push off. Never dive in without warning.",
  },
  {
    title: 'Resting at the wall',
    body: "Rest in the corner of the lane end, not the middle. The middle blocks incoming swimmers from doing their tumble turn. Tuck yourself into a corner and you can stay as long as you need.",
  },
  {
    title: 'Getting overtaken',
    body: "If someone taps your feet twice, they're faster and want to pass. At the next wall, pull into the corner and let them go first before you push off. Don't speed up to block them — it's poor form and slows the lane down for everyone.",
  },
  {
    title: 'Overtaking someone',
    body: "Tap their feet once or twice to signal you're faster. They should pull into the corner at the next wall. If they don't after two taps, overtake carefully mid-lane only if there's clear space. Never overtake at a turn.",
  },
  {
    title: 'Push-off spacing',
    body: 'Leave at least 5 seconds between yourself and the person in front before you push off. This prevents you swimming into their feet and disrupting the whole lane.',
  },
  {
    title: 'No stopping mid-lane',
    body: "If you need to stop for any reason — coughing, adjusting goggles, catching your breath — get to the wall first. Stopping in the middle of a lane is dangerous for anyone swimming behind you.",
  },
  {
    title: 'What the lane rope colours mean',
    body: "Lane ropes are often colour-coded: typically blue/green for competition lanes, yellow for warm-up lanes, and red at the 15m mark. In public sessions, colours indicate speed — check the poolside signs and ask a lifeguard if unsure.",
  },
  {
    title: 'Equipment courtesy',
    body: "Return kickboards, pull buoys, and fins to the equipment rack when you're done. Don't leave them floating in the lane or stacked at the wall. Using pool equipment is usually fine during public sessions — always check with the pool first.",
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
    name: 'Costume / Jammers',
    emoji: '🩱',
    essential: true,
    what: 'A swimsuit designed for pool training — minimal drag, chlorine-resistant material. Competitive swimmers wear costumes (women) or jammers (men) rather than casual boardshorts.',
    when: 'Every session. Invest in a decent chlorine-resistant suit — it will last far longer than a fashion one.',
  },
  {
    name: 'Kickboard',
    emoji: '🧊',
    essential: false,
    what: "A foam float you hold in front of you. Isolates your kick so you can train it without worrying about your arms.",
    when: "Kick sets in warm-up, or when working on leg technique. Don't use it as a rest aid — you'll develop a lazy kick.",
  },
  {
    name: 'Pull buoy',
    emoji: '🔵',
    essential: false,
    what: 'A figure-8 float you grip between your thighs. Holds your hips up so you can focus entirely on your arm pull.',
    when: 'Pull sets. Great for building arm strength. Overusing it means your kick gets weak — balance it with kick sets.',
  },
  {
    name: 'Fins',
    emoji: '🐟',
    essential: false,
    what: "Short rubber fins (not scuba-length) that amplify your kick and help you feel a fast body position.",
    when: "Technique drills and some fitness sets. They make everything faster and less tiring — useful for learning butterfly or backstroke drills. Short fins only.",
  },
  {
    name: 'Paddles',
    emoji: '🏓',
    essential: false,
    what: 'Plastic plates that strap to your hands, making each pull move more water.',
    when: 'Only once your technique is solid — bad technique with paddles risks shoulder injury. Usually paired with a pull buoy. Start with smaller paddles.',
  },
  {
    name: 'Swim snorkel',
    emoji: '🤿',
    essential: false,
    what: 'A centre-mount snorkel that lets you breathe without turning your head. You can focus entirely on body position and arm technique.',
    when: 'Technique-focused sessions. Ideal for working on freestyle catch drills or butterfly without the distraction of breathing mechanics.',
  },
  {
    name: 'Drag suit',
    emoji: '🩱',
    essential: false,
    what: 'An oversized baggy swimsuit worn over your regular costume during training to increase water resistance.',
    when: 'Strength sets. When you remove it on race day or after hard sets, you feel noticeably faster. A simple way to add resistance without equipment.',
  },
  {
    name: 'Pace watch',
    emoji: '⌚',
    essential: false,
    what: 'A waterproof watch that counts laps and tracks your pace automatically, or a simple lap counter ring you click each length.',
    when: 'From day one if counting laps manually frustrates you. A lap counter ring costs almost nothing and solves the problem immediately.',
  },
]

// ─── Training basics ──────────────────────────────────────────────────────────

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
    answer: "Count by 25m, not by 'lengths' or 'laps' (the word means different things in different pools). Use a lap counter ring — it costs a few pounds and clicks once per length. Or structure your session so you don't need to count: '8 × 100m' means you just count to 4 lengths per rep and know when you've done 8 reps.",
  },
  {
    question: "How do I know I'm getting better?",
    answer: 'Times improve slowly at first. The earlier signs of progress are: needing fewer breaths per length, reaching the wall less desperate, your stroke feeling less chaotic. Your CSS pace is the best single number to track — retest it every 6–8 weeks.',
  },
  {
    question: 'How long should a session be?',
    answer: '45 minutes is a solid beginner session including warm-up and cool-down. Quality beats quantity in swimming. 2,000m done with intention beats 3,000m done sloppy and exhausted. Three sessions a week with at least one rest day between is a good starting cadence.',
  },
  {
    question: 'Should I kick hard the whole time?',
    answer: "Not necessarily. In training, most swimmers use a light 2-beat kick (one kick per arm stroke) during easy laps to save energy, and a faster 6-beat kick during hard sets or races. A hard kick all the time burns out your legs quickly. Build kick strength with dedicated kick sets, then deploy it strategically.",
  },
  {
    question: "What does 'on 2:00' mean?",
    answer: "It means you start each rep every 2 minutes, regardless of when you finish. If you swim 100m in 1:45, you get 15 seconds rest. If you swim it in 1:30, you get 30 seconds rest. Watch the pace clock on the wall and push off when the hand hits the top. This is the core skill of lane swimming.",
  },
]

// ─── Fitness program — 8 weeks, 20 sessions ──────────────────────────────────

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
        coachNote: 'The 1 minute rest between rounds is intentional — it lets you actually go harder on the last 2 reps of each round rather than just surviving.',
      },
      {
        title: 'Session 6 — Time trial 400m',
        totalDistance: '1,200m including trial',
        effortSummary: 'Easy bookends, hard 400m in the middle.',
        blocks: [
          { label: 'Warm-up', content: '400m easy: 200m freestyle, 100m kick, 4 × 25m building pace.', effort: 'easy' },
          { label: 'Main set', content: '400m time trial — swim it as evenly and fast as you can sustain. Note your time. This feeds into your CSS calculation.', effort: 'hard' },
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
          { label: 'Main set', content: "8 × 100m at your CSS pace with 20s rest. Use your CSS test result to set your target time. If you don't have a CSS yet, swim at 'comfortably hard'.", effort: 'threshold' },
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
  {
    week: 5,
    focus: 'Adding intensity — first CSS intervals',
    sessions: [
      {
        title: 'Session 9 — CSS pyramid',
        totalDistance: '1,600m',
        effortSummary: 'Threshold throughout the main set.',
        blocks: [
          { label: 'Warm-up', content: '300m: 200m easy free + 4 × 25m kick (rest 15s).', effort: 'easy' },
          { label: 'Main set', content: 'Pyramid: 100m, 150m, 200m, 150m, 100m at CSS pace. Take 30s rest between each. The 200m is the hardest — hold your pace.', effort: 'threshold' },
          { label: 'Cool-down', content: '4 × 25m very easy.', effort: 'easy' },
        ],
        coachNote: 'Pyramids teach pacing — start conservatively, hold through the long middle rep, then bring it home. The goal is even splits across all five reps.',
      },
      {
        title: 'Session 10 — Speed endurance',
        totalDistance: '1,500m',
        effortSummary: 'Threshold main set + short sprints.',
        blocks: [
          { label: 'Warm-up', content: '400m easy mixed (free, back, kick as you like).', effort: 'easy' },
          { label: 'Main set', content: '5 × 100m descending (each rep 2-3s faster than the last), rest 40s. Then 6 × 25m sprint (rest 30s).', effort: 'threshold' },
          { label: 'Cool-down', content: '100m easy.', effort: 'easy' },
        ],
        coachNote: 'Descending sets are about controlled acceleration — not going flat out on rep 1. If rep 5 falls off, you started too fast.',
      },
      {
        title: 'Session 11 — Stroke mix',
        totalDistance: '1,400m',
        effortSummary: 'Easy to moderate. Focus on variety.',
        blocks: [
          { label: 'Warm-up', content: '200m easy freestyle. 4 × 25m backstroke.', effort: 'easy' },
          { label: 'Main set', content: '4 × 200m alternating: 1 length freestyle, 1 length of your second stroke, repeat. Rest 30s.', effort: 'threshold' },
          { label: 'Cool-down', content: '100m easy breaststroke.', effort: 'easy' },
        ],
        coachNote: 'This session gives you permission to swim a non-freestyle stroke badly in a structured way. That is exactly how technique in a second stroke develops.',
      },
    ],
  },
  {
    week: 6,
    focus: 'Building on CSS foundations',
    sessions: [
      {
        title: 'Session 12 — 200m repeats',
        totalDistance: '1,800m',
        effortSummary: 'Sustained threshold effort.',
        blocks: [
          { label: 'Warm-up', content: '400m: 100m each of free, back, kick, pull buoy.', effort: 'easy' },
          { label: 'Main set', content: '5 × 200m at CSS pace with 30s rest. Focus on even splits — aim for the same time on every rep.', effort: 'threshold' },
          { label: 'Cool-down', content: '200m very easy.', effort: 'easy' },
        ],
        coachNote: 'By now you should have a CSS pace from your week 3 time trial. Use it. 200m reps at CSS are the single most effective set for building aerobic fitness in the pool.',
      },
      {
        title: 'Session 13 — Broken swims',
        totalDistance: '1,600m',
        effortSummary: 'Hard efforts with brief recoveries.',
        blocks: [
          { label: 'Warm-up', content: '400m easy. 4 × 25m fast (rest 20s).', effort: 'easy' },
          { label: 'Main set', content: '4 × broken 200m (swim 100m, rest 10s, swim 100m). Target: second 100m same or faster than first.', effort: 'hard' },
          { label: 'Cool-down', content: '200m easy choice.', effort: 'easy' },
        ],
        coachNote: 'A broken swim with only 10s rest forces you to go harder than you would in a straight 200m — the brief rest lets you reset and push the second half properly.',
      },
      {
        title: 'Session 14 — Pulling power',
        totalDistance: '1,700m',
        effortSummary: 'Mostly pull sets — arm-focused session.',
        blocks: [
          { label: 'Warm-up', content: '300m: 100m free, 100m backstroke, 4 × 25m kick.', effort: 'easy' },
          { label: 'Main set', content: '8 × 100m pull buoy at threshold pace, rest 25s. Focus on a clean catch and long pull to the hip.', effort: 'threshold' },
          { label: 'Cool-down', content: '200m easy. No pull buoy.', effort: 'easy' },
        ],
        coachNote: 'Pull sets feel faster because your hips ride high. Use that to feel what a great body position does for your stroke. The goal is technique, not just distance.',
      },
    ],
  },
  {
    week: 7,
    focus: 'Threshold loading — your hardest week',
    sessions: [
      {
        title: 'Session 15 — Long CSS set',
        totalDistance: '2,200m',
        effortSummary: 'Sustained threshold work.',
        blocks: [
          { label: 'Warm-up', content: '400m easy. 4 × 50m at CSS (rest 20s).', effort: 'easy' },
          { label: 'Main set', content: '10 × 100m at CSS pace, rest 20s. This is the same as your week 4 session — compare your times.', effort: 'threshold' },
          { label: 'Cool-down', content: '4 × 50m easy. Very relaxed.', effort: 'easy' },
        ],
        coachNote: 'This is the benchmark session. If you can hold your CSS pace for 10 × 100m with only 20s rest, you are training at a genuinely high level.',
      },
      {
        title: 'Session 16 — Race pace intervals',
        totalDistance: '1,900m',
        effortSummary: 'Hard, fast, short.',
        blocks: [
          { label: 'Warm-up', content: '500m: 200m easy, 4 × 50m building, 4 × 25m at race pace.', effort: 'easy' },
          { label: 'Main set', content: '10 × 50m at race pace (5-10s faster than CSS per 100m equivalent) with 30s rest. Every rep should feel like a fast race split.', effort: 'hard' },
          { label: 'Cool-down', content: '200m easy.', effort: 'easy' },
        ],
        coachNote: 'Race pace hurts more than threshold. It is supposed to. Each 50m should feel like the last 50m of a race you actually care about.',
      },
      {
        title: 'Session 17 — Descending 100s',
        totalDistance: '2,100m',
        effortSummary: 'Progressive intensity across the set.',
        blocks: [
          { label: 'Warm-up', content: '400m easy mix.', effort: 'easy' },
          { label: 'Main set', content: '3 rounds of 4 × 100m: round 1 easy (CSS + 10s), round 2 threshold (CSS), round 3 hard (CSS − 5s). Rest 20s within rounds, 2 min between rounds.', effort: 'threshold' },
          { label: 'Cool-down', content: '100m easy.', effort: 'easy' },
        ],
        coachNote: 'The three-round structure gives you experience at three different paces in the same session — exactly what race-day pacing demands.',
      },
    ],
  },
  {
    week: 8,
    focus: 'Consolidation and peak session',
    sessions: [
      {
        title: 'Session 18 — The 1,500m time trial',
        totalDistance: '2,300m including trial',
        effortSummary: 'Build-up then maximum sustained effort.',
        blocks: [
          { label: 'Warm-up', content: '600m: 400m easy, 4 × 50m building (last 25m hard), 2 min rest.', effort: 'easy' },
          { label: 'Main set', content: '1,500m time trial. Start conservatively. Pick up pace at 500m. Go for it over the last 200m. Note every 100m split if possible.', effort: 'hard' },
          { label: 'Cool-down', content: '200m very easy breaststroke. Take your time.', effort: 'easy' },
        ],
        coachNote: "1,500m is the freestyle Olympic event and one of swimming's great distances. Your splits will tell you more about your pacing than any training session.",
      },
      {
        title: 'Session 19 — Full training week template',
        totalDistance: '2,200m',
        effortSummary: 'Balanced session — a template to repeat.',
        blocks: [
          { label: 'Warm-up', content: '400m: 200m free easy, 4 × 50m alternating kick/pull.', effort: 'easy' },
          { label: 'Main set', content: '6 × 200m on 3:30 (or on whatever send-off gives you 25-30s rest). Aim for even splits throughout.', effort: 'threshold' },
          { label: 'Cool-down', content: '4 × 50m easy choice.', effort: 'easy' },
        ],
        coachNote: 'This session is repeatable indefinitely — just adjust the send-off as you get faster. Add 200m to the total each month and you have a training plan.',
      },
      {
        title: 'Session 20 — Season closer',
        totalDistance: '2,500m',
        effortSummary: 'High volume, mostly easy. Celebrate.',
        blocks: [
          { label: 'Warm-up', content: '600m easy: 200m each stroke or as freestyle and kick alternating.', effort: 'easy' },
          { label: 'Main set', content: '1,500m continuous easy. No stopping. Same effort as week 4 session 8 — compare your feel vs. your time eight weeks ago.', effort: 'easy' },
          { label: 'Cool-down', content: '8 × 50m easy drill work — pick your favourite drills from the library.', effort: 'easy' },
        ],
        coachNote: "You swam 400-600m in week 1. You just swam 2,500m. That's the program.",
      },
    ],
  },
]

// Legacy export kept for backward-compat with any remaining references
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
      { title: 'Session 2', what: 'Swim 6 × 50m freestyle with 20s rest between each. Focus on holding the same pace every rep.', distance: '300m total' },
    ],
  },
]
