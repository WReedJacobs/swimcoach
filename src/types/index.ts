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
  squad: string | null
  level: Level
  notes: string | null
  created_at: string
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
