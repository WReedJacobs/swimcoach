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
  ClipboardList,
  BookOpen,
  Library,
  GraduationCap,
  Search,
  Flag,
  Gauge,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const coachNav: NavItem[] = [
  { label: 'Dashboard', to: '/coach', icon: LayoutDashboard },
  { label: 'Roster', to: '/coach/roster', icon: Users },
  { label: 'Log Times', to: '/coach/log', icon: Timer },
  { label: 'Sessions', to: '/coach/sessions', icon: CalendarDays },
  { label: 'Progress', to: '/coach/progress', icon: LineChart },
  { label: 'Feedback', to: '/coach/feedback', icon: ClipboardList },
  { label: 'Messages', to: '/coach/messages', icon: MessageSquare },
  { label: 'Schedule', to: '/coach/bookings', icon: CalendarCheck },
  { label: 'Drills', to: '/coach/drills', icon: Library },
]

const swimmerNav: NavItem[] = [
  { label: 'Dashboard', to: '/swimmer', icon: LayoutDashboard },
  { label: "Today's Session", to: '/swimmer/today', icon: CalendarDays },
  { label: 'My Times', to: '/swimmer/times', icon: Timer },
  { label: 'Goals', to: '/swimmer/goals', icon: Target },
  { label: 'CSS & Pace', to: '/swimmer/css', icon: Gauge },
  { label: 'Feedback', to: '/swimmer/feedback', icon: ClipboardList },
  { label: 'Achievements', to: '/swimmer/achievements', icon: Trophy },
  { label: 'Drills', to: '/swimmer/drills', icon: Library },
]

const beginnerNav: NavItem[] = [
  { label: 'Home', to: '/beginner', icon: Waves },
  { label: 'Stroke Guides', to: '/beginner/strokes', icon: BookOpen },
  { label: 'Glossary', to: '/beginner/glossary', icon: Search },
  { label: 'Milestones', to: '/beginner/milestones', icon: Flag },
  { label: 'Log a Swim', to: '/beginner/log', icon: Timer },
  { label: '4-Week Program', to: '/beginner/program', icon: GraduationCap },
  { label: 'Find a Coach', to: '/beginner/find-coach', icon: Users },
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
