import { useMemo } from 'react'
import { Trophy, Medal, Award, Flame, Zap, Star, Pencil, type LucideIcon } from 'lucide-react'
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
  icon: LucideIcon
  title: string
  detail: string
  detailMono?: boolean
  tone?: 'gold' | 'blue' | 'green'
}

function deriveAchievements(times: SwimTime[]): Achievement[] {
  const out: Achievement[] = []
  const bests = fastestByEvent(times)

  // Personal bests per event
  for (const [key, t] of bests) {
    const [stroke, distance] = key.split('-')
    out.push({
      icon: Trophy,
      title: `${distance}m ${stroke} PB`,
      detail: formatTime(t.time_seconds),
      detailMono: true,
      tone: 'gold',
    })
  }

  // Volume milestones
  const volumes: Array<[number, string]> = [
    [5, 'First 5 times'],
    [10, '10 times logged'],
    [25, '25 times logged'],
    [50, '50 times logged'],
    [100, 'Century club'],
  ]
  for (const [n, title] of volumes) {
    if (times.length >= n) {
      out.push({ icon: Flame, title, detail: `${times.length} total`, tone: 'blue' })
    }
  }

  // Distance milestones
  const distances = new Set(times.map((t) => t.distance))
  for (const d of [25, 50, 100, 200, 400, 800, 1500].filter((d) => distances.has(d))) {
    out.push({ icon: Medal, title: `First ${d}m logged`, detail: 'Distance milestone', tone: 'blue' })
  }

  // Speed records
  const speedChecks: Array<{ label: string; distance: number; stroke: string; threshold: number }> = [
    { label: 'Sub-30s 25m', distance: 25, stroke: 'freestyle', threshold: 30 },
    { label: 'Sub-1min 50m free', distance: 50, stroke: 'freestyle', threshold: 60 },
    { label: '100m free under 2:00', distance: 100, stroke: 'freestyle', threshold: 120 },
    { label: 'Sub-5min 400m', distance: 400, stroke: 'freestyle', threshold: 300 },
  ]
  for (const c of speedChecks) {
    const hit = times.find(
      (t) => t.distance === c.distance && t.stroke === c.stroke && t.time_seconds < c.threshold,
    )
    if (hit) {
      out.push({
        icon: Zap,
        title: c.label,
        detail: formatTime(hit.time_seconds),
        detailMono: true,
        tone: 'gold',
      })
    }
  }

  // Stroke variety
  const uniqueStrokes = new Set(times.map((t) => t.stroke))
  if (uniqueStrokes.size >= 3) {
    out.push({
      icon: Star,
      title: 'Versatile swimmer',
      detail: `${uniqueStrokes.size} strokes logged`,
      tone: 'green',
    })
  }
  if (uniqueStrokes.size === 5) {
    out.push({ icon: Star, title: 'All-strokes swimmer', detail: 'Every stroke logged', tone: 'gold' })
  }

  // First self-logged time
  if (times.some((t) => t.is_self_logged)) {
    out.push({ icon: Pencil, title: 'Solo session', detail: 'First self-logged time', tone: 'green' })
  }

  // First PB ever
  if (times.some((t) => t.is_pb)) {
    out.push({ icon: Award, title: 'First PB', detail: 'A personal best achieved', tone: 'gold' })
  }

  return out
}

const toneClasses: Record<NonNullable<Achievement['tone']>, string> = {
  gold: 'bg-accent/10 text-accent',
  blue: 'bg-primary/10 text-primary',
  green: 'bg-secondary/10 text-secondary',
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
          <CardHeader
            title="Achievements"
            subtitle={`${achievements.length} earned · log more times to unlock new ones`}
          />
          {achievements.length === 0 ? (
            <EmptyState
              icon={<Trophy className="h-6 w-6" />}
              title="No achievements yet"
              description="Log times to start earning PB and milestone badges."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-card border border-border bg-bg p-4">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', toneClasses[a.tone ?? 'blue'])}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize text-text-primary">{a.title}</p>
                    <p className={cn('truncate text-xs text-text-secondary', a.detailMono && 'font-mono tabular-nums')}>
                      {a.detail}
                    </p>
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
