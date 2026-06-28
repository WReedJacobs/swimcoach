import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, BookOpen, Gauge, Repeat2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { useCreateSession, useUpdateSession, useSession, useSessionAssignments } from '@/hooks/useSessions'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useDrills } from '@/hooks/useDrills'
import { useAuth } from '@/hooks/useAuth'
import { swimmerName, DISTANCES } from '@/types'
import type { SessionType, Recurrence } from '@/types'
import { formatTime, parseTime } from '@/lib/formatTime'
import { buildSetTarget } from '@/lib/cssCalculator'

function generateDates(start: string, pattern: Exclude<Recurrence, 'none'>, end: string): string[] {
  const startD = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  const dates: string[] = []
  const d = new Date(startD)
  if (pattern === 'weekly') {
    while (d <= endD) {
      dates.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 7)
    }
  } else if (pattern === 'mwf') {
    while (d <= endD) {
      const dow = d.getDay()
      if (dow === 1 || dow === 3 || dow === 5) dates.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
  } else if (pattern === 'daily') {
    while (d <= endD) {
      dates.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
  }
  return dates
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

export function SessionBuilder() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(sessionId)
  const { user } = useAuth()

  const createSession = useCreateSession()
  const updateSession = useUpdateSession()
  const { data: swimmers } = useSwimmers()
  const { data: drills } = useDrills()
  const { data: existingSession } = useSession(sessionId)
  const { data: existingAssigned } = useSessionAssignments(sessionId)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<SessionType>('training')
  const [warmUp, setWarmUp] = useState('')
  const [mainSet, setMainSet] = useState('')
  const [coolDown, setCoolDown] = useState('')
  const [notes, setNotes] = useState('')
  const [assigned, setAssigned] = useState<string[]>([])
  const [drillPicker, setDrillPicker] = useState<null | 'warm_up' | 'cool_down'>(null)

  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [recurrenceEnd, setRecurrenceEnd] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [paceOpen, setPaceOpen] = useState(false)
  const [cssPace, setCssPace] = useState('1:30')
  const [reps, setReps] = useState(8)
  const [setDistance, setSetDistance] = useState(100)
  const [offset, setOffset] = useState(2)
  const [rest, setRest] = useState(15)

  // Pre-fill form when editing an existing session
  useEffect(() => {
    if (existingSession) {
      setTitle(existingSession.title)
      setDate(existingSession.date)
      setType(existingSession.type)
      setWarmUp(existingSession.warm_up ?? '')
      setMainSet(existingSession.main_set ?? '')
      setCoolDown(existingSession.cool_down ?? '')
      setNotes(existingSession.notes ?? '')
    }
  }, [existingSession])

  // Pre-fill from booking query params (date + swimmerId)
  useEffect(() => {
    const prefillDate = searchParams.get('date')
    const prefillSwimmer = searchParams.get('swimmerId')
    if (prefillDate) setDate(prefillDate)
    if (prefillSwimmer) setAssigned([prefillSwimmer])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (existingAssigned) {
      setAssigned(existingAssigned)
    }
  }, [existingAssigned])

  // Default recurrence_end to 8 weeks out when enabling recurrence
  useEffect(() => {
    if (recurrence !== 'none' && !recurrenceEnd) {
      setRecurrenceEnd(addWeeks(date, 8))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurrence])

  const previewDates = useMemo(() => {
    if (recurrence === 'none' || !recurrenceEnd) return null
    return generateDates(date, recurrence, recurrenceEnd)
  }, [recurrence, date, recurrenceEnd])

  const cssSeconds = parseTime(cssPace)
  const previewSet =
    cssSeconds != null ? buildSetTarget(cssSeconds, reps, setDistance, offset, rest) : null
  const offsetLabel = offset > 0 ? `CSS+${offset}` : offset === 0 ? 'CSS' : `CSS${offset}`

  const insertPaceSet = () => {
    if (!previewSet) return
    const line = `${previewSet.reps} × ${previewSet.distance}m @ ${formatTime(
      previewSet.repSeconds,
    )} (${offsetLabel}) on ${formatTime(previewSet.sendOffSeconds)}`
    setMainSet((p) => (p ? `${p}\n${line}` : line))
    setPaceOpen(false)
  }

  const toggleSwimmer = (id: string) =>
    setAssigned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const insertDrill = (text: string) => {
    if (drillPicker === 'warm_up') setWarmUp((p) => (p ? `${p}\n${text}` : text))
    else if (drillPicker === 'cool_down') setCoolDown((p) => (p ? `${p}\n${text}` : text))
    setDrillPicker(null)
  }

  const save = async () => {
    if (!title.trim()) return

    if (isEditing && sessionId) {
      await updateSession.mutateAsync({
        id: sessionId,
        title,
        date,
        type,
        warm_up: warmUp,
        main_set: mainSet,
        cool_down: coolDown,
        notes,
        swimmerIds: assigned,
      })
      navigate('/coach/sessions')
      return
    }

    // Recurring: bulk-insert all sessions in a single call
    if (recurrence !== 'none' && recurrenceEnd && previewDates && previewDates.length > 0) {
      setIsSaving(true)
      try {
        const rows = previewDates.map((d) => ({
          coach_id: user!.id,
          title,
          date: d,
          type,
          recurrence,
          recurrence_end: recurrenceEnd,
          warm_up: warmUp || null,
          main_set: mainSet || null,
          cool_down: coolDown || null,
          notes: notes || null,
        }))
        const { data, error } = await supabase.from('sessions').insert(rows).select('id')
        if (error) throw error
        if (assigned.length > 0 && data) {
          const assignmentRows = (data as { id: string }[]).flatMap((s) =>
            assigned.map((swimmer_id) => ({ session_id: s.id, swimmer_id }))
          )
          const { error: assignErr } = await supabase.from('session_assignments').insert(assignmentRows)
          if (assignErr) throw assignErr
        }
      } finally {
        setIsSaving(false)
      }
      navigate('/coach/sessions')
      return
    }

    await createSession.mutateAsync({
      title,
      date,
      type,
      warm_up: warmUp,
      main_set: mainSet,
      cool_down: coolDown,
      notes,
      swimmerIds: assigned,
    })
    navigate('/coach/sessions')
  }

  const isPending = createSession.isPending || updateSession.isPending || isSaving

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/coach/sessions')}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={isEditing ? 'Edit session' : 'Session details'} />
            <div className="space-y-4">
              <Input label="Title" placeholder="Threshold Friday" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Select label="Type" value={type} onChange={(e) => setType(e.target.value as SessionType)}>
                  <option value="training">Training</option>
                  <option value="race">Race</option>
                  <option value="dryland">Dryland</option>
                </Select>
              </div>

              {!isEditing && (
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Repeat"
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="mwf">Mon – Wed – Fri</option>
                    <option value="daily">Daily</option>
                  </Select>
                  {recurrence !== 'none' && (
                    <Input
                      label="Repeat until"
                      type="date"
                      value={recurrenceEnd}
                      onChange={(e) => setRecurrenceEnd(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="The set" subtitle="Use the drill library for warm-up and cool-down ideas" />
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Warm-up</label>
                  <Button variant="ghost" size="sm" leftIcon={<BookOpen className="h-4 w-4" />} onClick={() => setDrillPicker('warm_up')}>
                    Add drill
                  </Button>
                </div>
                <Textarea placeholder="400m easy free, 200m kick" value={warmUp} onChange={(e) => setWarmUp(e.target.value)} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Main set</label>
                  <Button variant="ghost" size="sm" leftIcon={<Gauge className="h-4 w-4" />} onClick={() => setPaceOpen(true)}>
                    Pace set
                  </Button>
                </div>
                <Textarea
                  placeholder="8 × 50m on 1:20"
                  value={mainSet}
                  onChange={(e) => setMainSet(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Cool-down</label>
                  <Button variant="ghost" size="sm" leftIcon={<BookOpen className="h-4 w-4" />} onClick={() => setDrillPicker('cool_down')}>
                    Add drill
                  </Button>
                </div>
                <Textarea placeholder="200m easy backstroke" value={coolDown} onChange={(e) => setCoolDown(e.target.value)} />
              </div>
              <Textarea label="Notes" placeholder="Focus area, intentions…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Assign to" subtitle={`${assigned.length} selected`} />
            {(swimmers ?? []).length === 0 ? (
              <p className="text-sm text-text-muted">No swimmers to assign yet.</p>
            ) : (
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {(swimmers ?? []).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSwimmer(s.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-component px-3 py-2 text-sm',
                      assigned.includes(s.id) ? 'bg-primary/10 text-primary-dark' : 'hover:bg-bg',
                    )}
                  >
                    <span>{swimmerName(s)}</span>
                    <input type="checkbox" readOnly checked={assigned.includes(s.id)} />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {previewDates && previewDates.length > 0 && (
            <div className="flex items-center gap-2 rounded-component border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-text-secondary">
              <Repeat2 className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Will create{' '}
                <span className="font-mono font-semibold text-text-primary">{previewDates.length}</span>{' '}
                session{previewDates.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <Button className="w-full" size="lg" leftIcon={<Save className="h-5 w-5" />} loading={isPending} disabled={!title.trim()} onClick={save}>
            {isEditing
              ? 'Update session'
              : previewDates && previewDates.length > 1
              ? `Save ${previewDates.length} sessions`
              : 'Save session'}
          </Button>
        </div>
      </div>

      <Modal open={drillPicker !== null} onClose={() => setDrillPicker(null)} title="Pick a drill">
        <div className="space-y-2">
          {(drills ?? []).map((d) => (
            <button
              key={d.id}
              onClick={() => insertDrill(d.title)}
              className="block w-full rounded-component border border-border p-3 text-left text-sm hover:bg-bg"
            >
              <p className="font-medium text-text-primary">{d.title}</p>
              <p className="text-text-secondary">{d.description_plain}</p>
            </button>
          ))}
          {(drills ?? []).length === 0 && <p className="text-sm text-text-muted">No drills available.</p>}
        </div>
      </Modal>

      <Modal open={paceOpen} onClose={() => setPaceOpen(false)} title="Pace set calculator">
        <div className="space-y-4">
          <Input
            label="Swimmer's CSS pace (per 100m)"
            placeholder="1:30"
            value={cssPace}
            onChange={(e) => setCssPace(e.target.value)}
            hint="From the swimmer's CSS test"
            error={cssPace.length > 0 && cssSeconds == null ? 'Invalid time' : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Reps" type="number" min={1} value={reps} onChange={(e) => setReps(Math.max(1, Number(e.target.value)))} />
            <Select label="Distance" value={setDistance} onChange={(e) => setSetDistance(Number(e.target.value))}>
              {DISTANCES.map((d) => (
                <option key={d} value={d}>{d}m</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pace offset (s/100, vs CSS)" type="number" value={offset} onChange={(e) => setOffset(Number(e.target.value))} hint="+ easier · − faster" />
            <Input label="Rest (s)" type="number" min={0} value={rest} onChange={(e) => setRest(Math.max(0, Number(e.target.value)))} />
          </div>
          <div className="rounded-component bg-bg p-3 text-sm">
            {previewSet ? (
              <p className="text-text-primary">
                <span className="font-semibold">{previewSet.reps} × {previewSet.distance}m</span> @{' '}
                {formatTime(previewSet.repSeconds)} ({offsetLabel}) — leave on{' '}
                <span className="font-semibold">{formatTime(previewSet.sendOffSeconds)}</span>
              </p>
            ) : (
              <p className="text-text-muted">Enter a valid CSS pace to preview the set.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPaceOpen(false)}>Cancel</Button>
            <Button disabled={!previewSet} onClick={insertPaceSet}>Add to main set</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
