import { useState } from 'react'
import { Timer, Trophy, Plus } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useTimes, useLogTime } from '@/hooks/useTimes'
import { formatTime, parseTime } from '@/lib/formatTime'
import { STROKES, DISTANCES } from '@/types'
import type { Stroke } from '@/types'

export function MyTimesPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: times } = useTimes(swimmer?.id)
  const logTime = useLogTime()

  const [open, setOpen] = useState(false)
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState(100)
  const [raw, setRaw] = useState('')

  const save = async () => {
    const seconds = parseTime(raw)
    if (seconds == null || !swimmer) return
    await logTime.mutateAsync({
      swimmer_id: swimmer.id,
      stroke,
      distance,
      time_seconds: seconds,
      is_self_logged: true,
    })
    setRaw('')
    setOpen(false)
  }

  return (
    <div className="space-y-8">
      <div>
      <SectionHeader
        kicker="Times"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={!swimmer}>
            Log a time
          </Button>
        }
      />

      <Card>
        <CardHeader title="My times" subtitle="Self-logged times are flagged for your coach" />
        {(times ?? []).length === 0 ? (
          <EmptyState icon={<Timer className="h-6 w-6" />} title="No times yet" description="Log your first time to start tracking progress." />
        ) : (
          <ul className="divide-y divide-border">
            {(times ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-medium capitalize text-text-primary">{t.distance}m {t.stroke}</span>
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
          <Input
            label="Time"
            placeholder="1:02.45 or 47.32"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            error={raw.length > 0 && parseTime(raw) == null ? 'Invalid time' : undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={logTime.isPending} disabled={parseTime(raw) == null} onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
