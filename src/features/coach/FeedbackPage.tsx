import { useMemo, useState } from 'react'
import { ClipboardList, Send, Pin, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useFeedback, useCreateFeedback, useDeleteFeedback, useToggleFeedbackPin } from '@/hooks/useFeedback'
import { swimmerName } from '@/types'

export function FeedbackPage() {
  const { data: swimmers } = useSwimmers()
  const { data: feedback } = useFeedback()
  const createFeedback = useCreateFeedback()
  const deleteFeedback = useDeleteFeedback()
  const togglePin = useToggleFeedbackPin()

  const [swimmerId, setSwimmerId] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)

  const effectiveId = swimmerId || swimmers?.[0]?.id || ''
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of swimmers ?? []) m.set(s.id, swimmerName(s))
    return m
  }, [swimmers])

  const submit = async () => {
    if (!content.trim() || !effectiveId) return
    await createFeedback.mutateAsync({ swimmerId: effectiveId, content: content.trim(), isPinned: pinned })
    setContent('')
    setPinned(false)
  }

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Feedback" />
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Give feedback" />
        {(swimmers ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">Add swimmers first.</p>
        ) : (
          <div className="space-y-4">
            <Select label="Swimmer" value={effectiveId} onChange={(e) => setSwimmerId(e.target.value)}>
              {(swimmers ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {swimmerName(s)}
                </option>
              ))}
            </Select>
            <Textarea label="Feedback" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What went well, what to work on…" />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin this feedback
            </label>
            <Button leftIcon={<Send className="h-4 w-4" />} loading={createFeedback.isPending} disabled={!content.trim()} onClick={submit}>
              Send feedback
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent feedback" />
        {(feedback ?? []).length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No feedback yet" description="Feedback you send appears here." />
        ) : (
          <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
            {(feedback ?? []).map((f) => (
              <li key={f.id} className="rounded-component border border-border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Avatar name={nameById.get(f.swimmer_id) ?? 'Swimmer'} size="sm" />
                  <span className="text-sm font-medium text-text-primary">{nameById.get(f.swimmer_id) ?? 'Swimmer'}</span>
                  {f.is_pinned && <Pin className="h-3 w-3 text-accent" />}
                  <span className="ml-auto font-mono text-xs tabular-nums text-text-muted">{new Date(f.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => togglePin.mutate({ id: f.id, is_pinned: !f.is_pinned })}
                    className="rounded p-1 text-text-muted hover:text-accent"
                    title={f.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`h-3.5 w-3.5 ${f.is_pinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this feedback?')) deleteFeedback.mutate(f.id)
                    }}
                    className="rounded p-1 text-text-muted hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
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
