import { useState } from 'react'
import { MessageSquare, Send, ArrowLeft } from 'lucide-react'
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
import type { Swimmer, Message } from '@/types'

// ─── sub-components ──────────────────────────────────────────────────────────

function ContactListItems({
  contacts,
  activeId,
  onSelect,
}: {
  contacts: Swimmer[]
  activeId: string
  onSelect: (profileId: string) => void
}) {
  return (
    <ul className="divide-y divide-border">
      {contacts.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c.profile_id!)}
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
  )
}

function ConversationPane({
  active,
  messages,
  userId,
  draft,
  setDraft,
  send,
  sendIsPending,
  onBack,
}: {
  active: Swimmer | undefined
  messages: Message[] | undefined
  userId: string | undefined
  draft: string
  setDraft: (v: string) => void
  send: () => void
  sendIsPending: boolean
  onBack?: () => void
}) {
  if (!active) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Select a swimmer to start chatting
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-1 shrink-0 text-text-secondary hover:text-text-primary"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <span className="font-medium text-text-primary">{swimmerName(active)}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {(messages ?? []).length === 0 ? (
          <p className="text-center text-sm text-text-muted">No messages yet. Say hello!</p>
        ) : (
          (messages ?? []).map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.sender_id === userId ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-card px-3 py-2 text-sm',
                  m.sender_id === userId ? 'bg-primary text-on-primary' : 'bg-bg text-text-primary',
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 border-t border-border bg-surface p-3">
        <Input
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1"
        />
        <Button
          leftIcon={<Send className="h-4 w-4" />}
          loading={sendIsPending}
          onClick={send}
          disabled={!draft.trim()}
        >
          Send
        </Button>
      </div>
    </>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const { user } = useAuth()
  const { data: swimmers } = useSwimmers()
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

  const conversationProps = {
    active,
    messages,
    userId: user?.id,
    draft,
    setDraft,
    send,
    sendIsPending: sendMessage.isPending,
  }

  return (
    <>
      {/* ── Mobile: single-panel stack ─────────────────────────────────────── */}
      <div className="flex h-[calc(100dvh-8rem)] flex-col md:hidden">
        {!activeId ? (
          <Card padding={false} className="flex-1 overflow-y-auto">
            <ContactListItems contacts={contacts} activeId={activeId} onSelect={setActiveId} />
          </Card>
        ) : (
          <Card padding={false} className="flex h-full flex-col overflow-hidden">
            <ConversationPane {...conversationProps} onBack={() => setActiveId('')} />
          </Card>
        )}
      </div>

      {/* ── Desktop: two-panel grid ────────────────────────────────────────── */}
      <div className="hidden md:grid md:h-[calc(100vh-7rem)] md:grid-cols-[260px_1fr] gap-4">
        <Card padding={false} className="overflow-y-auto">
          <ContactListItems contacts={contacts} activeId={activeId} onSelect={setActiveId} />
        </Card>
        <Card padding={false} className="flex flex-col overflow-hidden">
          <ConversationPane {...conversationProps} />
        </Card>
      </div>
    </>
  )
}
