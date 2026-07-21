// Shared domain types for Swimphoria.
// Kept framework-agnostic so they port cleanly to React Native.

export type Role = 'coach' | 'swimmer' | 'beginner'
export type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type Stroke =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'IM'
export type SessionType = 'training' | 'race' | 'dryland'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type Course = 'SCM' | 'LCM' | 'SCY'
export type DrillEnvironment = 'pool' | 'open_water'

export const STROKES: Stroke[] = [
  'freestyle',
  'backstroke',
  'breaststroke',
  'butterfly',
  'IM',
]

export const DISTANCES = [25, 50, 100, 200, 400, 800, 1500] as const

export const COURSES: Course[] = ['SCM', 'LCM', 'SCY']

export const COURSE_LABELS: Record<Course, string> = {
  SCM: 'Short-course (m)',
  LCM: 'Long-course (m)',
  SCY: 'Short-course (yd)',
}

export interface Profile {
  id: string
  full_name: string
  email?: string | null
  role: Role
  is_public?: boolean
  avatar_url: string | null
  level: Level | null
  coach_id: string | null
  join_code: string | null
  is_admin: boolean
  created_at: string
  display_handle: string | null
  club_name: string | null
}

export interface Swimmer {
  id: string
  coach_id: string
  profile_id: string | null
  display_name: string
  invite_email: string | null
  invited_at: string | null
  squad: string | null
  level: Level
  notes: string | null
  created_at: string
  // Training availability — how the goal-race plan generator schedules sessions.
  days_per_week: number | null
  session_minutes: number | null
  preferred_days: string[] | null
  // Joined / denormalised for UI convenience
  profile?: Profile | null
}

/** Best display name for a swimmer: linked profile wins, else stored name. */
export function swimmerName(s: Swimmer): string {
  return s.profile?.full_name || s.display_name || 'Swimmer'
}

export type Recurrence = 'none' | 'weekly' | 'mwf' | 'daily'

export interface Session {
  id: string
  coach_id: string
  title: string
  date: string
  type: SessionType
  warm_up: string | null
  main_set: string | null
  cool_down: string | null
  notes: string | null
  recurrence: Recurrence
  recurrence_end: string | null
  created_at: string
  // Goal-race training plan linkage — null for ordinary, manually-authored sessions.
  goal_race_id: string | null
  plan_week_number: number | null
  plan_phase: PlanPhase | null
  plan_status: PlanStatus
}

export interface SessionAssignment {
  id: string
  session_id: string
  swimmer_id: string
  attended: boolean
  created_at: string
}

export interface SwimTime {
  id: string
  swimmer_id: string
  coach_id: string | null
  session_id: string | null
  drill_id: string | null
  stroke: Stroke
  distance: number
  course: Course
  time_seconds: number
  is_pb: boolean
  is_self_logged: boolean
  recorded_at: string
  notes: string | null
  /** Rate of perceived exertion, 1-10. Optional — training-load proxy. */
  rpe: number | null
}

export interface Split {
  id: string
  time_id: string
  lap_number: number
  split_seconds: number
  created_at: string
}

export interface Drill {
  id: string
  coach_id: string | null // null = global / built-in
  title: string
  description_plain: string
  description_technical: string
  stroke: Stroke | null
  level: Level | null
  focus: string | null
  video_url: string | null
  created_at: string
  environment: DrillEnvironment
}

export interface Feedback {
  id: string
  coach_id: string
  swimmer_id: string
  session_id: string | null
  content: string
  is_pinned: boolean
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read: boolean
  created_at: string
}

export interface Booking {
  id: string
  coach_id: string
  swimmer_id: string
  session_id: string | null
  requested_at: string
  status: BookingStatus
  notes: string | null
  preferred_date: string | null
}

export interface Goal {
  id: string
  swimmer_id: string
  stroke: Stroke
  distance: number
  target_time_seconds: number
  deadline: string | null
  achieved: boolean
  created_at: string
}

// ─── Goal-race training plan generator ─────────────────────────────────────
// Not to be confused with `Goal` above (a simple target-time-by-event) or
// the unrelated `swimmer_plans` table (self-authored solo JSONB workouts,
// migration 010) — a GoalRace is a specific dated race with a full
// LLM-generated, phase-periodized training plan.

export type GoalEventType = 'pool_sprint' | 'pool_middle' | 'pool_distance' | 'open_water' | 'triathlon_leg'
export type GoalPriority = 'A' | 'B' | 'C'
export type GoalRaceStatus = 'draft' | 'active' | 'completed' | 'archived'
export type PlanPhase = 'prep' | 'base' | 'build' | 'peak' | 'taper'
export type PlanStatus = 'draft' | 'confirmed'
export type PlanBlock = 'warm_up' | 'main_set' | 'cool_down'

export const GOAL_EVENT_TYPES: GoalEventType[] = [
  'pool_sprint',
  'pool_middle',
  'pool_distance',
  'open_water',
  'triathlon_leg',
]
export const GOAL_PRIORITIES: GoalPriority[] = ['A', 'B', 'C']
export const PLAN_PHASES: PlanPhase[] = ['prep', 'base', 'build', 'peak', 'taper']

export const GOAL_EVENT_TYPE_LABELS: Record<GoalEventType, string> = {
  pool_sprint: 'Pool sprint (50/100)',
  pool_middle: 'Pool middle distance (200/400)',
  pool_distance: 'Pool distance (800+)',
  open_water: 'Open water',
  triathlon_leg: 'Triathlon swim leg',
}

export const PLAN_PHASE_LABELS: Record<PlanPhase, string> = {
  prep: 'Prep',
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
}

export interface GoalRace {
  id: string
  swimmer_id: string
  coach_id: string | null
  name: string
  race_date: string
  event_type: GoalEventType
  distance_meters: number
  priority: GoalPriority
  target_time_seconds: number | null
  status: GoalRaceStatus
  created_at: string
}

/**
 * Structured per-set plan data (Milestone 2's LLM output lands here) — kept
 * separate from the human-readable text in Session.warm_up/main_set/
 * cool_down, which is what SessionBuilder actually edits. This is what
 * Milestone 4's pace-comparison logic reads target values from.
 */
export interface PlanSetTarget {
  id: string
  session_id: string
  block: PlanBlock
  set_order: number
  set_type: string | null
  reps: number
  distance_meters: number
  stroke: Stroke | null
  target_pace_seconds: number | null
  css_offset_seconds: number | null
  rest_seconds: number | null
  intensity_zone: string | null
  created_at: string
}

/**
 * Milestone 4 — the swimmer-logged "actual" counterpart to a
 * PlanSetTarget's prescribed pace. One row per plan_set_target (unique),
 * upsertable so a swimmer can correct a logged value.
 */
export interface PlanSetResult {
  id: string
  plan_set_target_id: string
  swimmer_id: string
  actual_pace_seconds: number
  recorded_at: string
}

export interface Milestone {
  id: string
  profile_id: string
  label: string
  distance: number
  achieved: boolean
  achieved_at: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

// ---------- Nutrition ----------
// Deliberately no weight/BMI/calorie fields anywhere in this domain — inputs
// are training- and preference-only. See lib/nutritionGuidance.ts.
export type TrainingVolume = 'recreational' | 'club' | 'high_performance'
export type TypicalSessionTime = 'morning' | 'afternoon_evening' | 'varies'
export type AgeBracket = 'under_18' | '18_plus'
export type DietBase = 'omnivore' | 'vegetarian' | 'vegan'
export type DietModifier = 'dairy_free'
export type DietPattern = DietBase | DietModifier

export const TRAINING_VOLUME_LABELS: Record<TrainingVolume, string> = {
  recreational: 'Recreational (<3 swims/wk)',
  club: 'Club / age-group (4–8 swims/wk)',
  high_performance: 'High-performance (9+, or 2x/day)',
}
export const TYPICAL_SESSION_TIME_LABELS: Record<TypicalSessionTime, string> = {
  morning: 'Early morning',
  afternoon_evening: 'Afternoon / evening',
  varies: 'Varies',
}
export const AGE_BRACKET_LABELS: Record<AgeBracket, string> = {
  under_18: 'Under 18',
  '18_plus': '18+',
}

export interface NutritionProfile {
  profile_id: string
  training_volume: TrainingVolume
  typical_session_time: TypicalSessionTime
  diet_pattern: DietPattern[]
  allergies: string | null
  age_bracket: AgeBracket
  updated_at: string
}

export interface HydrationLog {
  id: string
  profile_id: string
  logged_at: string
  amount_ml: number
}

// ---------- Billing & entitlements ----------
export type Plan = 'free' | 'ai_coach' | 'coach_pro' | 'coach_club'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface Subscription {
  id: string
  profile_id: string
  plan: Plan
  status: SubscriptionStatus
  current_period_end: string | null
  paystack_subscription_code: string | null
  paystack_customer_code: string | null
  paystack_email_token: string | null
  created_at: string
  updated_at: string
}
