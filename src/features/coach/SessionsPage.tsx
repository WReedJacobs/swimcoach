import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, Pencil, Trash2, Users, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useSessions, useDeleteSession, useAllSessionAssignments, useMarkAttendance } from '@/hooks/useSessions'
import type { AssignmentRow } from '@/hooks/useSessions'
import type { Session, SessionType } from '@/types'

const typeTone: Record<SessionType, 'blue' | 'amber' | 'green'> = {
  training: 'blue',
  race: 'amber',
  dryland: 'green',
}

function AttendancePanel({ sessionId, assignments }: { sessionId: string; assignments: AssignmentRow[] }) {
  const markAttendance = useMarkAttendance()
  const rows = assignments.filter((a) => a.session_id === sessionId)

  if (rows.length === 0) {
    return <p className="py-2 text-sm text-text-muted">No swimmers assigned.</p>
  }

  const attended = rows.filter((r) => r.attended).length

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
        Attendance · {attended}/{rows.length}
      </p>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => markAttendance.mutate({ assignmentId: r.id, attended: !r.attended })}
            className={cn(
              'flex items-center gap-1.5 rounded-component border px-2.5 py-1 text-xs font-medium transition-colors',
              r.attended
                ? 'border-secondary/40 bg-secondary/10 text-secondary'
                : 'border-border text-text-secondary hover:border-secondary/40 hover:bg-secondary/5',
            )}
          >
            {r.attended && <Check className="h-3 w-3" />}
            {r.display_name}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SessionsPage() {
  const navigate = useNavigate()
  const { data: sessions, isLoading } = useSessions()
  const { data: assignments } = useAllSessionAssignments()
  const deleteSession = useDeleteSession()
  const today = new Date().toISOString().slice(0, 10)
  const [confirmDelete, setConfirmDelete] = useState<Session | null>(null)
  const [openAttendance, setOpenAttendance] = useState<string | null>(null)

  const assignmentsBySession = useMemo(() => {
    const map = new Map<string, AssignmentRow[]>()
    for (const a of assignments ?? []) {
      if (!map.has(a.session_id)) map.set(a.session_id, [])
      map.get(a.session_id)!.push(a)
    }
    return map
  }, [assignments])

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteSession.mutateAsync(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Sessions"
        action={
          <Link to="/coach/sessions/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New session</Button>
          </Link>
        }
      />

      {isLoading ? (
        <SkeletonRows count={4} />
      ) : (sessions ?? []).length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No sessions yet"
          description="Build your first training session and assign it to swimmers."
          action={
            <Link to="/coach/sessions/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>New session</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {(sessions ?? []).map((s) => {
            const sessionAssignments = assignmentsBySession.get(s.id) ?? []
            const attendedCount = sessionAssignments.filter((a) => a.attended).length
            const isOpen = openAttendance === s.id

            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{s.title}</h3>
                      <Badge tone={typeTone[s.type]} className="capitalize">{s.type}</Badge>
                      {s.date === today && <Badge tone="green">Today</Badge>}
                    </div>
                    <p className="mt-0.5 font-mono text-sm tabular-nums text-text-secondary">
                      {new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    {s.main_set && (
                      <p className="mt-2 line-clamp-2 text-sm text-text-primary">
                        <span className="font-medium">Main:</span> {s.main_set}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {sessionAssignments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Users className="h-4 w-4" />}
                        onClick={() => setOpenAttendance(isOpen ? null : s.id)}
                        className={cn(isOpen && 'bg-primary/10 text-primary')}
                      >
                        {attendedCount}/{sessionAssignments.length}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => navigate(`/coach/sessions/${s.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4 text-danger" />}
                      onClick={() => setConfirmDelete(s)}
                    />
                  </div>
                </div>

                {isOpen && (
                  <AttendancePanel sessionId={s.id} assignments={sessionAssignments} />
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete session?">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">{confirmDelete?.title}</span> will be permanently deleted,
          including all swimmer assignments.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteSession.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
