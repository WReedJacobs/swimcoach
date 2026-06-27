import { useMemo, useState } from 'react'
import { Trophy, Save, Plus, Timer, Table, Search, Gauge, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Stopwatch } from '@/components/ui/Stopwatch'
import { LevelBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { formatTime, parseTime } from '@/lib/formatTime'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useSessions } from '@/hooks/useSessions'
import { useLogTime } from '@/hooks/useTimes'
import { useCssResultForSwimmer } from '@/hooks/useCssResults'
import { STROKES, DISTANCES, swimmerName } from '@/types'
import type { Stroke, Swimmer } from '@/types'

type Mode = 'stopwatch' | 'bulk'

/** Dropdown of sessions from the last 60 days, with a "None" option. */
function SessionPicker({
  sessions,
  value,
  onChange,
}: {
  sessions: { id: string; title: string; date: string }[]
  value: string
  onChange: (id: string) => void
}) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const recent = sessions.filter((s) => new Date(s.date) >= cutoff)

  return (
    <Select label="Link to session (optional)" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No session</option>
      {recent.map((s) => (
        <option key={s.id} value={s.id}>
          {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {s.title}
        </option>
      ))}
    </Select>
  )
}

export function TimeLogger() {
  const { data: swimmers, isLoading } = useSwimmers()
  const { data: sessions } = useSessions()
  const [mode, setMode] = useState<Mode>('stopwatch')

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Log Times" />
      <div className="flex items-center gap-2">
        <Button
          variant={mode === 'stopwatch' ? 'primary' : 'outline'}
          leftIcon={<Timer className="h-4 w-4" />}
          onClick={() => setMode('stopwatch')}
        >
          Stopwatch
        </Button>
        <Button
          variant={mode === 'bulk' ? 'primary' : 'outline'}
          leftIcon={<Table className="h-4 w-4" />}
          onClick={() => setMode('bulk')}
        >
          Bulk entry
        </Button>
      </div>

      {isLoading ? (
        <Card>Loading swimmers…</Card>
      ) : !swimmers || swimmers.length === 0 ? (
        <EmptyState
          icon={<Timer className="h-6 w-6" />}
          title="Add a swimmer before logging times"
          description="Times are always attached to a swimmer, stroke and distance."
        />
      ) : mode === 'stopwatch' ? (
        <StopwatchMode swimmers={swimmers} sessions={sessions ?? []} />
      ) : (
        <BulkMode swimmers={swimmers} sessions={sessions ?? []} />
      )}
    </div>
  )
}

// ---------------- Stopwatch mode ----------------

function SwimmerCssBadge({ swimmerId }: { swimmerId: string }) {
  const { data: css } = useCssResultForSwimmer(swimmerId)
  if (!css) return null
  return (
    <span className="flex items-center gap-1 rounded-component bg-primary/10 px-2 py-0.5 text-xs font-mono tabular-nums text-primary">
      <Gauge className="h-3 w-3" />
      CSS {formatTime(css.pace_per_100)}/100m
    </span>
  )
}

function StopwatchMode({
  swimmers,
  sessions,
}: {
  swimmers: Swimmer[]
  sessions: { id: string; title: string; date: string }[]
}) {
  const logTime = useLogTime()
  const today = new Date().toISOString().slice(0, 10)
  const todaySessionId = sessions.find((s) => s.date === today)?.id ?? ''

  const [search, setSearch] = useState('')
  const [swimmerId, setSwimmerId] = useState<string>(swimmers[0]?.id ?? '')
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState<number>(100)
  const [sessionId, setSessionId] = useState<string>(todaySessionId)

  const [pending, setPending] = useState<number | null>(null)
  const [manual, setManual] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<{ seconds: number; isPb: boolean } | null>(null)

  const filtered = useMemo(
    () => swimmers.filter((s) => swimmerName(s).toLowerCase().includes(search.toLowerCase())),
    [swimmers, search],
  )

  const selected = swimmers.find((s) => s.id === swimmerId)

  const beginConfirm = (seconds: number) => {
    setResult(null)
    setPending(seconds)
  }

  const save = async () => {
    if (pending == null || !swimmerId) return
    const res = await logTime.mutateAsync({
      swimmer_id: swimmerId,
      stroke,
      distance,
      time_seconds: pending,
      session_id: sessionId || null,
      notes,
    })
    setResult({ seconds: pending, isPb: res.isPb })
    setPending(null)
    setNotes('')
    setManual('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardHeader title="Who & what" subtitle="Pick the swimmer and event" />
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Search swimmers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="-mt-7 ml-3 h-4 w-4 text-text-muted" />
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSwimmerId(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-component px-2 py-1.5 text-left text-sm',
                    s.id === swimmerId ? 'bg-primary/10 text-primary-dark' : 'hover:bg-bg',
                  )}
                >
                  <Avatar name={swimmerName(s)} size="sm" />
                  <span className="flex-1 truncate">{swimmerName(s)}</span>
                  <LevelBadge level={s.level} />
                </button>
              ))}
            </div>
          </div>

          {swimmerId && <SwimmerCssBadge swimmerId={swimmerId} />}

          <Select label="Stroke" value={stroke} onChange={(e) => setStroke(e.target.value as Stroke)}>
            {STROKES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </Select>

          <Select label="Distance (m)" value={distance} onChange={(e) => setDistance(Number(e.target.value))}>
            {DISTANCES.map((d) => (
              <option key={d} value={d}>{d}m</option>
            ))}
          </Select>

          <SessionPicker sessions={sessions} value={sessionId} onChange={setSessionId} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Timer"
          subtitle={selected ? `${swimmerName(selected)} · ${distance}m ${stroke}` : 'Select a swimmer'}
        />

        {result ? (
          <CelebrationPanel result={result} onLogAnother={() => setResult(null)} />
        ) : (
          <div className="space-y-6">
            <Stopwatch onStop={(seconds) => beginConfirm(seconds)} />

            <div className="flex items-end gap-2 border-t border-border pt-4">
              <Input
                label="Or enter manually"
                placeholder="1:02.45 or 47.32"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const parsed = parseTime(manual)
                  if (parsed != null) beginConfirm(parsed)
                }}
                disabled={parseTime(manual) == null}
              >
                Use
              </Button>
            </div>

            {pending != null && (
              <div className="rounded-card border border-primary/30 bg-primary/5 p-4">
                <p className="font-mono text-sm uppercase tracking-[0.14em] text-text-secondary">Recorded time</p>
                <p className="font-mono text-3xl font-semibold text-text-primary">
                  {formatTime(pending)}
                </p>
                <div className="mt-3 space-y-3">
                  <Textarea
                    label="Notes (optional)"
                    placeholder="e.g. strong finish, good turns"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button leftIcon={<Save className="h-4 w-4" />} loading={logTime.isPending} onClick={save}>
                      Log this time
                    </Button>
                    <Button variant="ghost" onClick={() => setPending(null)}>
                      Discard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function CelebrationPanel({
  result,
  onLogAnother,
}: {
  result: { seconds: number; isPb: boolean }
  onLogAnother: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border p-8 text-center',
        result.isPb ? 'border-accent/40 bg-accent/10' : 'border-secondary/30 bg-secondary/5',
      )}
    >
      {result.isPb ? (
        <>
          <Trophy className="h-12 w-12 text-accent" />
          <p className="mt-3 text-lg font-semibold text-accent">New personal best!</p>
        </>
      ) : (
        <>
          <Save className="h-12 w-12 text-secondary" />
          <p className="mt-3 text-lg font-semibold text-secondary">Time logged</p>
        </>
      )}
      <p className="mt-1 font-mono text-3xl font-semibold text-text-primary">
        {formatTime(result.seconds)}
      </p>
      <Button className="mt-5" leftIcon={<Plus className="h-4 w-4" />} onClick={onLogAnother}>
        Log another
      </Button>
    </div>
  )
}

// ---------------- Bulk entry mode ----------------

interface BulkRow {
  swimmerId: string
  stroke: Stroke
  distance: number
  raw: string
}

function emptyRow(swimmerId: string): BulkRow {
  return { swimmerId, stroke: 'freestyle', distance: 100, raw: '' }
}

function BulkMode({
  swimmers,
  sessions,
}: {
  swimmers: Swimmer[]
  sessions: { id: string; title: string; date: string }[]
}) {
  const logTime = useLogTime()
  const today = new Date().toISOString().slice(0, 10)
  const todaySessionId = sessions.find((s) => s.date === today)?.id ?? ''

  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: 4 }, () => emptyRow(swimmers[0]?.id ?? '')),
  )
  const [sessionId, setSessionId] = useState<string>(todaySessionId)
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  const update = (i: number, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const validRows = rows.filter((r) => r.swimmerId && parseTime(r.raw) != null)

  const saveAll = async () => {
    setSaving(true)
    setSavedCount(null)
    let count = 0
    for (const r of validRows) {
      const seconds = parseTime(r.raw)!
      await logTime.mutateAsync({
        swimmer_id: r.swimmerId,
        stroke: r.stroke,
        distance: r.distance,
        time_seconds: seconds,
        session_id: sessionId || null,
      })
      count++
    }
    setSavedCount(count)
    setRows(Array.from({ length: 4 }, () => emptyRow(swimmers[0]?.id ?? '')))
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader
        title="Bulk manual entry"
        subtitle="Type in times from a paper sheet after a session"
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setRows((prev) => [...prev, emptyRow(swimmers[0]?.id ?? '')])}
          >
            Add row
          </Button>
        }
      />

      <div className="mb-4">
        <SessionPicker sessions={sessions} value={sessionId} onChange={setSessionId} />
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((r, i) => {
          const invalid = r.raw.length > 0 && parseTime(r.raw) == null
          return (
            <div key={i} className="rounded-card border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-text-muted">#{i + 1}</span>
                <button
                  onClick={() => removeRow(i)}
                  className="rounded p-1 text-text-muted hover:text-danger"
                  aria-label={`Remove row ${i + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Select value={r.swimmerId} onChange={(e) => update(i, { swimmerId: e.target.value })}>
                {swimmers.map((s) => (
                  <option key={s.id} value={s.id}>{swimmerName(s)}</option>
                ))}
              </Select>
              <Select value={r.stroke} onChange={(e) => update(i, { stroke: e.target.value as Stroke })}>
                {STROKES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </Select>
              <Select value={r.distance} onChange={(e) => update(i, { distance: Number(e.target.value) })}>
                {DISTANCES.map((d) => (
                  <option key={d} value={d}>{d}m</option>
                ))}
              </Select>
              <Input
                placeholder="1:02.45"
                value={r.raw}
                onChange={(e) => update(i, { raw: e.target.value })}
                error={invalid ? 'Invalid' : undefined}
              />
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
              <th className="py-2 pr-3">Swimmer</th>
              <th className="py-2 pr-3">Stroke</th>
              <th className="py-2 pr-3">Distance</th>
              <th className="py-2 pr-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const invalid = r.raw.length > 0 && parseTime(r.raw) == null
              return (
                <tr key={i} className="border-b border-border">
                  <td className="py-2 pr-3">
                    <Select value={r.swimmerId} onChange={(e) => update(i, { swimmerId: e.target.value })}>
                      {swimmers.map((s) => (
                        <option key={s.id} value={s.id}>{swimmerName(s)}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Select value={r.stroke} onChange={(e) => update(i, { stroke: e.target.value as Stroke })}>
                      {STROKES.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Select value={r.distance} onChange={(e) => update(i, { distance: Number(e.target.value) })}>
                      {DISTANCES.map((d) => (
                        <option key={d} value={d}>{d}m</option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      placeholder="1:02.45"
                      value={r.raw}
                      onChange={(e) => update(i, { raw: e.target.value })}
                      error={invalid ? 'Invalid' : undefined}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button leftIcon={<Save className="h-4 w-4" />} loading={saving} disabled={validRows.length === 0} onClick={saveAll}>
          Save {validRows.length} time{validRows.length === 1 ? '' : 's'}
        </Button>
        {savedCount != null && (
          <span className="font-mono text-sm tabular-nums text-secondary">Saved {savedCount} times ✓</span>
        )}
      </div>
    </Card>
  )
}
