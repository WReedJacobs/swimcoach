import { useMemo } from 'react'
import { CalendarCheck, Check, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings'
import { useSwimmers } from '@/hooks/useSwimmers'
import { swimmerName } from '@/types'
import type { BookingStatus } from '@/types'

const statusTone: Record<BookingStatus, 'amber' | 'green' | 'gray'> = {
  pending: 'amber',
  confirmed: 'green',
  cancelled: 'gray',
}

export function BookingPage() {
  const { data: bookings } = useBookings()
  const { data: swimmers } = useSwimmers()
  const updateStatus = useUpdateBookingStatus()

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of swimmers ?? []) m.set(s.id, swimmerName(s))
    return m
  }, [swimmers])

  const pending = (bookings ?? []).filter((b) => b.status === 'pending')
  const resolved = (bookings ?? []).filter((b) => b.status !== 'pending')

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader kicker="REQUESTS" />
        <Card>
        <CardHeader title="Booking requests" subtitle="Confirm or decline session requests from your swimmers" />
        {pending.length === 0 ? (
          <EmptyState icon={<CalendarCheck className="h-6 w-6" />} title="No pending requests" description="When a swimmer requests a session, it shows up here." />
        ) : (
          <ul className="space-y-3">
            {pending.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-component border border-border p-3">
                <Avatar name={nameById.get(b.swimmer_id) ?? 'Swimmer'} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{nameById.get(b.swimmer_id) ?? 'Swimmer'}</p>
                  <p className="text-xs text-text-muted">
                    Requested <span className="font-mono tabular-nums">{new Date(b.requested_at).toLocaleDateString()}</span>
                    {b.notes && ` · ${b.notes}`}
                  </p>
                </div>
                <Button size="sm" variant="secondary" leftIcon={<Check className="h-4 w-4" />} loading={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: b.id, status: 'confirmed' })}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={() => updateStatus.mutate({ id: b.id, status: 'cancelled' })}>
                  Decline
                </Button>
              </li>
            ))}
          </ul>
        )}
        </Card>
      </div>

      {resolved.length > 0 && (
        <div>
          <SectionHeader kicker="HISTORY" />
          <Card>
          <CardHeader title="Past requests" />
          <ul className="divide-y divide-border">
            {resolved.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-primary">{nameById.get(b.swimmer_id) ?? 'Swimmer'}</span>
                <Badge tone={statusTone[b.status]} className="capitalize">{b.status}</Badge>
              </li>
            ))}
          </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
