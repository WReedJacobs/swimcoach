import { useState } from 'react'
import { Target, Plus, CheckCircle2, Trash2, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { useTimes } from '@/hooks/useTimes'
import { fastestByEvent } from '@/lib/pbDetector'
import { formatTime, parseTime } from '@/lib/formatTime'
import { STROKES, DISTANCES } from '@/types'
import type { Goal, Stroke } from '@/types'

type ModalMode = 'create' | 'edit'

export function GoalsPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: goals } = useGoals(swimmer?.id)
  const { data: times } = useTimes(swimmer?.id)
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const best = fastestByEvent(times ?? [])

  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [open, setOpen] = useState(false)
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [distance, setDistance] = useState(100)
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null)

  const openCreate = () => {
    setModalMode('create')
    setEditingGoal(null)
    setStroke('freestyle')
    setDistance(100)
    setTarget('')
    setDeadline('')
    setOpen(true)
  }

  const openEdit = (g: Goal) => {
    setModalMode('edit')
    setEditingGoal(g)
    setStroke(g.stroke)
    setDistance(g.distance)
    setTarget(formatTime(g.target_time_seconds))
    setDeadline(g.deadline ?? '')
    setOpen(true)
  }

  const save = async () => {
    const seconds = parseTime(target)
    if (seconds == null || !swimmer) return
    if (modalMode === 'edit' && editingGoal) {
      await updateGoal.mutateAsync({
        id: editingGoal.id,
        swimmerId: swimmer.id,
        stroke,
        distance,
        target_time_seconds: seconds,
        deadline: deadline || null,
      })
    } else {
      await createGoal.mutateAsync({
        swimmer_id: swimmer.id,
        stroke,
        distance,
        target_time_seconds: seconds,
        deadline: deadline || null,
      })
    }
    setOpen(false)
    setEditingGoal(null)
  }

  const isPending = createGoal.isPending || updateGoal.isPending

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          kicker="Goals"
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate} disabled={!swimmer}>
              New goal
            </Button>
          }
        />

        {(goals ?? []).length === 0 ? (
          <EmptyState icon={<Target className="h-6 w-6" />} title="No goals yet" description="Set a target time and track your progress toward it." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(goals ?? []).map((g) => {
              const current = best.get(`${g.stroke}-${g.distance}`)
              const pct = current ? Math.min(100, (g.target_time_seconds / current.time_seconds) * 100) : 0
              const hit = current ? current.time_seconds <= g.target_time_seconds : false
              return (
                <Card key={g.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold capitalize text-text-primary">{g.distance}m {g.stroke}</h3>
                    <div className="flex items-center gap-1">
                      {hit && <CheckCircle2 className="h-5 w-5 text-secondary" />}
                      <button
                        onClick={() => openEdit(g)}
                        className="flex rounded p-1 text-text-muted hover:text-text-primary"
                        title="Edit goal"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(g)}
                        className="flex rounded p-1 text-text-muted hover:text-danger"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Target <span className="font-mono tabular-nums">{formatTime(g.target_time_seconds)}</span>
                    {current && (
                      <> · best <span className="font-mono tabular-nums">{formatTime(current.time_seconds)}</span></>
                    )}
                  </p>
                  <ProgressBar className="mt-3" value={pct} tone={hit ? 'green' : 'blue'} />
                  {g.deadline && (
                    <p className="mt-2 font-mono uppercase tracking-[0.14em] text-xs text-text-muted">By {new Date(g.deadline).toLocaleDateString()}</p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={modalMode === 'edit' ? 'Edit goal' : 'New goal'}>
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
          <Input label="Target time" placeholder="1:02.45" value={target} onChange={(e) => setTarget(e.target.value)} error={target.length > 0 && parseTime(target) == null ? 'Invalid time' : undefined} />
          <Input label="Deadline (optional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={isPending} disabled={parseTime(target) == null} onClick={save}>
              {modalMode === 'edit' ? 'Save changes' : 'Save goal'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete goal?">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {confirmDelete.distance}m {confirmDelete.stroke} — target {formatTime(confirmDelete.target_time_seconds)}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteGoal.isPending}
                onClick={async () => {
                  if (!swimmer) return
                  await deleteGoal.mutateAsync({ id: confirmDelete.id, swimmerId: swimmer.id })
                  setConfirmDelete(null)
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
