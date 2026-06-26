import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useConversation, useSendMessage } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { swimmerName } from '@/types'

export function MessagesPage() {
  const { user } = useAuth()
  const { data: swimmers } = useSwimmers()
  // Only swimmers with a linked account can receive messages.
  const contacts = (swimmers ?? []).filter((s) => s.profile_id)
  const [activeId, setActiveId] = useState<string>('')
  const active = contacts.find((c) => c.profile_id === activeId)

  const { data: messages } = useConversation(activeId || undefined)
  const sendMessage = useSendMessage()
  const [draft, setDraft] = useState('')

  const send = async () => {
    if (!draft.trim() || !activeId) return
    await sendMessage.mutateAsync({ recipientId: activeId, content: draft.trim() })
    setDraft('')
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-6 w-6" />}
        title="No messageable swimmers yet"
        description="Swimmers need a linked account before you can message them."
      />
    )
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-[260px_1fr] gap-4">
      <Card padding={false} className="overflow-y-auto">
        <ul className="divide-y divide-border">
          {contacts.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActiveId(c.profile_id!)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left',
                  c.profile_id === activeId ? 'bg-primary/5' : 'hover:bg-bg',
                )}
              >
                <Avatar name={swimmerName(c)} size="sm" />
                <span className="truncate text-sm font-medium text-text-primary">{swimmerName(c)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding={false} className="flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
            Select a swimmer to start chatting
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3 font-medium text-text-primary">{swimmerName(active)}</div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {(messages ?? []).length === 0 ? (
                <p className="text-center text-sm text-text-muted">No messages yet. Say hello!</p>
              ) : (
                (messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex', m.sender_id === user?.id ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-card px-3 py-2 text-sm',
                        m.sender_id === user?.id ? 'bg-primary text-on-primary' : 'bg-bg text-text-primary',
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                className="flex-1"
              />
              <Button leftIcon={<Send className="h-4 w-4" />} loading={sendMessage.isPending} onClick={send} disabled={!draft.trim()}>
                Send
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
