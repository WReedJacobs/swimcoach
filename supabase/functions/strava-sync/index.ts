import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')!
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')!

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const DEFAULT_LOOKBACK_DAYS = 30

interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type?: string
  distance: number // metres
  moving_time: number // seconds
  start_date: string // ISO
  pool_length?: number // metres, only present for pool swims
}

/** Refresh the stored access token if it's expired or about to expire. */
async function ensureFreshToken(profileId: string, conn: {
  access_token: string
  refresh_token: string
  expires_at: string
}): Promise<string> {
  const expiresAt = new Date(conn.expires_at).getTime()
  if (expiresAt - Date.now() > 5 * 60 * 1000) {
    return conn.access_token
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed: ${await res.text()}`)
  const data = await res.json()

  await adminClient
    .from('strava_connections')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at * 1000).toISOString(),
    })
    .eq('profile_id', profileId)

  return data.access_token as string
}

/** Mirrors useEnsureMySwimmerRow's client-side logic, server-side, for any role. */
async function ensureSelfSwimmerId(profileId: string): Promise<string> {
  const { data: existing } = await adminClient
    .from('swimmers')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (existing) return existing.id as string

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, level')
    .eq('id', profileId)
    .single()

  const { data: created, error } = await adminClient
    .from('swimmers')
    .insert({
      coach_id: profileId,
      profile_id: profileId,
      display_name: profile?.full_name || 'Swimmer',
      level: profile?.level ?? 'beginner',
    })
    .select('id')
    .single()
  if (error) throw error
  return created.id as string
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: conn } = await adminClient
      .from('strava_connections')
      .select('access_token, refresh_token, expires_at, last_synced_at')
      .eq('profile_id', caller.id)
      .maybeSingle()
    if (!conn) {
      return new Response(JSON.stringify({ error: 'Strava is not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await ensureFreshToken(caller.id, conn)
    const swimmerId = await ensureSelfSwimmerId(caller.id)

    const after = conn.last_synced_at
      ? Math.floor(new Date(conn.last_synced_at).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - DEFAULT_LOOKBACK_DAYS * 86400

    // Paginate up to 3 pages (300 activities) — plenty for a manual "sync now".
    const activities: StravaActivity[] = []
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!res.ok) throw new Error(`Strava activities fetch failed: ${await res.text()}`)
      const batch: StravaActivity[] = await res.json()
      activities.push(...batch)
      if (batch.length < 100) break
    }

    const swims = activities.filter(
      (a) => (a.type === 'Swim' || a.sport_type === 'Swim') && a.distance > 0 && a.moving_time > 0,
    )

    // Existing freestyle times for this swimmer, to seed PB comparisons —
    // stroke is unknown from Strava, so every import is logged as freestyle.
    const { data: existingTimes } = await adminClient
      .from('times')
      .select('distance, time_seconds, course')
      .eq('swimmer_id', swimmerId)
      .eq('stroke', 'freestyle')

    const bestByKey = new Map<string, number>()
    for (const t of existingTimes ?? []) {
      const key = `${t.distance}-${t.course ?? 'SCM'}`
      const prev = bestByKey.get(key)
      if (prev === undefined || t.time_seconds < prev) bestByKey.set(key, t.time_seconds)
    }

    let imported = 0

    for (const a of swims) {
      const distance = Math.round(a.distance)
      const course = a.pool_length && a.pool_length >= 45 ? 'LCM' : 'SCM'

      // Each Strava activity becomes a session (title + an auto-generated
      // summary in main_set) rather than a bare times row — the athlete can
      // then overwrite `notes` on Recent Imports (My Times) to describe what
      // they actually did, since Strava only knows total distance/time.
      const { data: sessionRows, error: sessionErr } = await adminClient
        .from('sessions')
        .upsert(
          {
            coach_id: caller.id,
            title: a.name || 'Strava swim',
            date: a.start_date.slice(0, 10),
            type: 'training',
            main_set: `${distance}m freestyle · ${formatDuration(a.moving_time)} — imported from Strava`,
            external_source: 'strava',
            external_id: String(a.id),
          },
          { onConflict: 'external_source,external_id', ignoreDuplicates: true },
        )
        .select('id')
      if (sessionErr) throw sessionErr
      if (!sessionRows || sessionRows.length === 0) continue // already imported

      const sessionId = sessionRows[0].id as string
      imported++

      await adminClient
        .from('session_assignments')
        .insert({ session_id: sessionId, swimmer_id: swimmerId, attended: true })

      const key = `${distance}-${course}`
      const best = bestByKey.get(key)
      const isPb = best === undefined || a.moving_time < best
      if (isPb) bestByKey.set(key, a.moving_time)

      await adminClient.from('times').insert({
        swimmer_id: swimmerId,
        coach_id: null,
        session_id: sessionId,
        stroke: 'freestyle',
        distance,
        course,
        time_seconds: a.moving_time,
        is_pb: isPb,
        is_self_logged: true,
        recorded_at: a.start_date,
        notes: `Imported from Strava — "${a.name}"`,
      })
    }

    await adminClient
      .from('strava_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('profile_id', caller.id)

    return new Response(JSON.stringify({ success: true, imported }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
