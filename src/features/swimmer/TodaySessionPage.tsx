import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Trophy, CheckCircle2, Check, ChevronRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useMySwimmer, useAssignedSessions } from '@/hooks/useMySwimmer'
import { useLogTime } from '@/hooks/useTimes'
import { useSessionSetTargets, useLogPlanSetResult } from '@/hooks/usePlanSetResults'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { formatTime, parseTime } from '@/lib/formatTime'
import { localDateStr } from '@/lib/dateLocal'
import { cn } from '@/lib/cn'
import { STROKES, DISTANCES } from '@/types'
import type { Session, Stroke } from '@/types'

function LogTimePanel({
  session,
  swimmerId,
  onDone,
}: {
  session: Session
  swimmerId: string
  onDone: (isPb: boolean) => void
}) {
  const logTime = useLogTime()
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState(100)
  const [raw, setRaw] = useState('')

  const save = async () => {
    const seconds = parseTime(raw)
    if (seconds == null) return
    const result = await logTime.mutateAsync({
      swimmer_id: swimmerId,
      stroke,
      distance,
      time_seconds: seconds,
      session_id: session.id,
      is_self_logged: true,
    })
    setRaw('')
    onDone(result.isPb)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Stroke" value={stroke} onChange={(e) => setStroke(e.target.value as Stroke)}>
          {STROKES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </Select>
        <Select label="Distance" value={distance} onChange={(e) => setDistance(Number(e.target.value))}>
          {DISTANCES.map((d) => (
            <option key={d} value={d}>{d}m</option>
          ))}
        </Select>
      </div>
      <Input
        label="Time"
        placeholder="1:02.45 or 47.32"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        error={raw.length > 0 && parseTime(raw) == null ? 'Invalid time' : undefined}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onDone(false)}>Cancel</Button>
        <Button loading={logTime.isPending} disabled={parseTime(raw) == null} onClick={save}>
          Save time
        </Button>
      </div>
    </div>
  )
}

const BLOCKS: { key: string; label: string; field: keyof Session }[] = [
  { key: 'warm_up', label: 'Warm-up', field: 'warm_up' },
  { key: 'main_set', label: 'Main set', field: 'main_set' },
  { key: 'cool_down', label: 'Cool-down', field: 'cool_down' },
]

/** Read-only rendering of a session's warm-up/main-set/cool-down text —
 * used both for previewing a future ("Coming up") session and as context
 * inside the "Log time" modal. No check-off interaction; that only makes
 * sense for the session actually being done today (see CheckableBlocks). */
function SessionBlocksView({ session }: { session: Session }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {BLOCKS.map(({ key, label, field }) => {
        const body = session[field] as string | null
        return (
          <div key={key} className="rounded-component bg-bg p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-text-primary">{body || '—'}</p>
          </div>
        )
      })}
    </div>
  )
}

function CheckableBlocks({ session }: { session: Session }) {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>(`sc_block_done_${localDateStr()}`, {})

  const toggle = (key: string) => setDone((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {BLOCKS.map(({ key, label, field }) => {
        const checked = !!done[key]
        const body = session[field] as string | null
        return (
          <div
            key={key}
            className={cn(
              'rounded-component bg-bg p-3 transition-opacity',
              checked && 'opacity-60',
            )}
          >
            <button
              onClick={() => toggle(key)}
              className="flex items-center gap-2 text-left"
              aria-label={checked ? `Uncheck ${label}` : `Check off ${label}`}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  checked ? 'border-secondary bg-secondary' : 'border-border',
                )}
              >
                {checked && <Check className="h-3 w-3 text-on-primary" />}
              </span>
              <p className={cn('text-xs font-medium uppercase tracking-wide text-text-muted', checked && 'line-through')}>
                {label}
              </p>
            </button>
            <p className="mt-1 whitespace-pre-line text-sm text-text-primary">{body || '—'}</p>
          </div>
        )
      })}
    </div>
  )
}

function targetLabel(s: { target_pace_seconds: number | null; css_offset_seconds: number | null; intensity_zone: string | null }) {
  if (s.target_pace_seconds != null) return `target ${formatTime(s.target_pace_seconds)}`
  if (s.css_offset_seconds != null) return `target CSS${s.css_offset_seconds >= 0 ? '+' : ''}${s.css_offset_seconds}`
  if (s.intensity_zone) return s.intensity_zone
  return null
}

/** Lets the swimmer log the time/pace they actually achieved against each
 * of the session's *structured* prescribed sets (goal-race generated
 * sessions only — see plan_set_targets). Feeds Milestone 4's adaptive CSS
 * suggestion for sets with a concrete target_pace_seconds; for the rest
 * it's just a record of what was actually done. Nothing here is required
 * to complete a session. */
function SetTargetLogger({ sessionId, swimmerId }: { sessionId: string; swimmerId: string }) {
  const { data: sets } = useSessionSetTargets(sessionId)
  const logResult = useLogPlanSetResult()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  if (!sets || sets.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Log your sets</p>
      <div className="space-y-2">
        {sets.map((s) => {
          const draft = drafts[s.id] ?? ''
          const draftSecs = draft.length > 0 ? parseTime(draft) : null
          const editing = draft.length > 0 || s.actual_pace_seconds == null
          const target = targetLabel(s)
          return (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-component bg-bg p-3 text-sm">
              <div>
                <p className="text-text-primary">
                  {s.reps} × {s.distance_meters}m{s.stroke ? ` ${s.stroke}` : ''}
                </p>
                {target && (
                  <p className="font-mono text-xs tabular-nums text-text-muted">{target}</p>
                )}
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Input
                      placeholder="1:32.0"
                      value={draft}
                      onChange={(e) => setDrafts((p) => ({ ...p, [s.id]: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={draftSecs == null}
                    loading={logResult.isPending}
                    onClick={async () => {
                      if (draftSecs == null) return
                      await logResult.mutateAsync({
                        plan_set_target_id: s.id,
                        swimmer_id: swimmerId,
                        actual_pace_seconds: draftSecs,
                        session_id: sessionId,
                      })
                      setDrafts((p) => ({ ...p, [s.id]: '' }))
                    }}
                  >
                    Log
                  </Button>
                </div>
              ) : (
                <button
                  className="font-mono text-xs tabular-nums text-secondary hover:underline"
                  onClick={() => setDrafts((p) => ({ ...p, [s.id]: formatTime(s.actual_pace_seconds!) }))}
                >
                  logged {formatTime(s.actual_pace_seconds!)} · edit
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The "Log time" modal's contents — structured per-set logging when the
 * session has any (goal-race generated sessions), a free-form swim logger
 * always available underneath, and the raw warm-up/main-set/cool-down text
 * shown as context when there's nothing structured to log against. */
function LogTimeModalContent({
  session,
  swimmerId,
  onDone,
}: {
  session: Session
  swimmerId: string
  onDone: (isPb: boolean) => void
}) {
  const { data: sets } = useSessionSetTargets(session.id)
  const hasStructuredSets = (sets ?? []).length > 0

  return (
    <div className="space-y-5">
      {hasStructuredSets ? (
        <SetTargetLogger sessionId={session.id} swimmerId={swimmerId} />
      ) : (
        <SessionBlocksView session={session} />
      )}
      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
          {hasStructuredSets ? 'Log a different swim' : 'Log a swim'}
        </p>
        <LogTimePanel session={session} swimmerId={swimmerId} onDone={onDone} />
      </div>
    </div>
  )
}

type FlashType = 'pb' | 'saved' | null

export function TodaySessionPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: sessions } = useAssignedSessions(swimmer?.id)
  const today = localDateStr()
  const todaySession = (sessions ?? []).find((s) => s.date === today) ?? null
  const upcoming = (sessions ?? []).filter((s) => s.date > today).reverse()

  const [logOpen, setLogOpen] = useState(false)
  const [previewSession, setPreviewSession] = useState<Session | null>(null)
  const [flash, setFlash] = useState<FlashType>(null)

  const handleDone = (isPb: boolean) => {
    setLogOpen(false)
    setFlash(isPb ? 'pb' : 'saved')
    setTimeout(() => setFlash(null), 3000)
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader kicker="Today" />
        <Card>
          <CardHeader
            title="Today"
            action={
              todaySession && swimmer ? (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setLogOpen(true)}
                >
                  Log time
                </Button>
              ) : null
            }
          />

          {flash === 'pb' && (
            <div className="mb-3 flex items-center gap-2 rounded-component border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
              <Trophy className="h-4 w-4" /> New personal best!
            </div>
          )}
          {flash === 'saved' && (
            <div className="mb-3 flex items-center gap-2 rounded-component border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm text-secondary">
              <CheckCircle2 className="h-4 w-4" /> Time saved
            </div>
          )}

          {todaySession ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">{todaySession.title}</h3>
                <Badge tone="blue" className="capitalize">{todaySession.type}</Badge>
              </div>
              <CheckableBlocks session={todaySession} />
              {todaySession.notes && (
                <p className="rounded-component bg-bg p-3 text-sm text-text-secondary">{todaySession.notes}</p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No session today"
              description="Rest day! Or log a swim of your own to keep your streak going."
              action={
                <Link to="/swimmer/times">
                  <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                    Log a swim
                  </Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>

      {upcoming.length > 0 && (
        <div>
          <SectionHeader kicker="Coming up" />
          <Card>
            <CardHeader title="Coming up" />
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setPreviewSession(s)}
                    className="flex w-full items-center justify-between gap-2 rounded-component bg-bg p-3 text-left text-sm transition-colors hover:bg-border/40"
                  >
                    <span className="font-medium text-text-primary">{s.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-text-secondary">{new Date(s.date).toLocaleDateString()}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {todaySession && swimmer && (
        <Modal open={logOpen} onClose={() => setLogOpen(false)} title={`Log time for ${todaySession.title}`}>
          <LogTimeModalContent session={todaySession} swimmerId={swimmer.id} onDone={handleDone} />
        </Modal>
      )}

      <Modal open={previewSession != null} onClose={() => setPreviewSession(null)} title={previewSession?.title ?? ''}>
        {previewSession && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone="blue" className="capitalize">{previewSession.type}</Badge>
              <span className="font-mono text-sm tabular-nums text-text-secondary">
                {new Date(previewSession.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <SessionBlocksView session={previewSession} />
            {previewSession.notes && (
              <p className="rounded-component bg-bg p-3 text-sm text-text-secondary">{previewSession.notes}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
