// Set secret: supabase secrets set RESEND_API_KEY=<your_key>
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  if (!record?.session_id || !record?.swimmer_id) {
    return new Response('No record', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const [{ data: session }, { data: swimmer }] = await Promise.all([
    supabase.from('sessions').select('title, date, coach_id').eq('id', record.session_id).single(),
    supabase.from('profiles').select('full_name, email').eq('id', record.swimmer_id).single(),
  ])

  if (!swimmer?.email || !session) {
    return new Response('Missing data', { status: 200 })
  }

  const { data: coach } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', session.coach_id)
    .single()

  const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Swimphoria <onboarding@resend.dev>',
      to: swimmer.email,
      subject: `New session assigned: ${session.title}`,
      html: `
        <p>Hi ${swimmer.full_name ?? 'there'},</p>
        <p>You've been assigned to a new session by <strong>${coach?.full_name ?? 'your coach'}</strong>:</p>
        <table style="border-collapse:collapse;margin:12px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#888">Session</td><td><strong>${session.title}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Date</td><td>${sessionDate}</td></tr>
        </table>
        <p><a href="https://swimphoria.app/swimmer/today">View your sessions</a></p>
      `,
    }),
  })

  return new Response(JSON.stringify({ status: res.status }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
