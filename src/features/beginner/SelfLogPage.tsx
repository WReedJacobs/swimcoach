import { useState, useEffect } from 'react'
import { Timer, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { BeginnerTip } from '@/components/ui/BeginnerTip'
import { cn } from '@/lib/cn'
import { formatTime, parseTime } from '@/lib/formatTime'
import { localDateStr } from '@/lib/dateLocal'
import { useBeginnerLogs } from './beginnerStore'
import { useJourneyStore } from '@/store/beginnerJourneyStore'

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

const POOL_SIZES = [
  { meters: 25, label: '25m', hint: 'most local pools' },
  { meters: 50, label: '50m', hint: 'Olympic / outdoor' },
]

export function SelfLogPage() {
  const [logs, setLogs] = useBeginnerLogs()
  const { markStep } = useJourneyStore()
  const [date, setDate] = useState(localDateStr())
  const [poolSize, setPoolSize] = useState(25)
  const [laps, setLaps] = useState('')
  const [raw, setRaw] = useState('')

  const lapCount = parseInt(laps, 10)
  const distance = !isNaN(lapCount) && lapCount > 0 ? lapCount * poolSize : 0
  const valid = parseTime(raw) != null && distance > 0

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
    if (seconds == null || distance <= 0) return
    setLogs((prev) => [
      { id: `${date}-${Math.round(seconds * 100)}-${prev.length}`, date, stroke: 'freestyle', distance, timeSeconds: seconds },
      ...prev,
    ])
    setRaw('')
    setLaps('')
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

          {/* Pool size */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-text-primary">Pool length</p>
            <div className="grid grid-cols-2 gap-2">
              {POOL_SIZES.map(({ meters, label, hint }) => (
                <button
                  key={meters}
                  type="button"
                  onClick={() => setPoolSize(meters)}
                  className={cn(
                    'rounded-component border px-3 py-2.5 text-left transition-colors',
                    poolSize === meters
                      ? 'border-coral/50 bg-coral/10'
                      : 'border-border bg-bg hover:border-border/80',
                  )}
                >
                  <p className={cn('font-mono font-semibold tabular-nums', poolSize === meters ? 'text-coral' : 'text-text-primary')}>
                    {label}
                  </p>
                  <p className="text-[11px] text-text-muted">{hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Laps */}
          <div>
            <Input
              label="How many laps did you swim?"
              type="number"
              min={1}
              placeholder="e.g. 28"
              value={laps}
              onChange={(e) => setLaps(e.target.value)}
              hint={distance > 0 ? `${lapCount} laps × ${poolSize}m = ${distance}m total` : undefined}
            />
          </div>

          {/* Time */}
          <Input
            label="How long did it take? (optional hint: mm:ss)"
            placeholder="e.g. 25:30"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            error={raw.length > 0 && parseTime(raw) == null ? 'Try a format like 25:30 or 18:04.5' : undefined}
          />

          <Button accent="coral" className="w-full" disabled={!valid} waterEffect="splash" onClick={add}>
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
                  <span className="font-medium text-text-primary font-mono tabular-nums">{l.distance}m</span>
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
