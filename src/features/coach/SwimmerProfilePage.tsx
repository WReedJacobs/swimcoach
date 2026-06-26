import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Pin, Send, Timer } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, LevelBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TimesChart } from '@/components/charts/TimesChart'
import { useSwimmer } from '@/hooks/useSwimmers'
import { useTimes } from '@/hooks/useTimes'
import { useGoals } from '@/hooks/useGoals'
import { useFeedback, useCreateFeedback } from '@/hooks/useFeedback'
import { formatTime } from '@/lib/formatTime'
import { STROKES, swimmerName } from '@/types'
import type { Stroke } from '@/types'

export function SwimmerProfilePage() {
  const { swimmerId } = useParams()
  const { data: swimmer } = useSwimmer(swimmerId)
  const { data: times } = useTimes(swimmerId)
  const { data: goals } = useGoals(swimmerId)
  const { data: feedback } = useFeedback(swimmerId)
  const createFeedback = useCreateFeedback()

  const [strokeFilter, setStrokeFilter] = useState<Stroke | 'all'>('all')
  const [note, setNote] = useState('')

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
        <Link to="/coach/log">
          <Button leftIcon={<Timer className="h-4 w-4" />}>Log a time</Button>
        </Link>
      </Card>

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
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </Select>
            }
          />
          {filteredTimes.length === 0 ? (
            <EmptyState icon={<Timer className="h-6 w-6" />} title="No times logged yet" />
          ) : (
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {filteredTimes.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
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
                <li key={g.id} className="flex items-center justify-between rounded-component bg-bg p-3 text-sm">
                  <span className="capitalize text-text-primary">
                    {g.distance}m {g.stroke}
                  </span>
                  <span className="font-mono tabular-nums text-text-secondary">
                    Target {formatTime(g.target_time_seconds)}
                    {g.deadline && ` · by ${new Date(g.deadline).toLocaleDateString()}`}
                  </span>
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
                  <li key={f.id} className="rounded-component border border-border p-3 text-sm">
                    <div className="mb-1 flex items-center gap-2 font-mono text-xs tabular-nums text-text-muted">
                      {f.is_pinned && <Pin className="h-3 w-3 text-accent" />}
                      {new Date(f.created_at).toLocaleDateString()}
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
    </div>
  )
}
