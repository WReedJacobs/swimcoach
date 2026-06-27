import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { useConversation, useSendMessage } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'

function useCoachName(coachId: string | undefined) {
  return useQuery({
    queryKey: ['profile-name', coachId],
    enabled: Boolean(coachId),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', coachId!)
        .maybeSingle()
      return (data?.full_name as string | null) ?? 'Your coach'
    },
  })
}

export function MessagesPage() {
  const { profile, user } = useAuth()
  const coachId = profile?.coach_id ?? null
  const hasRealCoach = coachId !== null && coachId !== profile?.id

  const { data: coachName } = useCoachName(hasRealCoach ? coachId! : undefined)
  const { data: messages } = useConversation(hasRealCoach ? coachId! : undefined)
  const sendMessage = useSendMessage()
  const [draft, setDraft] = useState('')

  const send = async () => {
    if (!draft.trim() || !coachId || !hasRealCoach) return
    await sendMessage.mutateAsync({ recipientId: coachId, content: draft.trim() })
    setDraft('')
  }

  if (!hasRealCoach) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-6 w-6" />}
        title="Connect to a coach to unlock messaging"
        description="Enter your coach's join code from your dashboard to enable the message thread."
      />
    )
  }

  return (
    <div className="h-[calc(100vh-7rem)]">
      <Card padding={false} className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="font-medium text-text-primary">{coachName ?? 'Your coach'}</p>
          <p className="text-xs text-text-muted">Coach</p>
        </div>

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
                    m.sender_id === user?.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-bg text-text-primary',
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
          <Button
            leftIcon={<Send className="h-4 w-4" />}
            loading={sendMessage.isPending}
            onClick={send}
            disabled={!draft.trim()}
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  )
}
