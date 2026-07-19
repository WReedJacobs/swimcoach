import { useMemo, useRef, useState } from 'react'
import { Timer, Trophy, Plus, Trash2, Download, Upload, ChevronDown, ChevronRight, Flag, Save } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { RpeSelector } from '@/components/ui/RpeSelector'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useEnsureMySwimmerRow } from '@/hooks/useEnsureMySwimmerRow'
import { useTimes, useSplits, useLogTime, useDeleteTime } from '@/hooks/useTimes'
import { useStravaSessions, useUpdateStravaSessionNotes, type StravaSession } from '@/hooks/useStrava'
import { formatTime, formatStopwatch, parseTime } from '@/lib/formatTime'
import { timesToCsv, downloadCsv, parseCsvTimes } from '@/lib/csvUtils'
import { STROKES, DISTANCES, COURSES, COURSE_LABELS } from '@/types'
import type { Stroke, Course, SwimTime } from '@/types'

/** One Strava-imported session: shows the auto-generated stats summary
 * (main_set, read-only) plus an editable box for what was actually done —
 * Strava only knows total distance/time, not the real sets/stroke. */
function ImportedSessionRow({ session }: { session: StravaSession }) {
  const update = useUpdateStravaSessionNotes()
  const [notes, setNotes] = useState(session.notes ?? '')
  const dirty = notes !== (session.notes ?? '')

  return (
    <div className="space-y-2 rounded-component border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-text-primary">{session.title}</p>
          <p className="font-mono text-xs text-text-muted">
            {new Date(session.date).toLocaleDateString()} · {session.main_set}
          </p>
        </div>
      </div>
      <Textarea
        placeholder="What did you actually do? e.g. 8×100 freestyle on 1:30, then a 400 pull…"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            leftIcon={<Save className="h-3.5 w-3.5" />}
            loading={update.isPending}
            onClick={() => update.mutate({ id: session.id, notes })}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  )
}

/** Recent Strava-synced swims — hidden entirely once there's nothing to show. */
function StravaImportsCard() {
  const { data: sessions } = useStravaSessions()
  if (!sessions || sessions.length === 0) return null

  return (
    <Card>
      <CardHeader
        title="Recent imports"
        subtitle="Synced from Strava — add what you actually did."
      />
      <div className="space-y-3">
        {sessions.map((s) => (
          <ImportedSessionRow key={s.id} session={s} />
        ))}
      </div>
    </Card>
  )
}

const PAGE_SIZE = 5

interface EventGroup {
  key: string
  distance: number
  stroke: string
  course: Course
  times: SwimTime[]
  pb: SwimTime | null
}

function SplitsPanel({ timeId }: { timeId: string }) {
  const { data: splits, isLoading } = useSplits(timeId)
  if (isLoading) return <p className="py-1 text-xs text-text-muted">Loading splits…</p>
  if (!splits || splits.length === 0)
    return <p className="py-1 text-xs text-text-muted">No lap splits recorded</p>
  return (
    <ol className="mt-1 space-y-0.5 pl-2">
      {splits.map((s) => (
        <li key={s.id} className="flex items-center gap-2 text-xs text-text-secondary">
          <Flag className="h-3 w-3 shrink-0 text-text-muted" />
          <span>Lap {s.lap_number}</span>
          <span className="font-mono tabular-nums">{formatStopwatch(s.split_seconds * 1000)}</span>
        </li>
      ))}
    </ol>
  )
}

function TimeRow({
  time: t,
  expanded,
  onToggleExpand,
  onDelete,
}: {
  time: SwimTime
  expanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
}) {
  return (
    <li className="group py-2.5 text-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 font-mono text-xs tabular-nums text-text-muted hover:text-text-primary focus:outline-none"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse lap splits' : 'Expand lap splits'}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {new Date(t.recorded_at).toLocaleDateString()}
          {t.is_self_logged && ' · self-logged'}
        </button>
        <div className="flex items-center gap-2">
          {t.is_pb && (
            <Badge tone="amber">
              <Trophy className="mr-1 h-3 w-3" />
              PB
            </Badge>
          )}
          <span className="font-mono font-medium text-text-primary">{formatTime(t.time_seconds)}</span>
          <button
            onClick={onDelete}
            className="hidden rounded p-1 text-text-muted hover:text-danger group-hover:flex"
            aria-label="Delete time"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-1 pl-4">
          <SplitsPanel timeId={t.id} />
        </div>
      )}
    </li>
  )
}

export function MyTimesPage() {
  useEnsureMySwimmerRow()
  const { data: swimmer } = useMySwimmer()
  const { data: times } = useTimes(swimmer?.id)
  const logTime = useLogTime()
  const deleteTime = useDeleteTime()
  const importRef = useRef<HTMLInputElement>(null)

  // Log modal
  const [open, setOpen] = useState(false)
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState(100)
  const [course, setCourse] = useState<Course>('SCM')
  const [raw, setRaw] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)

  // Filters + pagination
  const [filterCourse, setFilterCourse] = useState<Course | ''>('')
  const [page, setPage] = useState(0)

  const [confirmDelete, setConfirmDelete] = useState<SwimTime | null>(null)
  const [expandedTimeId, setExpandedTimeId] = useState<string | null>(null)

  // Import state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const groups = useMemo<EventGroup[]>(() => {
    const map = new Map<string, EventGroup>()
    for (const t of times ?? []) {
      const c: Course = t.course ?? 'SCM'
      if (filterCourse && c !== filterCourse) continue
      const key = `${t.distance}-${t.stroke}-${c}`
      if (!map.has(key)) {
        map.set(key, { key, distance: t.distance, stroke: t.stroke, course: c, times: [], pb: null })
      }
      const g = map.get(key)!
      g.times.push(t)
    }
    for (const g of map.values()) {
      g.pb = g.times.reduce<SwimTime | null>(
        (best, t) => (!best || t.time_seconds < best.time_seconds ? t : best),
        null,
      )
    }
    return [...map.values()].sort(
      (a, b) => a.distance - b.distance || a.stroke.localeCompare(b.stroke),
    )
  }, [times, filterCourse])

  const visibleGroups = groups.slice(0, (page + 1) * PAGE_SIZE)
  const hasMore = visibleGroups.length < groups.length

  const save = async () => {
    const seconds = parseTime(raw)
    if (seconds == null || !swimmer) return
    await logTime.mutateAsync({
      swimmer_id: swimmer.id,
      stroke,
      distance,
      course,
      time_seconds: seconds,
      is_self_logged: true,
      rpe,
    })
    setRaw('')
    setRpe(null)
    setOpen(false)
  }

  const handleExport = () => {
    if (!times?.length) return
    downloadCsv(timesToCsv(times), `my-times-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !swimmer) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const rows = parseCsvTimes(text)
      if (rows.length === 0) {
        setImportResult('No valid rows found. Check the CSV format.')
        return
      }
      let count = 0
      for (const r of rows) {
        await logTime.mutateAsync({
          swimmer_id: swimmer.id,
          stroke: r.stroke,
          distance: r.distance,
          time_seconds: r.time_seconds,
          course: r.course,
          notes: r.notes,
          is_self_logged: true,
        })
        count++
      }
      setImportResult(`Imported ${count} time${count !== 1 ? 's' : ''} successfully.`)
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (importRef.current) importRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Times"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              disabled={!times?.length}
              aria-label="Export times as CSV"
            >
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              loading={importing}
              onClick={() => importRef.current?.click()}
              aria-label="Import times from CSV"
            >
              Import
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImport}
              aria-hidden="true"
            />
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={!swimmer}>
              Log a time
            </Button>
            {!swimmer && (
              <span className="font-mono text-xs text-text-muted">Setting up profile…</span>
            )}
          </div>
        }
      />

      {importResult && (
        <p className={`text-sm ${importResult.includes('successfully') ? 'text-secondary' : 'text-danger'}`}>
          {importResult}
        </p>
      )}

      <StravaImportsCard />

      {/* Course filter */}
      <Select
        value={filterCourse}
        onChange={(e) => { setFilterCourse(e.target.value as Course | ''); setPage(0) }}
        className="w-52"
        aria-label="Filter by pool course"
      >
        <option value="">All courses</option>
        {COURSES.map((c) => (
          <option key={c} value={c}>{c} — {COURSE_LABELS[c]}</option>
        ))}
      </Select>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Timer className="h-6 w-6" />}
            title="No times yet"
            description="Log your first time to start tracking progress."
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {visibleGroups.map((g) => (
              <Card key={g.key}>
                <CardHeader
                  title={`${g.distance}m ${g.stroke.charAt(0).toUpperCase()}${g.stroke.slice(1)}`}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone="blue">{g.course}</Badge>
                      {g.pb && (
                        <span className="flex items-center gap-1 rounded-component bg-accent/10 px-2.5 py-1 text-xs font-mono font-semibold tabular-nums text-accent">
                          <Trophy className="h-3 w-3" />
                          PB {formatTime(g.pb.time_seconds)}
                        </span>
                      )}
                    </div>
                  }
                />
                <ul className="divide-y divide-border">
                  {g.times.map((t) => (
                    <TimeRow
                      key={t.id}
                      time={t}
                      expanded={expandedTimeId === t.id}
                      onToggleExpand={() =>
                        setExpandedTimeId((prev) => (prev === t.id ? null : t.id))
                      }
                      onDelete={() => setConfirmDelete(t)}
                    />
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                leftIcon={<ChevronDown className="h-4 w-4" />}
                onClick={() => setPage((p) => p + 1)}
              >
                Show more ({groups.length - visibleGroups.length} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Log time modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Log a time">
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
          <Select label="Pool course" value={course} onChange={(e) => setCourse(e.target.value as Course)}>
            {COURSES.map((c) => (
              <option key={c} value={c}>{c} — {COURSE_LABELS[c]}</option>
            ))}
          </Select>
          <Input
            label="Time"
            placeholder="1:02.45 or 47.32"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            error={raw.length > 0 && parseTime(raw) == null ? 'Invalid time' : undefined}
          />
          <RpeSelector value={rpe} onChange={setRpe} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={logTime.isPending} disabled={parseTime(raw) == null} onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete this time?">
        {confirmDelete && (
          <>
            <p className="text-sm text-text-secondary">
              {confirmDelete.distance}m {confirmDelete.stroke} ({confirmDelete.course ?? 'SCM'}) —{' '}
              {formatTime(confirmDelete.time_seconds)} on{' '}
              {new Date(confirmDelete.recorded_at).toLocaleDateString()}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteTime.isPending}
                onClick={async () => {
                  await deleteTime.mutateAsync(confirmDelete.id)
                  setConfirmDelete(null)
                }}
              >
                Delete
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
