import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Flag, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useEnsureMySwimmerRow } from '@/hooks/useEnsureMySwimmerRow'
import { useGoalRaces, useCreateGoalRace } from '@/hooks/useGoalRaces'
import { goalRaceInputSchema, type GoalRaceInput } from '@/lib/goalRaceSchemas'
import { parseTime } from '@/lib/formatTime'
import { localDateStr } from '@/lib/dateLocal'
import { GOAL_EVENT_TYPE_LABELS, GOAL_EVENT_TYPES, GOAL_PRIORITIES } from '@/types'
import type { GoalEventType, GoalPriority } from '@/types'

const priorityTone = { A: 'amber', B: 'blue', C: 'gray' } as const

export function GoalRacePage() {
  useEnsureMySwimmerRow()
  const { data: swimmer } = useMySwimmer()
  const { data: races, isLoading } = useGoalRaces(swimmer?.id)
  const createGoalRace = useCreateGoalRace()
  const [open, setOpen] = useState(false)
  // Target time is a "mm:ss.cc" display string, not RHF/Zod-validated
  // directly — same reason GoalsPage keeps this field as plain local state
  // rather than a number input: parseTime/formatTime is the app's own
  // convention for this exact conversion, and fighting RHF's number
  // coercion for it isn't worth it for one optional field.
  const [targetTime, setTargetTime] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalRaceInput>({
    resolver: zodResolver(goalRaceInputSchema),
    defaultValues: { priority: 'A', event_type: 'pool_middle', distance_meters: 200 },
  })

  const targetTimeInvalid = targetTime.length > 0 && parseTime(targetTime) == null
  // Date.now() is flagged as impure during render no matter how it's
  // wrapped (useMemo doesn't change that) — a useState lazy initializer is
  // the idiomatic way to seed a one-time impure read; new Date(dateString)
  // below is fine since it's deterministic given a fixed string input.
  const [now] = useState(() => Date.now())

  const onSubmit = async (values: GoalRaceInput) => {
    if (!swimmer || targetTimeInvalid) return
    await createGoalRace.mutateAsync({
      swimmer_id: swimmer.id,
      coach_id: swimmer.coach_id,
      name: values.name,
      race_date: values.race_date,
      event_type: values.event_type as GoalEventType,
      distance_meters: Number(values.distance_meters),
      priority: values.priority as GoalPriority,
      target_time_seconds: targetTime ? parseTime(targetTime) : null,
    })
    reset()
    setTargetTime('')
    setOpen(false)
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Goal Race"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={!swimmer}>
            New race goal
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows count={2} />
      ) : (races ?? []).length === 0 ? (
        <EmptyState
          icon={<Flag className="h-6 w-6" />}
          title="No race goals yet"
          description="Set a race with a date and we'll build you a week-by-week training plan, periodized around it."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(races ?? []).map((race) => {
            const daysOut = Math.ceil((new Date(`${race.race_date}T00:00:00`).getTime() - now) / 86_400_000)
            return (
              <Link key={race.id} to={`/swimmer/goal-race/${race.id}`}>
                <Card interactive>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text-primary">{race.name}</h3>
                    <Badge tone={priorityTone[race.priority]}>Priority {race.priority}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {race.distance_meters}m {GOAL_EVENT_TYPE_LABELS[race.event_type]}
                  </p>
                  <p className="mt-2 font-mono text-xs tabular-nums text-text-muted">
                    {new Date(`${race.race_date}T00:00:00`).toLocaleDateString()} ·{' '}
                    {daysOut > 0 ? `${daysOut} days out` : daysOut === 0 ? 'today' : 'past'}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    View plan <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Set a race goal">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Race name" placeholder="City Championships" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Race date"
              type="date"
              min={localDateStr()}
              error={errors.race_date?.message}
              {...register('race_date')}
            />
            <Select label="Event type" error={errors.event_type?.message} {...register('event_type')}>
              {GOAL_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{GOAL_EVENT_TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Distance (m)"
              type="number"
              min={1}
              error={errors.distance_meters?.message}
              {...register('distance_meters', { valueAsNumber: true })}
            />
            <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
              {GOAL_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Target time (optional)"
            placeholder="1:02.45"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            error={targetTimeInvalid ? 'Invalid time' : undefined}
          />
          {createGoalRace.isError && <p className="text-sm text-danger">Something went wrong. Try again.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createGoalRace.isPending} disabled={targetTimeInvalid}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
