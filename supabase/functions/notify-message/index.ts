// Set secret: supabase secrets set RESEND_API_KEY=<your_key>
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  if (!record?.id) {
    return new Response('No record', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Load the message with sender and recipient profiles
  const { data: msg } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, email), recipient:profiles!recipient_id(full_name, email)')
    .eq('id', record.id)
    .single()

  if (!msg?.recipient?.email) {
    return new Response('No recipient', { status: 200 })
  }

  const senderName = msg.sender?.full_name ?? 'Someone'
  const recipientName = msg.recipient.full_name ?? 'there'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Swimphoria <onboarding@resend.dev>',
      to: msg.recipient.email,
      subject: `New message from ${senderName}`,
      html: `
        <p>Hi ${recipientName},</p>
        <p><strong>${senderName}</strong> sent you a message on Swimphoria:</p>
        <blockquote style="border-left:3px solid #00c9a7;padding-left:12px;color:#555">
          ${msg.content}
        </blockquote>
        <p><a href="https://swimphoria.app/coach/messages">Open Swimphoria</a></p>
      `,
    }),
  })

  return new Response(JSON.stringify({ status: res.status }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
