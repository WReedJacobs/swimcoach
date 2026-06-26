import { ClipboardList, Pin } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useFeedback } from '@/hooks/useFeedback'

export function FeedbackViewPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: feedback } = useFeedback(swimmer?.id)

  const pinned = (feedback ?? []).filter((f) => f.is_pinned)
  const rest = (feedback ?? []).filter((f) => !f.is_pinned)

  return (
    <div className="space-y-8">
      {pinned.length > 0 && (
        <div>
        <SectionHeader kicker="Pinned" />
        <Card>
          <CardHeader title="Pinned by your coach" />
          <ul className="space-y-3">
            {pinned.map((f) => (
              <li key={f.id} className="rounded-component border border-accent/30 bg-accent/5 p-3">
                <div className="mb-1 flex items-center gap-2 font-mono uppercase tracking-[0.14em] text-xs text-accent">
                  <Pin className="h-3 w-3" /> {new Date(f.created_at).toLocaleDateString()}
                </div>
                <p className="text-sm text-text-primary">{f.content}</p>
              </li>
            ))}
          </ul>
        </Card>
        </div>
      )}

      <div>
      <SectionHeader kicker="Feedback" />
      <Card>
        <CardHeader title="Coach feedback" />
        {rest.length === 0 && pinned.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No feedback yet" description="Notes from your coach will appear here." />
        ) : (
          <ul className="space-y-3">
            {rest.map((f) => (
              <li key={f.id} className="rounded-component border border-border p-3">
                <p className="mb-1 font-mono uppercase tracking-[0.14em] text-xs text-text-muted">{new Date(f.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-text-primary">{f.content}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </div>
    </div>
  )
}
