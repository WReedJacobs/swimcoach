import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Timer, Flag, GraduationCap, Search } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressRing } from '@/components/ui/ProgressBar'
import { useBeginnerLogs } from './beginnerStore'

const WEEKLY_GOAL_M = 1000

const quickLinks = [
  { to: '/beginner/strokes', label: 'Stroke guides', icon: BookOpen },
  { to: '/beginner/glossary', label: 'Glossary', icon: Search },
  { to: '/beginner/milestones', label: 'Milestones', icon: Flag },
  { to: '/beginner/log', label: 'Log a swim', icon: Timer },
  { to: '/beginner/program', label: '4-week program', icon: GraduationCap },
]

export function BeginnerHome() {
  const [logs] = useBeginnerLogs()

  const distanceThisWeek = useMemo(() => {
    const weekStart = new Date()
    const day = (weekStart.getDay() + 6) % 7
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - day)
    return logs
      .filter((l) => new Date(l.date) >= weekStart)
      .reduce((sum, l) => sum + l.distance, 0)
  }, [logs])

  return (
    <div className="space-y-8">
      <Card className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">Welcome to SwimCoach 🏊</h2>
        <p className="mt-1 text-sm text-text-secondary">
          You don't need a coach to start. Read the guides, log your swims, and tick off milestones at your own pace.
        </p>
      </Card>

      <div>
      <SectionHeader kicker="Progress" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1">
          <CardHeader title="This week" />
          <ProgressRing
            value={distanceThisWeek}
            max={WEEKLY_GOAL_M}
            label={`${distanceThisWeek}m`}
            sublabel={`of ${WEEKLY_GOAL_M}m goal`}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Where to next?" />
          <ul className="-mx-2">
            {quickLinks.map((q) => (
              <li key={q.to}>
                <Link
                  to={q.to}
                  className="flex items-center gap-3 rounded-component px-2 py-2.5 transition-all hover:bg-coral/[0.07] hover:shadow-[inset_2px_0_0_rgb(var(--c-coral))]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-component bg-coral/10 text-coral">
                    <q.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-text-primary">{q.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      </div>
    </div>
  )
}
