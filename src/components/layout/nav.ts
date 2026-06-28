import {
  LayoutDashboard,
  Users,
  Timer,
  CalendarDays,
  LineChart,
  MessageSquare,
  CalendarCheck,
  Waves,
  Target,
  Trophy,
  Medal,
  IdCard,
  ClipboardList,
  Library,
  GraduationCap,
  Flag,
  Gauge,
  MapPin,
  NotebookPen,
  Settings,
  Map,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

// re-export so AppShell/MobileNav can import from one place
export type { LucideIcon }
import type { Role } from '@/types'

export interface NavItem {
  label: string
  mobileLabel?: string
  to: string
  icon: LucideIcon
}

const coachNav: NavItem[] = [
  { label: 'Dashboard', to: '/coach', icon: LayoutDashboard },
  { label: 'Roster', to: '/coach/roster', icon: Users },
  { label: 'Log Times', mobileLabel: 'Log', to: '/coach/log', icon: Timer },
  { label: 'Sessions', to: '/coach/sessions', icon: CalendarDays },
  { label: 'Progress', to: '/coach/progress', icon: LineChart },
  { label: 'Feedback', to: '/coach/feedback', icon: ClipboardList },
  { label: 'Messages', to: '/coach/messages', icon: MessageSquare },
  { label: 'Schedule', to: '/coach/bookings', icon: CalendarCheck },
  { label: 'Drills', to: '/coach/drills', icon: Library },
  { label: 'Leaderboard', to: '/leaderboard', icon: Medal },
  { label: 'My Profile', mobileLabel: 'Profile', to: '/coach/profile', icon: IdCard },
]

const swimmerNav: NavItem[] = [
  { label: 'Dashboard', to: '/swimmer', icon: LayoutDashboard },
  { label: "Today's Session", mobileLabel: 'Today', to: '/swimmer/today', icon: CalendarDays },
  { label: 'My Times', to: '/swimmer/times', icon: Timer },
  { label: 'Goals', to: '/swimmer/goals', icon: Target },
  { label: 'CSS & Pace', mobileLabel: 'CSS', to: '/swimmer/css', icon: Gauge },
  { label: 'Schedule', to: '/swimmer/schedule', icon: CalendarCheck },
  { label: 'Feedback', to: '/swimmer/feedback', icon: ClipboardList },
  { label: 'Messages', to: '/swimmer/messages', icon: MessageSquare },
  { label: 'Achievements', mobileLabel: 'Awards', to: '/swimmer/achievements', icon: Trophy },
  { label: 'Drills', to: '/swimmer/drills', icon: Library },
  { label: 'My Planner', mobileLabel: 'Planner', to: '/swimmer/planner', icon: NotebookPen },
  { label: 'Leaderboard', to: '/leaderboard', icon: Medal },
  { label: 'My Profile', mobileLabel: 'Profile', to: '/swimmer/profile', icon: IdCard },
]

const beginnerNav: NavItem[] = [
  { label: 'My Journey', mobileLabel: 'Journey', to: '/beginner/journey', icon: Map },
  { label: 'Log a Swim', mobileLabel: 'Log', to: '/beginner/log', icon: Timer },
  { label: 'My Progress', mobileLabel: 'Progress', to: '/beginner', icon: Waves },
  { label: 'Milestones', to: '/beginner/milestones', icon: Flag },
  { label: 'Pool Guide', mobileLabel: 'Pool', to: '/beginner/pool-guide', icon: MapPin },
  { label: 'Training Basics', mobileLabel: 'Training', to: '/beginner/training', icon: Gauge },
  { label: 'Fitness Program', mobileLabel: 'Program', to: '/beginner/program', icon: GraduationCap },
  { label: 'Drill Library', mobileLabel: 'Drills', to: '/beginner/drills', icon: Library },
  { label: 'Going Solo', mobileLabel: 'Solo', to: '/beginner/self-guided', icon: UserCheck },
  { label: 'Find a Coach', mobileLabel: 'Coach', to: '/beginner/find-coach', icon: Users },
  { label: 'Settings', to: '/beginner/settings', icon: Settings },
]

export function navForRole(role: Role | null): NavItem[] {
  switch (role) {
    case 'coach':
      return coachNav
    case 'swimmer':
      return swimmerNav
    case 'beginner':
      return beginnerNav
    default:
      return beginnerNav
  }
}
