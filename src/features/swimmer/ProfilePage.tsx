import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Globe, Lock } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SwimmerCard } from '@/components/ui/SwimmerCard'
import { TierUpModal } from '@/components/ui/TierUpModal'
import { useAuth } from '@/hooks/useAuth'
import {
  useMyStats,
  useRecalculateStats,
  useSetPublic,
} from '@/hooks/useSwimmerStats'
import { TIER_THRESHOLDS } from '@/lib/statsEngine'

const STAT_TIPS: Record<string, string[]> = {
  spd: ['Log more PBs', 'Try a CSS test', 'Add more strokes to your times'],
  end_stat: ['Swim longer distances', 'Hit weekly distance milestones', 'Keep up weekly sessions'],
  tec: ['Watch drill videos', 'Practice multiple strokes', 'Attend structured sessions'],
  con: ['Maintain your daily streak', 'Beat your longest streak', 'Log sessions weekly'],
  prg: ['Achieve active goals', 'Set new personal bests', 'Complete milestones'],
  com: ['Stay active daily', 'Connect with a coach', 'Send messages to your coach', 'Set goals'],
}

const STAT_LABELS: Record<string, string> = {
  spd: 'Speed',
  end_stat: 'Endurance',
  tec: 'Technique',
  con: 'Consistency',
  prg: 'Progress',
  com: 'Commitment',
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const { data: stats, isLoading } = useMyStats()
  const recalculate = useRecalculateStats()
  const setPublic = useSetPublic()

  // Nothing else ever wrote to this key, so the "OVR history" card below
  // never had data to show. Seed from whatever's already stored, then
  // append on every fresh calculation (deduped by last_calculated, capped
  // at 10 — this is a local trend view, not synced across devices).
  const [ovrHistory, setOvrHistory] = useState<Array<{ ovr: number; date: string }>>(() => {
    if (!user) return []
    try {
      return JSON.parse(localStorage.getItem(`swimphoria:ovr_history:${user.id}`) ?? '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (!user || !stats) return
    setOvrHistory((prev) => {
      if (prev[prev.length - 1]?.date === stats.last_calculated) return prev
      const next = [...prev, { ovr: stats.ovr, date: stats.last_calculated }].slice(-10)
      localStorage.setItem(`swimphoria:ovr_history:${user.id}`, JSON.stringify(next))
      return next
    })
  }, [user, stats])

  const maxOvr = useMemo(() => Math.max(...ovrHistory.map((h) => h.ovr), 40), [ovrHistory])

  const nextTier = useMemo(() => {
    if (!stats) return null
    const next = TIER_THRESHOLDS.find((t) => t.ovr > stats.ovr)
    return next ? { ...next, gap: next.ovr - stats.ovr } : null
  }, [stats])

  const lowestStat = useMemo(() => {
    if (!stats) return null
    const entries: Array<{ key: string; val: number }> = [
      { key: 'spd', val: stats.spd },
      { key: 'end_stat', val: stats.end_stat },
      { key: 'tec', val: stats.tec },
      { key: 'con', val: stats.con },
      { key: 'prg', val: stats.prg },
      { key: 'com', val: stats.com },
    ]
    return entries.reduce((min, e) => (e.val < min.val ? e : min), entries[0])
  }, [stats])

  if (isLoading || !stats) {
    return (
      <div className="space-y-8">
        <SectionHeader kicker="My Profile" />
        <div className="flex items-center justify-center py-20">
          <p className="text-text-muted">Loading your profile…</p>
        </div>
      </div>
    )
  }

  const statRows: Array<{ key: keyof typeof stats; label: string }> = [
    { key: 'spd', label: 'Speed' },
    { key: 'end_stat', label: 'Endurance' },
    { key: 'tec', label: 'Technique' },
    { key: 'con', label: 'Consistency' },
    { key: 'prg', label: 'Progress' },
    { key: 'com', label: 'Commitment' },
  ]

  return (
    <div className="space-y-8">
      {user && (
        <TierUpModal
          userId={user.id}
          stats={stats}
          name={profile?.full_name ?? 'Me'}
          avatarUrl={profile?.avatar_url}
          club={profile?.club_name}
        />
      )}
      <SectionHeader
        kicker="My Profile"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPublic.mutate(!profile?.is_public)}
              disabled={setPublic.isPending}
              className="flex items-center gap-2 rounded-component border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary disabled:opacity-40"
            >
              {profile?.is_public ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-secondary" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Private
                </>
              )}
            </button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              loading={recalculate.isPending}
              onClick={() => recalculate.mutate()}
            >
              Recalculate
            </Button>
          </div>
        }
      />

      {/* Card + stats */}
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {/* FIFA card */}
        <div className="flex justify-center w-full lg:w-auto">
          <SwimmerCard
            stats={stats}
            name={profile?.full_name ?? 'Me'}
            avatarUrl={profile?.avatar_url}
            club={profile?.club_name}
            size="lg"
          />
        </div>

        {/* Stat bars */}
        <div className="flex-1 w-full space-y-6">
          <Card>
            <CardHeader title="Attribute breakdown" />
            <div className="grid gap-3 sm:grid-cols-2">
              {statRows.map(({ key, label }) => {
                const val = stats[key] as number
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-secondary">{label}</span>
                      <span className="font-mono font-bold tabular-nums text-text-primary">{val}</span>
                    </div>
                    <ProgressBar value={val} max={99} tone={val >= 75 ? 'green' : val >= 50 ? 'blue' : 'amber'} />
                  </div>
                )
              })}
            </div>

            <p className="mt-4 text-xs text-text-muted">
              Last calculated:{' '}
              <span className="font-mono tabular-nums">
                {new Date(stats.last_calculated).toLocaleDateString()}
              </span>
            </p>
          </Card>

          {/* Progress to next tier */}
          {nextTier && (
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader
                title={`${nextTier.gap} OVR to ${nextTier.label}`}
                subtitle={lowestStat ? `Focus on ${STAT_LABELS[lowestStat.key]} (${lowestStat.val}) — your lowest attribute` : undefined}
              />
              {/* Progress bar */}
              {(() => {
                const prevTier = TIER_THRESHOLDS.slice().reverse().find((t) => t.ovr <= stats.ovr)
                const from = prevTier?.ovr ?? 0
                const pct = Math.min(99, ((stats.ovr - from) / (nextTier.ovr - from)) * 100)
                return (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-text-muted">
                      <span>{stats.ovr} OVR</span>
                      <span>{nextTier.label} at {nextTier.ovr}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
              {lowestStat && (
                <ul className="mt-3 space-y-1.5">
                  {(STAT_TIPS[lowestStat.key] ?? []).slice(0, 3).map((tip) => (
                    <li key={tip} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* OVR history */}
      {ovrHistory.length > 1 && (
        <Card>
          <CardHeader title="OVR history" subtitle="Last 10 calculations" />
          <div className="flex h-24 items-end gap-2 pt-2">
            {ovrHistory.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[9px] text-text-muted">{h.ovr}</span>
                <div
                  className="w-full rounded-sm bg-primary transition-all"
                  style={{ height: Math.max(4, (h.ovr / maxOvr) * 72) }}
                />
                <span className="font-mono text-[9px] text-text-muted">
                  {new Date(h.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
