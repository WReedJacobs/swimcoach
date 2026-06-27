import { useState } from 'react'
import { CalendarDays, Plus, Trophy } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SessionBlocks } from '@/components/SessionBlocks'
import { useMySwimmer, useAssignedSessions } from '@/hooks/useMySwimmer'
import { useLogTime } from '@/hooks/useTimes'
import { parseTime } from '@/lib/formatTime'
import { STROKES, DISTANCES } from '@/types'
import type { Session, Stroke } from '@/types'

function LogTimePanel({ session, swimmerId, onDone }: { session: Session; swimmerId: string; onDone: () => void }) {
  const logTime = useLogTime()
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState(100)
  const [raw, setRaw] = useState('')

  const save = async () => {
    const seconds = parseTime(raw)
    if (seconds == null) return
    const result = await logTime.mutateAsync({
      swimmer_id: swimmerId,
      stroke,
      distance,
      time_seconds: seconds,
      session_id: session.id,
      is_self_logged: true,
    })
    setRaw('')
    if (result.isPb) onDone()
    else onDone()
  }

  return (
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
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button loading={logTime.isPending} disabled={parseTime(raw) == null} onClick={save}>
          Save time
        </Button>
      </div>
    </div>
  )
}

export function TodaySessionPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: sessions } = useAssignedSessions(swimmer?.id)
  const today = new Date().toISOString().slice(0, 10)
  const todaySession = (sessions ?? []).find((s) => s.date === today) ?? null
  const upcoming = (sessions ?? []).filter((s) => s.date > today).reverse()

  const [logOpen, setLogOpen] = useState(false)
  const [pbFlash, setPbFlash] = useState(false)

  const handleDone = () => {
    setLogOpen(false)
    setPbFlash(true)
    setTimeout(() => setPbFlash(false), 3000)
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader kicker="Today" />
        <Card>
          <CardHeader
            title="Today"
            action={
              todaySession && swimmer ? (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setLogOpen(true)}
                >
                  Log time
                </Button>
              ) : null
            }
          />
          {pbFlash && (
            <div className="mb-3 flex items-center gap-2 rounded-component bg-secondary/10 px-3 py-2 text-sm text-secondary">
              <Trophy className="h-4 w-4" /> Time saved!
            </div>
          )}
          {todaySession ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">{todaySession.title}</h3>
                <Badge tone="blue" className="capitalize">{todaySession.type}</Badge>
              </div>
              <SessionBlocks session={todaySession} />
              {todaySession.notes && (
                <p className="rounded-component bg-bg p-3 text-sm text-text-secondary">{todaySession.notes}</p>
              )}
            </div>
          ) : (
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No session scheduled today" />
          )}
        </Card>
      </div>

      {upcoming.length > 0 && (
        <div>
          <SectionHeader kicker="Coming up" />
          <Card>
            <CardHeader title="Coming up" />
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-component bg-bg p-3 text-sm">
                  <span className="font-medium text-text-primary">{s.title}</span>
                  <span className="font-mono tabular-nums text-text-secondary">{new Date(s.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {todaySession && swimmer && (
        <Modal open={logOpen} onClose={() => setLogOpen(false)} title={`Log time for ${todaySession.title}`}>
          <LogTimePanel session={todaySession} swimmerId={swimmer.id} onDone={handleDone} />
        </Modal>
      )}
    </div>
  )
}
