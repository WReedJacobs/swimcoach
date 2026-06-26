import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, BookOpen, Gauge } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useCreateSession } from '@/hooks/useSessions'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useDrills } from '@/hooks/useDrills'
import { swimmerName, DISTANCES } from '@/types'
import type { SessionType } from '@/types'
import { formatTime, parseTime } from '@/lib/formatTime'
import { buildSetTarget } from '@/lib/cssCalculator'

export function SessionBuilder() {
  const navigate = useNavigate()
  const createSession = useCreateSession()
  const { data: swimmers } = useSwimmers()
  const { data: drills } = useDrills()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<SessionType>('training')
  const [warmUp, setWarmUp] = useState('')
  const [mainSet, setMainSet] = useState('')
  const [coolDown, setCoolDown] = useState('')
  const [notes, setNotes] = useState('')
  const [assigned, setAssigned] = useState<string[]>([])
  const [drillPicker, setDrillPicker] = useState<null | 'warm_up' | 'cool_down'>(null)

  // Pace-aware set calculator: turn a CSS pace into a formatted, send-off
  // line that gets appended to the main set.
  const [paceOpen, setPaceOpen] = useState(false)
  const [cssPace, setCssPace] = useState('1:30')
  const [reps, setReps] = useState(8)
  const [setDistance, setSetDistance] = useState(100)
  const [offset, setOffset] = useState(2)
  const [rest, setRest] = useState(15)

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
            <CardHeader title="Session details" />
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

          <Button className="w-full" size="lg" leftIcon={<Save className="h-5 w-5" />} loading={createSession.isPending} disabled={!title.trim()} onClick={save}>
            Save session
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
