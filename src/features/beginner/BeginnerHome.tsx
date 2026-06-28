import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Timer, Flag, GraduationCap, Search, MapPin, Gauge } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressBar'
import { useBeginnerLogs, useBeginnerGoal } from './beginnerStore'
import type { LucideIcon } from 'lucide-react'

interface QuickLink {
  to: string
  label: string
  sublabel: string
  icon: LucideIcon
}

const quickLinks: QuickLink[] = [
  { to: '/beginner/pool-guide', label: 'Pool survival guide', sublabel: 'Lane etiquette + what to bring', icon: MapPin },
  { to: '/beginner/training', label: 'Training basics', sublabel: 'How hard to swim, why intervals work', icon: Gauge },
  { to: '/beginner/program', label: '4-week program', sublabel: 'Structured sessions to get started', icon: GraduationCap },
  { to: '/beginner/strokes', label: 'Stroke guides', sublabel: 'Tips, mistakes and coach-speak', icon: BookOpen },
  { to: '/beginner/log', label: 'Log a swim', sublabel: 'Track your sessions', icon: Timer },
  { to: '/beginner/milestones', label: 'Milestones', sublabel: 'Mark your personal landmarks', icon: Flag },
  { to: '/beginner/glossary', label: 'Glossary', sublabel: 'What all the terms mean', icon: Search },
]

export function BeginnerHome() {
  const [logs] = useBeginnerLogs()
  const [weeklyGoalM] = useBeginnerGoal()

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
        <h2 className="text-xl font-semibold text-text-primary">Welcome to SwimCoach</h2>
        <p className="mt-1 text-sm text-text-secondary">
          You don't need a coach to start. Read the guides, log your swims, and tick off milestones at your own pace.
        </p>
      </Card>

      <div>
      <SectionHeader kicker="Progress" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1">
          <CardHeader title="This week" />
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-text-secondary">Log your first swim to start tracking progress</p>
              <Link to="/beginner/log">
                <Button accent="coral" size="sm">Log a swim</Button>
              </Link>
            </div>
          ) : (
            <ProgressRing
              value={distanceThisWeek}
              max={weeklyGoalM}
              label={`${distanceThisWeek}m`}
              sublabel={`of ${weeklyGoalM}m goal`}
            />
          )}
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-component bg-coral/10 text-coral">
                    <q.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{q.label}</p>
                    <p className="text-xs text-text-muted">{q.sublabel}</p>
                  </div>
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
