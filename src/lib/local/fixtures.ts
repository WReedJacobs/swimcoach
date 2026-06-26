// Seed data for the local mock backend. Mirrors supabase/seed.sql so the app
// behaves the same offline as it would against a real Supabase project.

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function dateOffset(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const COACH = '00000000-0000-0000-0000-000000000001'
const SW1_P = '00000000-0000-0000-0000-000000000011'
const SW2_P = '00000000-0000-0000-0000-000000000012'
const SW3_P = '00000000-0000-0000-0000-000000000013'
const SW4_P = '00000000-0000-0000-0000-000000000014'
const SW1 = '10000000-0000-0000-0000-000000000001'
const SW2 = '10000000-0000-0000-0000-000000000002'
const SW3 = '10000000-0000-0000-0000-000000000003'
const SW4 = '10000000-0000-0000-0000-000000000004'

/** Demo accounts — any password works in local mode. */
export const demoUsers = [
  { id: COACH, email: 'coach@swimcoach.app', label: 'Coach (Alex Carter)' },
  { id: SW2_P, email: 'jordan@swimcoach.app', label: 'Swimmer (Jordan Reed)' },
]

export function buildFixtures() {
  return {
    users: [
      { id: COACH, email: 'coach@swimcoach.app' },
      { id: SW1_P, email: 'mia@swimcoach.app' },
      { id: SW2_P, email: 'jordan@swimcoach.app' },
      { id: SW3_P, email: 'sam@swimcoach.app' },
      { id: SW4_P, email: 'taylor@swimcoach.app' },
    ],
    profiles: [
      { id: COACH, full_name: 'Alex Carter', role: 'coach', avatar_url: null, level: null, coach_id: null, created_at: daysAgo(60) },
      { id: SW1_P, full_name: 'Mia Lopez', role: 'swimmer', avatar_url: null, level: 'beginner', coach_id: COACH, created_at: daysAgo(50) },
      { id: SW2_P, full_name: 'Jordan Reed', role: 'swimmer', avatar_url: null, level: 'intermediate', coach_id: COACH, created_at: daysAgo(50) },
      { id: SW3_P, full_name: 'Sam Patel', role: 'swimmer', avatar_url: null, level: 'intermediate', coach_id: COACH, created_at: daysAgo(50) },
      { id: SW4_P, full_name: 'Taylor Nguyen', role: 'swimmer', avatar_url: null, level: 'elite', coach_id: COACH, created_at: daysAgo(50) },
    ],
    swimmers: [
      { id: SW1, coach_id: COACH, profile_id: SW1_P, display_name: 'Mia Lopez', invite_email: null, squad: 'Development', level: 'beginner', notes: 'New to squad, building endurance.', created_at: daysAgo(50) },
      { id: SW2, coach_id: COACH, profile_id: SW2_P, display_name: 'Jordan Reed', invite_email: null, squad: 'Senior', level: 'intermediate', notes: 'Strong freestyle, working on turns.', created_at: daysAgo(50) },
      { id: SW3, coach_id: COACH, profile_id: SW3_P, display_name: 'Sam Patel', invite_email: null, squad: 'Senior', level: 'intermediate', notes: 'Breaststroke specialist.', created_at: daysAgo(50) },
      { id: SW4, coach_id: COACH, profile_id: SW4_P, display_name: 'Taylor Nguyen', invite_email: null, squad: 'Performance', level: 'elite', notes: 'Regional qualifier, IM focus.', created_at: daysAgo(50) },
    ],
    sessions: [
      { id: '20000000-0000-0000-0000-000000000001', coach_id: COACH, title: 'Endurance Base', date: dateOffset(-3), type: 'training', warm_up: '400m easy free, 200m kick', main_set: '8 x 100m free on 1:40', cool_down: '200m easy backstroke', notes: 'Aerobic focus.', created_at: daysAgo(3) },
      { id: '20000000-0000-0000-0000-000000000002', coach_id: COACH, title: 'Threshold Friday', date: dateOffset(0), type: 'training', warm_up: '300m mixed, 4 x 50m drill', main_set: '10 x 100m free on 1:30, build each 4th', cool_down: '200m easy', notes: 'Hold pace on the back half.', created_at: daysAgo(1) },
      { id: '20000000-0000-0000-0000-000000000003', coach_id: COACH, title: 'Time Trials', date: dateOffset(4), type: 'race', warm_up: '600m progressive warm-up', main_set: '100m free for time, full rest, 200m IM for time', cool_down: '300m loosen down', notes: 'Race pace.', created_at: daysAgo(1) },
    ],
    session_assignments: [
      { id: 'a1', session_id: '20000000-0000-0000-0000-000000000002', swimmer_id: SW1, attended: false, created_at: daysAgo(1) },
      { id: 'a2', session_id: '20000000-0000-0000-0000-000000000002', swimmer_id: SW2, attended: false, created_at: daysAgo(1) },
      { id: 'a3', session_id: '20000000-0000-0000-0000-000000000002', swimmer_id: SW3, attended: false, created_at: daysAgo(1) },
      { id: 'a4', session_id: '20000000-0000-0000-0000-000000000002', swimmer_id: SW4, attended: false, created_at: daysAgo(1) },
    ],
    times: [
      { id: 't1', swimmer_id: SW2, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 100, time_seconds: 68.4, is_pb: false, is_self_logged: false, recorded_at: daysAgo(40), notes: null },
      { id: 't2', swimmer_id: SW2, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 100, time_seconds: 66.9, is_pb: false, is_self_logged: false, recorded_at: daysAgo(25), notes: null },
      { id: 't3', swimmer_id: SW2, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 100, time_seconds: 65.2, is_pb: true, is_self_logged: false, recorded_at: daysAgo(8), notes: null },
      { id: 't4', swimmer_id: SW2, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 50, time_seconds: 31.1, is_pb: true, is_self_logged: false, recorded_at: daysAgo(8), notes: null },
      { id: 't5', swimmer_id: SW4, coach_id: COACH, session_id: null, stroke: 'IM', distance: 200, time_seconds: 138.2, is_pb: false, is_self_logged: false, recorded_at: daysAgo(30), notes: null },
      { id: 't6', swimmer_id: SW4, coach_id: COACH, session_id: null, stroke: 'IM', distance: 200, time_seconds: 135.6, is_pb: true, is_self_logged: false, recorded_at: daysAgo(10), notes: null },
      { id: 't7', swimmer_id: SW4, coach_id: COACH, session_id: null, stroke: 'butterfly', distance: 100, time_seconds: 61.3, is_pb: true, is_self_logged: false, recorded_at: daysAgo(5), notes: null },
      { id: 't8', swimmer_id: SW4, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 100, time_seconds: 56.8, is_pb: true, is_self_logged: false, recorded_at: daysAgo(5), notes: null },
      { id: 't9', swimmer_id: SW3, coach_id: COACH, session_id: null, stroke: 'breaststroke', distance: 100, time_seconds: 82.5, is_pb: false, is_self_logged: false, recorded_at: daysAgo(20), notes: null },
      { id: 't10', swimmer_id: SW3, coach_id: COACH, session_id: null, stroke: 'breaststroke', distance: 100, time_seconds: 80.9, is_pb: true, is_self_logged: false, recorded_at: daysAgo(6), notes: null },
      { id: 't11', swimmer_id: SW3, coach_id: COACH, session_id: null, stroke: 'breaststroke', distance: 50, time_seconds: 38.4, is_pb: true, is_self_logged: false, recorded_at: daysAgo(6), notes: null },
      { id: 't12', swimmer_id: SW1, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 25, time_seconds: 24.9, is_pb: true, is_self_logged: false, recorded_at: daysAgo(14), notes: null },
      { id: 't13', swimmer_id: SW1, coach_id: COACH, session_id: null, stroke: 'freestyle', distance: 50, time_seconds: 58.2, is_pb: true, is_self_logged: false, recorded_at: daysAgo(4), notes: null },
      { id: 't14', swimmer_id: SW1, coach_id: COACH, session_id: null, stroke: 'backstroke', distance: 25, time_seconds: 28.7, is_pb: true, is_self_logged: false, recorded_at: daysAgo(4), notes: null },
    ],
    goals: [
      { id: 'g1', swimmer_id: SW2, stroke: 'freestyle', distance: 100, target_time_seconds: 63.0, deadline: dateOffset(60), achieved: false, created_at: daysAgo(20) },
      { id: 'g2', swimmer_id: SW4, stroke: 'IM', distance: 200, target_time_seconds: 132.0, deadline: dateOffset(45), achieved: false, created_at: daysAgo(20) },
      { id: 'g3', swimmer_id: SW1, stroke: 'freestyle', distance: 50, target_time_seconds: 55.0, deadline: dateOffset(90), achieved: false, created_at: daysAgo(20) },
    ],
    drills: [
      { id: 'd1', coach_id: null, title: 'Catch-up drill', description_plain: 'One arm waits stretched out in front while the other arm does a full stroke and comes back to meet it. Teaches a long, patient stroke.', description_technical: 'Front-quadrant timing drill. The lead hand remains extended at full reach until the recovering hand touches it before initiating the catch. Reinforces stroke length and reduces overlap-induced drag.', stroke: 'freestyle', level: 'beginner', video_url: null, created_at: daysAgo(60) },
      { id: 'd2', coach_id: null, title: 'Fingertip drag', description_plain: 'During the recovery, drag your fingertips along the surface of the water. Keeps your elbow high.', description_technical: 'High-elbow recovery drill. Maintaining fingertip contact with the surface enforces elbow elevation above the wrist, promoting an efficient recovery path and proper hand entry alignment.', stroke: 'freestyle', level: 'intermediate', video_url: null, created_at: daysAgo(60) },
      { id: 'd3', coach_id: null, title: 'Bilateral breathing', description_plain: 'Breathe to both sides — every third arm stroke. Helps you swim straight and balanced.', description_technical: 'Alternate-side breathing pattern (breath every 3 strokes) to develop symmetrical body roll and reduce unilateral muscular dominance and tracking deviation.', stroke: 'freestyle', level: 'intermediate', video_url: null, created_at: daysAgo(60) },
      { id: 'd4', coach_id: null, title: 'Kick sets', description_plain: 'Hold a kickboard out in front and kick from the hips to the end of the pool and back.', description_technical: 'Isolated propulsion development using a board to fix the upper body, emphasising hip-driven flutter kick with minimal knee flexion and pointed ankles for plantar-flexion propulsion.', stroke: null, level: 'beginner', video_url: null, created_at: daysAgo(60) },
      { id: 'd5', coach_id: null, title: 'Pull buoy set', description_plain: 'Put a float between your thighs so your legs rest, and focus only on your arm pulls.', description_technical: 'Lower-body flotation aid isolates the propulsive arm stroke, allowing focus on catch mechanics and pull-through power while removing kick-derived propulsion and body-position confounds.', stroke: null, level: 'intermediate', video_url: null, created_at: daysAgo(60) },
    ],
    feedback: [
      { id: 'f1', coach_id: COACH, swimmer_id: SW2, session_id: null, content: 'Great control on the back half of the 100s today. Keep the stroke long.', is_pinned: true, created_at: daysAgo(7) },
      { id: 'f2', coach_id: COACH, swimmer_id: SW4, session_id: null, content: 'IM split times are trending the right way — focus on the breaststroke-to-free transition.', is_pinned: false, created_at: daysAgo(9) },
    ],
    messages: [] as Record<string, unknown>[],
    bookings: [
      { id: 'b1', coach_id: COACH, swimmer_id: SW1, session_id: null, requested_at: daysAgo(2), status: 'pending', notes: 'Can we do a technique session this week?' },
    ],
    milestones: [] as Record<string, unknown>[],
  }
}

export type LocalDb = ReturnType<typeof buildFixtures>
