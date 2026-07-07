import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Pin, PinOff, Send, Timer, Trash2, Gauge } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, LevelBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SwimmerCard } from '@/components/ui/SwimmerCard'
import { TimesChart } from '@/components/charts/TimesChart'
import { useSwimmer } from '@/hooks/useSwimmers'
import { useTimes, useDeleteTime } from '@/hooks/useTimes'
import { useGoals, useDeleteGoal } from '@/hooks/useGoals'
import { useFeedback, useCreateFeedback, useDeleteFeedback, useToggleFeedbackPin } from '@/hooks/useFeedback'
import { useCssResultForSwimmer } from '@/hooks/useCssResults'
import { useSwimmerStatsByUserId } from '@/hooks/useSwimmerStats'
import { formatTime } from '@/lib/formatTime'
import { STROKES, swimmerName } from '@/types'
import type { Stroke, SwimTime, Goal, Feedback } from '@/types'

export function SwimmerProfilePage() {
  const { swimmerId } = useParams()
  const { data: swimmer } = useSwimmer(swimmerId)
  const { data: swimmerStats } = useSwimmerStatsByUserId(swimmer?.profile_id)
  const { data: times } = useTimes(swimmerId)
  const { data: goals } = useGoals(swimmerId)
  const { data: feedback } = useFeedback(swimmerId)
  const { data: cssResult } = useCssResultForSwimmer(swimmerId)
  const createFeedback = useCreateFeedback()
  const deleteTime = useDeleteTime()
  const deleteGoal = useDeleteGoal()
  const deleteFeedback = useDeleteFeedback()
  const togglePin = useToggleFeedbackPin()

  const [strokeFilter, setStrokeFilter] = useState<Stroke | 'all'>('all')
  const [note, setNote] = useState('')
  const [confirmTime, setConfirmTime] = useState<SwimTime | null>(null)
  const [confirmGoal, setConfirmGoal] = useState<Goal | null>(null)
  const [confirmFeedback, setConfirmFeedback] = useState<Feedback | null>(null)

  const filteredTimes = useMemo(
    () => (times ?? []).filter((t) => strokeFilter === 'all' || t.stroke === strokeFilter),
    [times, strokeFilter],
  )

  if (!swimmer) {
    return <Card>Loading swimmer…</Card>
  }

  const submitNote = async () => {
    if (!note.trim() || !swimmerId) return
    await createFeedback.mutateAsync({ swimmerId, content: note.trim() })
    setNote('')
  }

  return (
    <div className="space-y-8">
      <Link to="/coach/roster" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to roster
      </Link>

      <Card className="flex items-center gap-4">
        <Avatar name={swimmerName(swimmer)} size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-text-primary">{swimmerName(swimmer)}</h2>
          <div className="mt-1 flex items-center gap-2">
            <LevelBadge level={swimmer.level} />
            {swimmer.squad && <span className="text-sm text-text-secondary">{swimmer.squad}</span>}
          </div>
          {swimmer.notes && <p className="mt-2 text-sm text-text-secondary">{swimmer.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {cssResult && (
            <span className="flex items-center gap-1.5 rounded-component bg-primary/10 px-3 py-1 text-xs font-mono tabular-nums text-primary">
              <Gauge className="h-3.5 w-3.5" />
              CSS {formatTime(cssResult.pace_per_100)}/100m
            </span>
          )}
          <Link to="/coach/log">
            <Button leftIcon={<Timer className="h-4 w-4" />}>Log a time</Button>
          </Link>
        </div>
      </Card>

      {swimmerStats && (
        <div className="flex items-start gap-4">
          <SwimmerCard
            stats={swimmerStats}
            name={swimmerName(swimmer)}
            avatarUrl={swimmer.profile?.avatar_url ?? undefined}
            size="md"
          />
          <div className="flex flex-col gap-1 pt-1 text-sm">
            <p className="text-text-secondary">
              OVR{' '}
              <span className="font-mono font-bold text-text-primary">{swimmerStats.ovr}</span>
            </p>
            <p className="text-xs capitalize text-text-muted">Tier: {swimmerStats.tier}</p>
          </div>
        </div>
      )}

      <div>
        <SectionHeader kicker="Progress" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Progress" />
            <TimesChart times={times ?? []} />
          </Card>

          <Card>
            <CardHeader
              title="Times"
              action={
                <Select value={strokeFilter} onChange={(e) => setStrokeFilter(e.target.value as Stroke | 'all')} className="w-36">
                  <option value="all">All strokes</option>
                  {STROKES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </Select>
              }
            />
            {filteredTimes.length === 0 ? (
              <EmptyState icon={<Timer className="h-6 w-6" />} title="No times logged yet" />
            ) : (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {filteredTimes.map((t) => (
                  <li key={t.id} className="group flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium capitalize text-text-primary">
                        {t.distance}m {t.stroke}
                      </span>
                      <span className="ml-2 text-xs text-text-muted">
                        {new Date(t.recorded_at).toLocaleDateString()}
                        {t.is_self_logged && ' · self-logged'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.is_pb && (
                        <Badge tone="amber">
                          <Trophy className="mr-1 h-3 w-3" /> PB
                        </Badge>
                      )}
                      <span className="font-mono font-medium text-text-primary">{formatTime(t.time_seconds)}</span>
                      <button
                        onClick={() => setConfirmTime(t)}
                        className="hidden group-hover:flex items-center justify-center rounded p-1 text-text-muted hover:text-danger"
                        title="Delete time"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div>
        <SectionHeader kicker="Goals & Feedback" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Goals" />
            {(goals ?? []).length === 0 ? (
              <EmptyState icon={<Trophy className="h-6 w-6" />} title="No goals set" />
            ) : (
              <ul className="space-y-2">
                {(goals ?? []).map((g) => (
                  <li key={g.id} className="group flex items-center justify-between rounded-component bg-bg p-3 text-sm">
                    <span className="capitalize text-text-primary">
                      {g.distance}m {g.stroke}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-text-secondary">
                        Target {formatTime(g.target_time_seconds)}
                        {g.deadline && ` · by ${new Date(g.deadline).toLocaleDateString()}`}
                      </span>
                      <button
                        onClick={() => setConfirmGoal(g)}
                        className="hidden group-hover:flex items-center justify-center rounded p-1 text-text-muted hover:text-danger"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Coach notes & feedback" />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write feedback for this swimmer…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button leftIcon={<Send className="h-4 w-4" />} loading={createFeedback.isPending} onClick={submitNote} disabled={!note.trim()}>
                  Send
                </Button>
              </div>
              {(feedback ?? []).length === 0 ? (
                <p className="text-sm text-text-muted">No feedback yet.</p>
              ) : (
                <ul className="max-h-60 space-y-2 overflow-y-auto">
                  {(feedback ?? []).map((f) => (
                    <li key={f.id} className="group rounded-component border border-border p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-text-muted">
                          {f.is_pinned && <Pin className="h-3 w-3 text-accent" />}
                          {new Date(f.created_at).toLocaleDateString()}
                        </div>
                        <div className="hidden gap-1 group-hover:flex">
                          <button
                            onClick={() => togglePin.mutate({ id: f.id, is_pinned: !f.is_pinned })}
                            className="rounded p-1 text-text-muted hover:text-accent"
                            title={f.is_pinned ? 'Unpin' : 'Pin'}
                          >
                            {f.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setConfirmFeedback(f)}
                            className="rounded p-1 text-text-muted hover:text-danger"
                            title="Delete feedback"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-text-primary">{f.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirm delete modals */}
      {confirmTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmTime(null)}>
          <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-text-primary">Delete time?</p>
            <p className="mt-1 text-sm text-text-secondary">
              {confirmTime.distance}m {confirmTime.stroke} — {formatTime(confirmTime.time_seconds)} on{' '}
              {new Date(confirmTime.recorded_at).toLocaleDateString()}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmTime(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteTime.isPending} onClick={async () => { await deleteTime.mutateAsync(confirmTime.id); setConfirmTime(null) }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      {confirmGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmGoal(null)}>
          <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-text-primary">Delete goal?</p>
            <p className="mt-1 text-sm text-text-secondary">
              {confirmGoal.distance}m {confirmGoal.stroke} — target {formatTime(confirmGoal.target_time_seconds)}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmGoal(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteGoal.isPending} onClick={async () => { await deleteGoal.mutateAsync({ id: confirmGoal.id, swimmerId: confirmGoal.swimmer_id }); setConfirmGoal(null) }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      {confirmFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmFeedback(null)}>
          <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-text-primary">Delete feedback?</p>
            <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{confirmFeedback.content}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmFeedback(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteFeedback.isPending} onClick={async () => { await deleteFeedback.mutateAsync(confirmFeedback.id); setConfirmFeedback(null) }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
