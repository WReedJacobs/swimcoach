import { useState } from 'react'
import { Timer, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTime, parseTime } from '@/lib/formatTime'
import { STROKES, DISTANCES } from '@/types'
import { useBeginnerLogs } from './beginnerStore'

export function SelfLogPage() {
  const [logs, setLogs] = useBeginnerLogs()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [stroke, setStroke] = useState<string>('freestyle')
  const [distance, setDistance] = useState(25)
  const [raw, setRaw] = useState('')

  const valid = parseTime(raw) != null

  const add = () => {
    const seconds = parseTime(raw)
    if (seconds == null) return
    setLogs((prev) => [
      // No crypto/Date.now constraints here — this is app runtime, not a workflow.
      { id: `${date}-${Math.round(seconds * 100)}-${prev.length}`, date, stroke, distance, timeSeconds: seconds },
      ...prev,
    ])
    setRaw('')
  }

  const remove = (id: string) => setLogs((prev) => prev.filter((l) => l.id !== id))

  return (
    <div className="space-y-8">
    <SectionHeader kicker="Log" />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Log a swim" subtitle="Saved on this device. Sign in later to sync." />
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
    </div>
  )
}
