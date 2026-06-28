import { useState, useEffect } from 'react'
import { Timer, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { BeginnerTip } from '@/components/ui/BeginnerTip'
import { formatTime, parseTime } from '@/lib/formatTime'
import { STROKES, DISTANCES } from '@/types'
import { useBeginnerLogs } from './beginnerStore'
import { useJourneyStore } from '@/store/beginnerJourneyStore'

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

export function SelfLogPage() {
  const [logs, setLogs] = useBeginnerLogs()
  const { markStep } = useJourneyStore()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [stroke, setStroke] = useState<string>('freestyle')
  const [distance, setDistance] = useState(25)
  const [raw, setRaw] = useState('')

  const valid = parseTime(raw) != null

  // Auto-mark journey steps based on log data
  useEffect(() => {
    if (!logs.length) return
    // first_log
    markStep('first_log')
    // timed_swim — all logs have timeSeconds (field always present)
    markStep('timed_swim')
    // one_km
    const totalM = logs.reduce((s, l) => s + l.distance, 0)
    if (totalM >= 1000) markStep('one_km')
    // three_swims in one week
    const weekCounts = new Map<string, number>()
    for (const l of logs) {
      const w = isoWeek(l.date)
      weekCounts.set(w, (weekCounts.get(w) ?? 0) + 1)
    }
    if ([...weekCounts.values()].some((c) => c >= 3)) markStep('three_swims')
  }, [logs, markStep])

  const add = () => {
    const seconds = parseTime(raw)
    if (seconds == null) return
    setLogs((prev) => [
      { id: `${date}-${Math.round(seconds * 100)}-${prev.length}`, date, stroke, distance, timeSeconds: seconds },
      ...prev,
    ])
    setRaw('')
  }

  const remove = (id: string) => setLogs((prev) => prev.filter((l) => l.id !== id))

  return (
    <div className="space-y-8">
    <BeginnerTip
      stepId="first_log"
      tip="Log anything — even a 200m casual swim counts. The habit of recording is what matters."
    />
    <SectionHeader kicker="Log" />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Log a swim" subtitle="Your swims are saved on this device. Create a free account to back them up." />
        <div className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Stroke" value={stroke} onChange={(e) => setStroke(e.target.value)}>
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
            error={raw.length > 0 && !valid ? 'Invalid time' : undefined}
          />
          <Button accent="coral" className="w-full" disabled={!valid} onClick={add}>
            Save swim
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Your swims" />
        {logs.length === 0 ? (
          <EmptyState icon={<Timer className="h-6 w-6" />} title="No swims logged yet" description="Your logged swims will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-medium capitalize text-text-primary">{l.distance}m {l.stroke}</span>
                  <span className="ml-2 text-xs text-text-muted font-mono tabular-nums">{new Date(l.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums font-medium text-text-primary">{formatTime(l.timeSeconds)}</span>
                  <button onClick={() => remove(l.id)} className="text-text-muted hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>

    {logs.length > 0 && (
      <Card className="border-coral/30 bg-coral/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-text-primary">Back up your swims</p>
            <p className="text-sm text-text-secondary">
              Create a free account to save your progress across devices and connect with a coach.
            </p>
          </div>
          <Link to="/start">
            <Button accent="coral" size="sm">Get started</Button>
          </Link>
        </div>
      </Card>
    )}
    </div>
  )
}
