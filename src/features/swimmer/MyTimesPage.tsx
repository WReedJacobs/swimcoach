import { useMemo, useState } from 'react'
import { Timer, Trophy, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useTimes, useLogTime, useDeleteTime } from '@/hooks/useTimes'
import { formatTime, parseTime } from '@/lib/formatTime'
import { STROKES, DISTANCES } from '@/types'
import type { Stroke, SwimTime } from '@/types'

interface EventGroup {
  key: string
  distance: number
  stroke: string
  times: SwimTime[]
  pb: SwimTime | null
}

export function MyTimesPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: times } = useTimes(swimmer?.id)
  const logTime = useLogTime()
  const deleteTime = useDeleteTime()

  const [open, setOpen] = useState(false)
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState(100)
  const [raw, setRaw] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<SwimTime | null>(null)

  const groups = useMemo<EventGroup[]>(() => {
    const map = new Map<string, EventGroup>()
    for (const t of times ?? []) {
      const key = `${t.distance}-${t.stroke}`
      if (!map.has(key)) {
        map.set(key, { key, distance: t.distance, stroke: t.stroke, times: [], pb: null })
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
    return [...map.values()].sort((a, b) => a.distance - b.distance || a.stroke.localeCompare(b.stroke))
  }, [times])

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
      <SectionHeader
        kicker="Times"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={!swimmer}>
            Log a time
          </Button>
        }
      />

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon={<Timer className="h-6 w-6" />} title="No times yet" description="Log your first time to start tracking progress." />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.key}>
              <CardHeader
                title={`${g.distance}m ${g.stroke.charAt(0).toUpperCase()}${g.stroke.slice(1)}`}
                action={
                  g.pb ? (
                    <span className="flex items-center gap-1 rounded-component bg-accent/10 px-2.5 py-1 text-xs font-mono font-semibold tabular-nums text-accent">
                      <Trophy className="h-3 w-3" /> PB {formatTime(g.pb.time_seconds)}
                    </span>
                  ) : null
                }
              />
              <ul className="divide-y divide-border">
                {g.times.map((t) => (
                  <li key={t.id} className="group flex items-center justify-between py-2.5 text-sm">
                    <span className="font-mono text-xs tabular-nums text-text-muted">
                      {new Date(t.recorded_at).toLocaleDateString()}
                      {t.is_self_logged && ' · self-logged'}
                    </span>
                    <div className="flex items-center gap-2">
                      {t.is_pb && (
                        <Badge tone="amber">
                          <Trophy className="mr-1 h-3 w-3" /> PB
                        </Badge>
                      )}
                      <span className="font-mono font-medium text-text-primary">{formatTime(t.time_seconds)}</span>
                      <button
                        onClick={() => setConfirmDelete(t)}
                        className="hidden rounded p-1 text-text-muted hover:text-danger group-hover:flex"
                        title="Delete time"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

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

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete this time?">
        {confirmDelete && (
          <>
            <p className="text-sm text-text-secondary">
              {confirmDelete.distance}m {confirmDelete.stroke} — {formatTime(confirmDelete.time_seconds)} on{' '}
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
