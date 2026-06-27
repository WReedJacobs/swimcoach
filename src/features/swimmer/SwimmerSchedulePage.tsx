import { useState } from 'react'
import { CalendarCheck, Plus, Clock } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useMyBookings, useCreateBooking } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import type { BookingStatus } from '@/types'

const statusTone: Record<BookingStatus, 'amber' | 'green' | 'gray'> = {
  pending: 'amber',
  confirmed: 'green',
  cancelled: 'gray',
}

export function SwimmerSchedulePage() {
  const { profile } = useAuth()
  const { data: swimmer } = useMySwimmer()
  const { data: bookings } = useMyBookings()
  const createBooking = useCreateBooking()

  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')

  const hasCoach =
    profile?.coach_id !== null && profile?.coach_id !== profile?.id

  const handleRequest = async () => {
    if (!swimmer || !profile?.coach_id) return
    await createBooking.mutateAsync({
      swimmer_id: swimmer.id,
      coach_id: profile.coach_id,
      notes: notes.trim() || undefined,
    })
    setNotes('')
    setOpen(false)
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Schedule"
        action={
          hasCoach && swimmer ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Request session
            </Button>
          ) : null
        }
      />

      {!hasCoach && (
        <Card className="border-border/50 bg-bg">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
            <div>
              <p className="font-medium text-text-primary">No coach linked</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                Join a coach using their 6-character code from your dashboard before requesting sessions.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="My requests" subtitle="Session requests you've sent to your coach" />
        {(bookings ?? []).length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-6 w-6" />}
            title="No requests yet"
            description="Use the button above to request a session with your coach."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(bookings ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-text-primary">Session request</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-text-muted">
                    {new Date(b.requested_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {b.notes && ` · ${b.notes}`}
                  </p>
                </div>
                <Badge tone={statusTone[b.status]} className="capitalize">{b.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Request a session">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Your coach will see this request on their Schedule page and confirm or decline it.
          </p>
          <Textarea
            label="Notes (optional)"
            placeholder="e.g. Free Tuesday or Thursday afternoon, focusing on starts…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={createBooking.isPending} onClick={handleRequest}>
              Send request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
