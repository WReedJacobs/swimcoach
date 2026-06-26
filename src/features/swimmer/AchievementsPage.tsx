import { useMemo } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useTimes } from '@/hooks/useTimes'
import { fastestByEvent } from '@/lib/pbDetector'
import { formatTime } from '@/lib/formatTime'
import type { SwimTime } from '@/types'

interface Achievement {
  icon: typeof Trophy
  title: string
  detail: string
  detailMono?: boolean
}

function deriveAchievements(times: SwimTime[]): Achievement[] {
  const out: Achievement[] = []

  // Personal bests per event.
  for (const [key, t] of fastestByEvent(times)) {
    const [stroke, distance] = key.split('-')
    out.push({
      icon: Trophy,
      title: `${distance}m ${stroke} PB`,
      detail: formatTime(t.time_seconds),
      detailMono: true,
    })
  }

  // Distance milestones — first time recorded at each distance.
  const distances = new Set(times.map((t) => t.distance))
  for (const d of [25, 50, 100, 500, 1000].filter((d) => distances.has(d))) {
    out.push({ icon: Medal, title: `First ${d}m logged`, detail: 'Distance milestone' })
  }

  // Sub-2-minute 100m freestyle.
  const fly100 = times.find((t) => t.distance === 100 && t.stroke === 'freestyle' && t.time_seconds < 120)
  if (fly100) {
    out.push({ icon: Award, title: '100m free under 2:00', detail: formatTime(fly100.time_seconds), detailMono: true })
  }

  return out
}

export function AchievementsPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: times } = useTimes(swimmer?.id)
  const achievements = useMemo(() => deriveAchievements(times ?? []), [times])

  return (
    <div className="space-y-8">
      <div>
      <SectionHeader kicker="Achievements" />
      <Card>
        <CardHeader title="Achievements" subtitle="Badges earned from your logged times" />
      {achievements.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="No achievements yet" description="Log times to start earning PB and milestone badges." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-card border border-border bg-bg p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <a.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium capitalize text-text-primary">{a.title}</p>
                <p className={cn('text-xs text-text-secondary', a.detailMono && 'font-mono tabular-nums')}>{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      </Card>
      </div>
    </div>
  )
}
