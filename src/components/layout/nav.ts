import {
  LayoutDashboard,
  Users,
  Timer,
  CalendarDays,
  LineChart,
  MessageSquare,
  CalendarCheck,
  Target,
  Trophy,
  ClipboardList,
  Settings,
  BookOpen,
  Award,
  Compass,
  Flag,
  Apple,
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

// Core daily-use screens per role. Kept short, but every top-level feature
// must have an entry here — burying something behind a dashboard-only
// drill-down (as Goal Race was until it turned out to be genuinely hard to
// find) isn't an acceptable substitute for a nav item.
const coachNav: NavItem[] = [
  { label: 'Dashboard', to: '/coach', icon: LayoutDashboard },
  { label: 'Roster', to: '/coach/roster', icon: Users },
  { label: 'Log Times', mobileLabel: 'Log', to: '/coach/log', icon: Timer },
  { label: 'Sessions', to: '/coach/sessions', icon: CalendarDays },
  { label: 'Progress', to: '/coach/progress', icon: LineChart },
  { label: 'Feedback', to: '/coach/feedback', icon: ClipboardList },
  { label: 'Messages', to: '/coach/messages', icon: MessageSquare },
  { label: 'Schedule', to: '/coach/bookings', icon: CalendarCheck },
]

const swimmerNav: NavItem[] = [
  { label: 'Dashboard', to: '/swimmer', icon: LayoutDashboard },
  { label: "Today's Session", mobileLabel: 'Today', to: '/swimmer/today', icon: CalendarDays },
  { label: 'My Times', to: '/swimmer/times', icon: Timer },
  { label: 'Nutrition', to: '/swimmer/nutrition', icon: Apple },
  { label: 'Event Goals', mobileLabel: 'Goals', to: '/swimmer/goals', icon: Target },
  { label: 'Goal Race', to: '/swimmer/goal-race', icon: Flag },
  { label: 'Schedule', to: '/swimmer/schedule', icon: CalendarCheck },
  { label: 'Feedback', to: '/swimmer/feedback', icon: ClipboardList },
  { label: 'Messages', to: '/swimmer/messages', icon: MessageSquare },
  { label: 'Achievements', mobileLabel: 'Awards', to: '/swimmer/achievements', icon: Trophy },
]

const beginnerNav: NavItem[] = [
  { label: 'My Journey', mobileLabel: 'Journey', to: '/beginner', icon: LayoutDashboard },
  { label: 'Log a Swim', mobileLabel: 'Log', to: '/beginner/log', icon: Timer },
  { label: 'Milestones', to: '/beginner/milestones', icon: Award },
  { label: 'Learn', to: '/beginner/learn', icon: BookOpen },
  { label: 'Program', to: '/beginner/program', icon: CalendarDays },
  { label: 'Nutrition', to: '/beginner/nutrition', icon: Apple },
  { label: 'Going Solo', mobileLabel: 'Solo', to: '/beginner/self-guided', icon: Compass },
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
