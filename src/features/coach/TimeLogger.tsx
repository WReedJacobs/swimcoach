import { useMemo, useState } from 'react'
import { Trophy, Save, Plus, Timer, Table, Search } from 'lucide-react'
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
import { useLogTime } from '@/hooks/useTimes'
import { STROKES, DISTANCES, swimmerName } from '@/types'
import type { Stroke, Swimmer } from '@/types'

type Mode = 'stopwatch' | 'bulk'

export function TimeLogger() {
  const { data: swimmers, isLoading } = useSwimmers()
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
        <StopwatchMode swimmers={swimmers} />
      ) : (
        <BulkMode swimmers={swimmers} />
      )}
    </div>
  )
}

// ---------------- Stopwatch mode ----------------

function StopwatchMode({ swimmers }: { swimmers: Swimmer[] }) {
  const logTime = useLogTime()
  const [search, setSearch] = useState('')
  const [swimmerId, setSwimmerId] = useState<string>(swimmers[0]?.id ?? '')
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState<number>(100)

  const [pending, setPending] = useState<number | null>(null) // seconds awaiting confirm
  const [manual, setManual] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<{ seconds: number; isPb: boolean } | null>(null)

  const filtered = useMemo(
    () =>
      swimmers.filter((s) =>
        swimmerName(s).toLowerCase().includes(search.toLowerCase()),
      ),
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
      notes,
    })
    setResult({ seconds: pending, isPb: res.isPb })
    setPending(null)
    setNotes('')
    setManual('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Left: selectors */}
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

          <Select label="Stroke" value={stroke} onChange={(e) => setStroke(e.target.value as Stroke)}>
            {STROKES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>

          <Select
            label="Distance (m)"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
          >
            {DISTANCES.map((d) => (
              <option key={d} value={d}>
                {d}m
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Right: stopwatch + confirm */}
      <Card>
        <CardHeader
          title="Timer"
          subtitle={selected ? `${swimmerName(selected)} · ${distance}m ${stroke}` : 'Select a swimmer'}
        />

        {result ? (
          <CelebrationPanel
            result={result}
            onLogAnother={() => setResult(null)}
          />
        ) : (
          <div className="space-y-6">
            <Stopwatch onStop={(seconds) => beginConfirm(seconds)} />

            {/* Manual override */}
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

function BulkMode({ swimmers }: { swimmers: Swimmer[] }) {
  const logTime = useLogTime()
  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: 4 }, () => emptyRow(swimmers[0]?.id ?? '')),
  )
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  const update = (i: number, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

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

      <div className="overflow-x-auto">
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
                        <option key={s.id} value={s.id}>
                          {swimmerName(s)}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Select value={r.stroke} onChange={(e) => update(i, { stroke: e.target.value as Stroke })}>
                      {STROKES.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Select value={r.distance} onChange={(e) => update(i, { distance: Number(e.target.value) })}>
                      {DISTANCES.map((d) => (
                        <option key={d} value={d}>
                          {d}m
                        </option>
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
