import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useCreateGoalRace, useGenerateTrainingPlan } from '@/hooks/useGoalRaces'
import { goalRaceInputSchema, type GoalRaceInput } from '@/lib/goalRaceSchemas'
import { localDateStr } from '@/lib/dateLocal'
import { swimmerName, GOAL_EVENT_TYPE_LABELS, GOAL_EVENT_TYPES, GOAL_PRIORITIES } from '@/types'
import type { Swimmer, GoalEventType, GoalPriority } from '@/types'

type RunState = 'pending' | 'creating' | 'generating' | 'done' | 'error'

/**
 * Coach-side "assign the same race to a squad" flow. Race details are
 * entered once; on submit, one goal_races row is created *per selected
 * swimmer* (same race, different swimmer_id) and generation is triggered
 * for each individually — the edge function always reads the target
 * swimmer's own CSS, so this is what gives every swimmer their own
 * individually-scaled plan from one shared race entry, with no extra code
 * needed beyond looping the same create+generate calls the solo swimmer
 * flow already uses.
 */
export function AssignGoalRaceModal({
  open,
  onClose,
  swimmers,
}: {
  open: boolean
  onClose: () => void
  swimmers: Swimmer[]
}) {
  const { user } = useAuth()
  const createGoalRace = useCreateGoalRace()
  const generatePlan = useGenerateTrainingPlan()
  const [selected, setSelected] = useState<string[]>([])
  const [runs, setRuns] = useState<Record<string, { state: RunState; error?: string }>>({})
  const [running, setRunning] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalRaceInput>({
    resolver: zodResolver(goalRaceInputSchema),
    defaultValues: { priority: 'A', event_type: 'pool_middle', distance_meters: 200 },
  })

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const close = () => {
    if (running) return
    setSelected([])
    setRuns({})
    reset()
    onClose()
  }

  const onSubmit = async (values: GoalRaceInput) => {
    if (selected.length === 0 || !user) return
    setRunning(true)
    setRuns(Object.fromEntries(selected.map((id) => [id, { state: 'pending' as RunState }])))

    for (const swimmerId of selected) {
      setRuns((prev) => ({ ...prev, [swimmerId]: { state: 'creating' } }))
      try {
        const race = await createGoalRace.mutateAsync({
          swimmer_id: swimmerId,
          coach_id: user.id,
          name: values.name,
          race_date: values.race_date,
          event_type: values.event_type as GoalEventType,
          distance_meters: Number(values.distance_meters),
          priority: values.priority as GoalPriority,
        })
        setRuns((prev) => ({ ...prev, [swimmerId]: { state: 'generating' } }))
        await generatePlan.mutateAsync({ goalRaceId: race.id })
        setRuns((prev) => ({ ...prev, [swimmerId]: { state: 'done' } }))
      } catch (err) {
        setRuns((prev) => ({
          ...prev,
          [swimmerId]: { state: 'error', error: err instanceof Error ? err.message : 'Failed' },
        }))
      }
    }
    setRunning(false)
  }

  const allDone = selected.length > 0 && selected.every((id) => runs[id]?.state === 'done' || runs[id]?.state === 'error')

  return (
    <Modal open={open} onClose={close} title="Assign a goal race to your squad" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Swimmers ({selected.length} selected)</p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-component border border-border p-2">
            {swimmers.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center justify-between rounded-component px-2 py-1.5 text-sm hover:bg-bg"
              >
                <span className="flex items-center gap-2 text-text-primary">
                  {swimmerName(s)}
                  {runs[s.id] && (
                    <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em]">
                      {runs[s.id].state === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />}
                      {runs[s.id].state === 'error' && <XCircle className="h-3.5 w-3.5 text-danger" />}
                      {(runs[s.id].state === 'creating' || runs[s.id].state === 'generating') && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      )}
                      <span className="text-text-muted">
                        {runs[s.id].state === 'generating' ? 'generating…' : runs[s.id].state}
                      </span>
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  disabled={running}
                  onChange={() => toggle(s.id)}
                />
              </label>
            ))}
            {swimmers.length === 0 && <p className="p-2 text-sm text-text-muted">No swimmers on your roster yet.</p>}
          </div>
        </div>

        <Input label="Race name" placeholder="City Championships" error={errors.name?.message} disabled={running} {...register('name')} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Race date"
            type="date"
            min={localDateStr()}
            error={errors.race_date?.message}
            disabled={running}
            {...register('race_date')}
          />
          <Select label="Event type" error={errors.event_type?.message} disabled={running} {...register('event_type')}>
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
            disabled={running}
            {...register('distance_meters', { valueAsNumber: true })}
          />
          <Select label="Priority" error={errors.priority?.message} disabled={running} {...register('priority')}>
            {GOAL_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-text-muted">
          Each swimmer gets their own plan, individually scaled from their own CSS pace — this just applies the same
          race to everyone selected.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close} disabled={running}>
            {allDone ? 'Close' : 'Cancel'}
          </Button>
          {!allDone && (
            <Button type="submit" loading={running} disabled={selected.length === 0}>
              Assign &amp; generate {selected.length > 0 ? `(${selected.length})` : ''}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
