import { useMemo } from 'react'
import {
  Trophy, Medal, Award, Flame, Zap, Star, Pencil,
  Droplets, Layers, CheckCircle2, Lock, Shuffle, Timer, CalendarDays, Target,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useTimes } from '@/hooks/useTimes'
import type { SwimTime, Stroke } from '@/types'

// ─── Achievement definitions ──────────────────────────────────────────────────

interface AchievementDef {
  id: string
  title: string
  description: string
  icon: LucideIcon
  category: 'milestone' | 'speed' | 'consistency' | 'variety'
  earned: (times: SwimTime[], totalDist: number) => boolean
  /** 0–100. Drives the "Coming up" sort and progress bar. */
  progressPct: (times: SwimTime[], totalDist: number) => number
}

function bestFor(times: SwimTime[], distance: number, stroke: string): number | null {
  const relevant = times.filter((t) => t.distance === distance && t.stroke === stroke)
  return relevant.length ? Math.min(...relevant.map((t) => t.time_seconds)) : null
}

function bestAny400(times: SwimTime[]): number | null {
  const relevant = times.filter((t) => t.distance === 400)
  return relevant.length ? Math.min(...relevant.map((t) => t.time_seconds)) : null
}

function maxSessionsInWeek(times: SwimTime[]): number {
  if (!times.length) return 0
  const counts = new Map<string, number>()
  for (const t of times) {
    const d = new Date(t.recorded_at)
    const yr = d.getFullYear()
    const jan1 = new Date(yr, 0, 1)
    const wk = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    const key = `${yr}-W${wk}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Math.max(0, ...[...counts.values()])
}

function speedProgress(best: number | null, threshold: number): number {
  if (best === null) return 0
  return Math.min(99, (threshold / best) * 100)
}

const SWIM_STROKES: Stroke[] = ['freestyle', 'backstroke', 'breaststroke', 'butterfly']

const ALL_ACHIEVEMENTS: AchievementDef[] = [
  // ── Milestone (total distance logged) ─────────────────────────────────────
  {
    id: 'first-splash',
    title: 'First Splash',
    description: 'Log your first swim',
    icon: Droplets,
    category: 'milestone',
    earned: (t) => t.length >= 1,
    progressPct: (t) => (t.length >= 1 ? 100 : 0),
  },
  {
    id: '1k-club',
    title: '1K Club',
    description: 'Log 1,000m total distance',
    icon: Flame,
    category: 'milestone',
    earned: (_, d) => d >= 1000,
    progressPct: (_, d) => Math.min(99, (d / 1000) * 100),
  },
  {
    id: '5k-swimmer',
    title: '5K Swimmer',
    description: 'Log 5,000m total distance',
    icon: Zap,
    category: 'milestone',
    earned: (_, d) => d >= 5000,
    progressPct: (_, d) => Math.min(99, (d / 5000) * 100),
  },
  {
    id: '10k-milestone',
    title: '10K Milestone',
    description: 'Log 10,000m total distance',
    icon: Medal,
    category: 'milestone',
    earned: (_, d) => d >= 10_000,
    progressPct: (_, d) => Math.min(99, (d / 10_000) * 100),
  },
  {
    id: '25k-swimmer',
    title: '25K Swimmer',
    description: 'Log 25,000m total distance',
    icon: Medal,
    category: 'milestone',
    earned: (_, d) => d >= 25_000,
    progressPct: (_, d) => Math.min(99, (d / 25_000) * 100),
  },
  {
    id: '50k-swimmer',
    title: '50K Swimmer',
    description: 'Log 50,000m total distance',
    icon: Trophy,
    category: 'milestone',
    earned: (_, d) => d >= 50_000,
    progressPct: (_, d) => Math.min(99, (d / 50_000) * 100),
  },
  {
    id: 'century-club',
    title: 'Century Club',
    description: 'Log 100,000m total — 100km in the pool',
    icon: Star,
    category: 'milestone',
    earned: (_, d) => d >= 100_000,
    progressPct: (_, d) => Math.min(99, (d / 100_000) * 100),
  },
  {
    id: 'marathon-swimmer',
    title: 'Marathon Swimmer',
    description: 'Log 42,195m total — a full marathon in the pool',
    icon: Award,
    category: 'milestone',
    earned: (_, d) => d >= 42_195,
    progressPct: (_, d) => Math.min(99, (d / 42_195) * 100),
  },

  // ── Speed (PB-based) ──────────────────────────────────────────────────────
  {
    id: 'sub-2min-100-free',
    title: 'Sub-2:00 100m Free',
    description: 'Swim 100m freestyle in under 2 minutes',
    icon: Timer,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 100, 'freestyle'); return b !== null && b < 120 },
    progressPct: (t) => speedProgress(bestFor(t, 100, 'freestyle'), 120),
  },
  {
    id: 'sub-90s-100-free',
    title: 'Sub-1:30 100m Free',
    description: 'Swim 100m freestyle in under 1:30',
    icon: Timer,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 100, 'freestyle'); return b !== null && b < 90 },
    progressPct: (t) => speedProgress(bestFor(t, 100, 'freestyle'), 90),
  },
  {
    id: 'sub-1min-100-free',
    title: 'Sub-1:00 100m Free',
    description: 'Swim 100m freestyle in under 60 seconds — elite territory',
    icon: Zap,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 100, 'freestyle'); return b !== null && b < 60 },
    progressPct: (t) => speedProgress(bestFor(t, 100, 'freestyle'), 60),
  },
  {
    id: 'sub-40s-50-free',
    title: 'Sub-40s 50m Free',
    description: 'Swim 50m freestyle in under 40 seconds',
    icon: Zap,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 50, 'freestyle'); return b !== null && b < 40 },
    progressPct: (t) => speedProgress(bestFor(t, 50, 'freestyle'), 40),
  },
  {
    id: 'sub-35s-50-free',
    title: 'Sub-35s 50m Free',
    description: 'Swim 50m freestyle in under 35 seconds',
    icon: Zap,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 50, 'freestyle'); return b !== null && b < 35 },
    progressPct: (t) => speedProgress(bestFor(t, 50, 'freestyle'), 35),
  },
  {
    id: 'sub-30s-50-free',
    title: 'Sub-30s 50m Free',
    description: 'Swim 50m freestyle in under 30 seconds — elite territory',
    icon: Zap,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 50, 'freestyle'); return b !== null && b < 30 },
    progressPct: (t) => speedProgress(bestFor(t, 50, 'freestyle'), 30),
  },
  {
    id: 'first-butterfly',
    title: 'First Fly',
    description: 'Log a butterfly time — the hardest stroke',
    icon: Award,
    category: 'speed',
    earned: (t) => t.some((x) => x.stroke === 'butterfly'),
    progressPct: (t) => (t.some((x) => x.stroke === 'butterfly') ? 100 : 0),
  },
  {
    id: 'sub-3min-200-free',
    title: 'Sub-3:00 200m Free',
    description: 'Swim 200m freestyle in under 3 minutes',
    icon: Timer,
    category: 'speed',
    earned: (t) => { const b = bestFor(t, 200, 'freestyle'); return b !== null && b < 180 },
    progressPct: (t) => speedProgress(bestFor(t, 200, 'freestyle'), 180),
  },
  {
    id: 'sub-5min-400',
    title: 'Under 5:00 for 400m',
    description: 'Complete any 400m event in under 5 minutes',
    icon: Timer,
    category: 'speed',
    earned: (t) => { const b = bestAny400(t); return b !== null && b < 300 },
    progressPct: (t) => speedProgress(bestAny400(t), 300),
  },

  // ── Consistency (times logged count) ─────────────────────────────────────
  {
    id: 'first-log',
    title: 'First Log',
    description: 'Record your first time',
    icon: CheckCircle2,
    category: 'consistency',
    earned: (t) => t.length >= 1,
    progressPct: (t) => (t.length >= 1 ? 100 : 0),
  },
  {
    id: 'regular-10',
    title: 'Regular',
    description: 'Log 10 times',
    icon: CalendarDays,
    category: 'consistency',
    earned: (t) => t.length >= 10,
    progressPct: (t) => Math.min(99, (t.length / 10) * 100),
  },
  {
    id: 'committed-50',
    title: 'Committed',
    description: 'Log 50 times',
    icon: Target,
    category: 'consistency',
    earned: (t) => t.length >= 50,
    progressPct: (t) => Math.min(99, (t.length / 50) * 100),
  },
  {
    id: 'dedicated-100',
    title: 'Dedicated',
    description: 'Log 100 times',
    icon: Award,
    category: 'consistency',
    earned: (t) => t.length >= 100,
    progressPct: (t) => Math.min(99, (t.length / 100) * 100),
  },
  {
    id: 'weekly-habit',
    title: 'Weekly Habit',
    description: 'Log 4 or more sessions in a single week',
    icon: CalendarDays,
    category: 'consistency',
    earned: (t) => maxSessionsInWeek(t) >= 4,
    progressPct: (t) => Math.min(99, (maxSessionsInWeek(t) / 4) * 100),
  },

  // ── Variety (stroke diversity) ────────────────────────────────────────────
  {
    id: 'double-dip',
    title: 'Double Dip',
    description: 'Log times in 2 different strokes',
    icon: Layers,
    category: 'variety',
    earned: (t) => new Set(t.map((x) => x.stroke)).size >= 2,
    progressPct: (t) => Math.min(99, (new Set(t.map((x) => x.stroke)).size / 2) * 100),
  },
  {
    id: 'triple-threat',
    title: 'Triple Threat',
    description: 'Log times in 3 different strokes',
    icon: Layers,
    category: 'variety',
    earned: (t) => new Set(t.map((x) => x.stroke)).size >= 3,
    progressPct: (t) => Math.min(99, (new Set(t.map((x) => x.stroke)).size / 3) * 100),
  },
  {
    id: 'all-four',
    title: 'All Four',
    description: 'Log freestyle, backstroke, breaststroke, and butterfly',
    icon: Star,
    category: 'variety',
    earned: (t) => {
      const s = new Set(t.map((x) => x.stroke))
      return SWIM_STROKES.every((stroke) => s.has(stroke))
    },
    progressPct: (t) => {
      const s = new Set(t.map((x) => x.stroke))
      const count = SWIM_STROKES.filter((stroke) => s.has(stroke)).length
      return Math.min(99, (count / 4) * 100)
    },
  },
  {
    id: 'im-ready',
    title: 'IM Ready',
    description: 'Log an Individual Medley time',
    icon: Shuffle,
    category: 'variety',
    earned: (t) => t.some((x) => x.stroke === 'IM'),
    progressPct: (t) => (t.some((x) => x.stroke === 'IM') ? 100 : 0),
  },
  {
    id: 'solo-swimmer',
    title: 'Solo Swimmer',
    description: 'Self-log your first time',
    icon: Pencil,
    category: 'variety',
    earned: (t) => t.some((x) => x.is_self_logged),
    progressPct: (t) => (t.some((x) => x.is_self_logged) ? 100 : 0),
  },
]

// ─── Derived data ─────────────────────────────────────────────────────────────

interface EvaluatedAchievement extends AchievementDef {
  isEarned: boolean
  pct: number
}

function evaluate(times: SwimTime[]): EvaluatedAchievement[] {
  const totalDist = times.reduce((s, t) => s + t.distance, 0)
  return ALL_ACHIEVEMENTS.map((def) => ({
    ...def,
    isEarned: def.earned(times, totalDist),
    pct: Math.min(100, def.progressPct(times, totalDist)),
  }))
}

// ─── Badge tile components ────────────────────────────────────────────────────

function EarnedTile({ a }: { a: EvaluatedAchievement }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-accent/30 bg-accent/5 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <a.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{a.title}</p>
        <p className="truncate text-xs text-text-secondary">{a.description}</p>
      </div>
    </div>
  )
}

function ComingUpTile({ a }: { a: EvaluatedAchievement }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-primary/20 bg-bg p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <a.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{a.title}</p>
          <p className="truncate text-xs text-text-secondary">{a.description}</p>
        </div>
      </div>
      <div className="space-y-1">
        <ProgressBar value={a.pct} tone="blue" className="h-1" />
        <p className="font-mono text-xs tabular-nums text-text-muted">{Math.round(a.pct)}% there</p>
      </div>
    </div>
  )
}

function LockedTile({ a }: { a: EvaluatedAchievement }) {
  return (
    <div className="relative flex items-center gap-3 rounded-card border border-border bg-bg p-4 opacity-40">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
        <a.icon className="h-5 w-5 text-text-muted" />
        <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-text-muted" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{a.title}</p>
        <p className="truncate text-xs text-text-secondary">{a.description}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AchievementsPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: times } = useTimes(swimmer?.id)

  const { earned, comingUp, locked, total } = useMemo(() => {
    const evaluated = evaluate(times ?? [])
    const earnedList = evaluated.filter((a) => a.isEarned)
    const unearned = evaluated.filter((a) => !a.isEarned).sort((a, b) => b.pct - a.pct)
    const comingUpList = unearned.filter((a) => a.pct > 0).slice(0, 6)
    const comingUpIds = new Set(comingUpList.map((a) => a.id))
    const lockedList = unearned.filter((a) => !comingUpIds.has(a.id))
    return { earned: earnedList, comingUp: comingUpList, locked: lockedList, total: evaluated.length }
  }, [times])

  return (
    <div className="space-y-8">
      {earned.length === 0 && comingUp.length === 0 ? (
        <div>
          <SectionHeader kicker="Achievements" />
          <Card>
            <EmptyState
              icon={<Trophy className="h-6 w-6" />}
              title="No achievements yet"
              description="Log your first time to start unlocking badges."
            />
          </Card>
        </div>
      ) : null}

      {earned.length > 0 && (
        <div>
          <SectionHeader kicker={`Earned · ${earned.length} of ${total}`} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((a) => <EarnedTile key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {comingUp.length > 0 && (
        <div>
          <SectionHeader kicker="Coming up" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {comingUp.map((a) => <ComingUpTile key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <SectionHeader kicker="Locked" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((a) => <LockedTile key={a.id} a={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}
