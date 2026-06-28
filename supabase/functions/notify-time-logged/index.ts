// Set secret: supabase secrets set RESEND_API_KEY=<your_key>
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return minutes > 0
    ? `${minutes}:${secs.toFixed(2).padStart(5, '0')}`
    : `${secs.toFixed(2)}`
}

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  if (!record?.id) {
    return new Response('No record', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Load the time entry with swimmer profile and coach profile
  const { data: entry } = await supabase
    .from('times')
    .select('*, swimmer:swimmers!swimmer_id(id, name), coach:profiles!coach_id(full_name)')
    .eq('id', record.id)
    .single()

  if (!entry?.swimmer?.id) {
    return new Response('No swimmer', { status: 200 })
  }

  // Get swimmer's email from profiles
  const { data: swimmerProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', entry.swimmer.id)
    .single()

  if (!swimmerProfile?.email) {
    return new Response('No swimmer email', { status: 200 })
  }

  const timeStr = formatTime(entry.time_seconds)
  const event = `${entry.distance}m ${entry.stroke}`
  const isPB = entry.is_pb

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Swimphoria <onboarding@resend.dev>',
      to: swimmerProfile.email,
      subject: isPB
        ? `New personal best! ${event} — ${timeStr}`
        : `Time logged: ${event} — ${timeStr}`,
      html: `
        <p>Hi ${swimmerProfile.full_name ?? 'there'},</p>
        ${isPB
          ? `<p><strong>${entry.coach?.full_name ?? 'Your coach'}</strong> logged a new <strong>personal best</strong> for you!</p>`
          : `<p><strong>${entry.coach?.full_name ?? 'Your coach'}</strong> logged a time for you.</p>`
        }
        <table style="border-collapse:collapse;margin:12px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#888">Event</td><td><strong>${event}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Time</td><td><strong style="font-family:monospace">${timeStr}</strong></td></tr>
        </table>
        <p><a href="https://swimphoria.app/swimmer/times">View your times</a></p>
      `,
    }),
  })

  return new Response(JSON.stringify({ status: res.status }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
