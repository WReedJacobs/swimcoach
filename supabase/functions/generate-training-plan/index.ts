// Milestone 2 — goal-race training plan generator.
//
// Phase boundaries, taper length and taper volume reduction are computed in
// code (trainingPlanPhases.ts) and handed to the model as hard constraints —
// this is sports science, not something left to the LLM's judgment. The LLM
// only fills in set design (stroke/drill variety, main-set structure, rest)
// within those boundaries, via Anthropic's tool-use structured output, which
// is then re-validated against generatedPlanSchema (Zod) before anything
// touches the database — free-text model output is never trusted directly.
//
// Shared files (trainingPlanPhases.ts, goalRaceSchemas.ts, formatTime.ts,
// dateLocal.ts) are imported directly from src/lib via relative paths, not
// duplicated — same tested logic runs here as under Vitest. The one thing
// that can't cross runtimes as-is is goalRaceSchemas.ts's bare `from 'zod'`
// import; see import_map.json in this functions directory, which maps that
// specifier to Deno's npm compat loader without needing to touch the shared
// file (which also has to work unmodified for the Vite frontend).
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { computeTrainingPlanSkeleton } from '../../../src/lib/trainingPlanPhases.ts'
import { generatedPlanSchema } from '../../../src/lib/goalRaceSchemas.ts'
import type { GeneratedPlan, PlanSetInput, PlanWeekInput } from '../../../src/lib/goalRaceSchemas.ts'
import { formatTime } from '../../../src/lib/formatTime.ts'
import { addDaysStr, localDateStr } from '../../../src/lib/dateLocal.ts'
import type { GoalEventType, PlanBlock } from '../../../src/types/index.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const MODEL = 'claude-sonnet-5'
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ─── Anthropic tool-use schema ──────────────────────────────────────────────
// Hand-written mirror of generatedPlanSchema (goalRaceSchemas.ts) — the tool
// schema shapes what the model returns, but the Zod parse after the call is
// the actual enforcement boundary. Keep these in sync if either changes.
const PLAN_TOOL_SCHEMA = {
  name: 'submit_training_plan',
  description: 'Submit the generated training plan for the requested week(s), strictly within the given phase/taper constraints.',
  input_schema: {
    type: 'object' as const,
    properties: {
      weeks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            week_number: { type: 'integer' },
            phase: { type: 'string', enum: ['prep', 'base', 'build', 'peak', 'taper'] },
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  day_of_week: { type: 'integer', minimum: 0, maximum: 6, description: '0 = Monday .. 6 = Sunday' },
                  sets: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        block: { type: 'string', enum: ['warm_up', 'main_set', 'cool_down'] },
                        set_order: { type: 'integer' },
                        set_type: { type: ['string', 'null'] },
                        reps: { type: 'integer', minimum: 1 },
                        distance_meters: { type: 'integer', minimum: 1 },
                        stroke: { type: ['string', 'null'], enum: ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'IM', null] },
                        target_pace_seconds: { type: ['number', 'null'] },
                        css_offset_seconds: { type: ['number', 'null'] },
                        rest_seconds: { type: ['number', 'null'] },
                        intensity_zone: { type: ['string', 'null'] },
                      },
                      required: ['block', 'set_order', 'reps', 'distance_meters'],
                    },
                  },
                },
                required: ['title', 'day_of_week', 'sets'],
              },
            },
          },
          required: ['week_number', 'phase', 'sessions'],
        },
      },
    },
    required: ['weeks'],
  },
}

interface SwimmerRow {
  id: string
  coach_id: string
  profile_id: string | null
  display_name: string
  days_per_week: number | null
  session_minutes: number | null
  preferred_days: string[] | null
}

interface GoalRaceRow {
  id: string
  swimmer_id: string
  coach_id: string | null
  name: string
  race_date: string
  event_type: GoalEventType
  distance_meters: number
  target_time_seconds: number | null
  swimmer: SwimmerRow
}

function buildSystemPrompt(
  goalRace: GoalRaceRow,
  skeleton: ReturnType<typeof computeTrainingPlanSkeleton>,
  weeksToGenerate: ReturnType<typeof computeTrainingPlanSkeleton>['weeks'],
  cssPacePer100: number | null,
  recentPbs: Array<{ stroke: string; distance: number; time_seconds: number }>,
  availability: { days_per_week: number; session_minutes: number; preferred_days: string[] },
): string {
  const taperInvolved = weeksToGenerate.some((w) => w.phase === 'taper')
  const buildInvolved = weeksToGenerate.some((w) => w.phase === 'build')
  // 'peak' is deliberately never assigned by computeTrainingPlanSkeleton
  // (see trainingPlanPhases.ts) — it's folded into 'taper', so "Build/Peak"
  // from the spec maps onto our actual 'build' and 'taper' phases.
  const isOpenWaterEvent = goalRace.event_type === 'open_water' || goalRace.event_type === 'triathlon_leg'
  const phaseLines = weeksToGenerate.map((w) => `  - Week ${w.weekNumber}: ${w.phase}`).join('\n')
  const pbLines = recentPbs.length
    ? recentPbs.map((p) => `  - ${p.distance}m ${p.stroke}: ${formatTime(p.time_seconds)}`).join('\n')
    : '  - (none logged yet)'

  return `You are a swim coach's training-plan assistant. You design the actual sets
(stroke/drill variety, main-set structure, rest intervals) for a swimmer's
periodized plan. You do NOT decide phase boundaries, taper length, or taper
volume — those are computed and given to you below as hard constraints, not
suggestions.

Race: ${goalRace.name}, ${goalRace.event_type}, ${goalRace.distance_meters}m, on ${goalRace.race_date}.
${goalRace.target_time_seconds ? `Target time: ${formatTime(goalRace.target_time_seconds)}.` : ''}
Total plan length: ${skeleton.totalWeeks} weeks.

Weeks you must generate this call (only these — do not generate any other week):
${phaseLines}

${taperInvolved ? `HARD CONSTRAINT — taper weeks in this batch: total volume must be ${skeleton.volumeReductionPct.min}-${skeleton.volumeReductionPct.max}% BELOW the prior build week's volume. Intensity (target pace) must NOT be relaxed to compensate — paces stay at or near race pace, only volume drops. Taper is ${skeleton.taperDays.min}-${skeleton.taperDays.max} days by design for this event type.` : ''}

${isOpenWaterEvent && buildInvolved ? `This is an open-water/triathlon-leg race. For Build-phase weeks in this batch, include sighting drills (lifting eyes to spot a landmark every 6-8 strokes without breaking stroke rhythm — set_type "sighting drill") and at least one longer continuous swim per week (no intervals, sustained race-effort distance, not broken into reps) to build open-water endurance.` : ''}
${isOpenWaterEvent && taperInvolved ? `Also, since this is open-water/triathlon: add a short wetsuit-acclimation note to one taper-week session's set_type or a cool_down set (e.g. a continuous swim done with a shortened, higher-elbow recovery to mimic wetsuit-restricted shoulder mobility, with a reminder that the swimmer should do at least one practice swim in their actual wetsuit before race day).` : ''}

Swimmer's CSS pace (critical swim speed, per 100m): ${cssPacePer100 != null ? formatTime(cssPacePer100) : 'not available — use event-appropriate paces from the recent PBs below instead, and favour effort-zone (intensity_zone) targets over exact target_pace_seconds where CSS is unknown'}.
Use CSS pace (target_pace_seconds, or css_offset_seconds as an offset from CSS) as the anchor for main-set target paces wherever CSS is available.

Recent personal bests:
${pbLines}

Training availability: ${availability.days_per_week} sessions/week, ~${availability.session_minutes} minutes each${availability.preferred_days.length ? `, preferred days: ${availability.preferred_days.join(', ')}` : ''}.
Generate exactly one session per available day per week (do not exceed days_per_week sessions in any single week).

Every set must include block, set_order (0-based within its block), reps, and distance_meters. Prefer setting target_pace_seconds directly when you have a CSS anchor; use css_offset_seconds when expressing pace relative to CSS is clearer; use intensity_zone (e.g. "aerobic", "threshold", "race pace") when neither is precise.

Respond only via the submit_training_plan tool call — no free text.`
}

async function callAnthropic(systemPrompt: string): Promise<GeneratedPlan> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Generate the training plan for the specified week(s) now.' }],
    tools: [PLAN_TOOL_SCHEMA],
    tool_choice: { type: 'tool', name: 'submit_training_plan' },
  })

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )
  if (!toolUse) throw new Error('Model did not return a structured tool-use response')

  // The tool schema shapes the response; this parse is what actually
  // enforces it — reject rather than silently coerce malformed output. On
  // failure, include the raw input so a bad run is diagnosable from
  // plan_generation_runs.error_message alone, without needing to reproduce it.
  try {
    return generatedPlanSchema.parse(toolUse.input)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`${detail}\n---raw tool input---\n${JSON.stringify(toolUse.input).slice(0, 2000)}`)
  }
}

/** Sets grouped by block, in set_order, joined into the same line format
 * SessionBuilder's own pace-set/preset-insert flows already produce (see
 * insertPaceSet / insertSet in SessionBuilder.tsx) — so a generated
 * session's text reads identically to a hand-built one. */
function renderBlockText(sets: PlanSetInput[], block: PlanBlock): string | null {
  const blockSets = sets.filter((s) => s.block === block).sort((a, b) => a.set_order - b.set_order)
  if (blockSets.length === 0) return null
  return blockSets
    .map((s) => {
      const strokeStr = s.stroke ? ` ${s.stroke}` : ''
      const paceStr =
        s.target_pace_seconds != null
          ? ` @ ${formatTime(s.target_pace_seconds)}`
          : s.css_offset_seconds != null
            ? ` @ CSS${s.css_offset_seconds >= 0 ? '+' : ''}${s.css_offset_seconds}`
            : s.intensity_zone
              ? ` (${s.intensity_zone})`
              : ''
      const restStr = s.rest_seconds != null ? ` on ${formatTime(s.rest_seconds)} rest` : ''
      const typeStr = s.set_type ? ` — ${s.set_type}` : ''
      return `${s.reps} × ${s.distance_meters}m${strokeStr}${paceStr}${restStr}${typeStr}`
    })
    .join('\n')
}

/** Week 1 starts the Monday of (race_date - totalWeeks*7 days); day_of_week
 * is 0=Monday..6=Sunday, matching swimmers.preferred_days convention. */
function sessionDateFor(raceDate: string, totalWeeks: number, weekNumber: number, dayOfWeek: number): string {
  const raceDow = new Date(`${raceDate}T00:00:00`).getDay() // 0=Sun..6=Sat
  const daysFromMondayToRace = raceDow === 0 ? 6 : raceDow - 1
  const planStart = addDaysStr(raceDate, -(totalWeeks * 7) - daysFromMondayToRace)
  return addDaysStr(planStart, (weekNumber - 1) * 7 + dayOfWeek)
}

async function persistPlan(
  goalRace: GoalRaceRow,
  totalWeeks: number,
  plan: GeneratedPlan,
): Promise<string[]> {
  const createdIds: string[] = []
  for (const week of plan.weeks) {
    for (const session of week.sessions) {
      const date = sessionDateFor(goalRace.race_date, totalWeeks, week.week_number, session.day_of_week)
      const { data: sessionRow, error: sessErr } = await adminClient
        .from('sessions')
        .insert({
          coach_id: goalRace.swimmer.coach_id,
          title: session.title,
          date,
          type: 'training',
          warm_up: renderBlockText(session.sets, 'warm_up'),
          main_set: renderBlockText(session.sets, 'main_set'),
          cool_down: renderBlockText(session.sets, 'cool_down'),
          goal_race_id: goalRace.id,
          plan_week_number: week.week_number,
          plan_phase: week.phase,
          plan_status: 'draft',
        })
        .select('id')
        .single()
      if (sessErr) throw sessErr

      await adminClient.from('session_assignments').insert({
        session_id: sessionRow.id,
        swimmer_id: goalRace.swimmer_id,
      })

      if (session.sets.length > 0) {
        const { error: setsErr } = await adminClient.from('plan_set_targets').insert(
          session.sets.map((s) => ({
            session_id: sessionRow.id,
            block: s.block,
            set_order: s.set_order,
            set_type: s.set_type ?? null,
            reps: s.reps,
            distance_meters: s.distance_meters,
            stroke: s.stroke ?? null,
            target_pace_seconds: s.target_pace_seconds ?? null,
            css_offset_seconds: s.css_offset_seconds ?? null,
            rest_seconds: s.rest_seconds ?? null,
            intensity_zone: s.intensity_zone ?? null,
          })),
        )
        if (setsErr) throw setsErr
      }

      createdIds.push(sessionRow.id)
    }
  }
  return createdIds
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: 'Plan generation is not configured (missing ANTHROPIC_API_KEY secret).' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Unauthorized' }, 401)

    const { goal_race_id, week_number } = await req.json()
    if (!goal_race_id || typeof goal_race_id !== 'string') {
      return json({ error: 'goal_race_id required' }, 400)
    }
    if (week_number !== undefined && (typeof week_number !== 'number' || week_number < 1)) {
      return json({ error: 'week_number must be a positive integer when provided' }, 400)
    }

    // Authorization boundary: caller must be the swimmer themselves or their
    // coach. Done against the admin client (RLS bypassed) since this check
    // *is* the access control here, evaluated explicitly rather than relying
    // on RLS inside a service-role connection (which wouldn't enforce it).
    const { data: goalRace, error: grErr } = await adminClient
      .from('goal_races')
      .select('*, swimmer:swimmers(*)')
      .eq('id', goal_race_id)
      .single()
    if (grErr || !goalRace) return json({ error: 'Goal race not found' }, 404)

    const gr = goalRace as unknown as GoalRaceRow
    const isOwner = gr.swimmer.profile_id === caller.id
    const isCoach = gr.swimmer.coach_id === caller.id
    if (!isOwner && !isCoach) return json({ error: 'Forbidden' }, 403)

    const today = localDateStr(new Date())
    const skeleton = computeTrainingPlanSkeleton(today, gr.race_date, gr.event_type)
    if (skeleton.totalWeeks < 1) {
      return json({ error: 'Race date has already passed — cannot generate a plan.' }, 400)
    }

    const weeksToGenerate = week_number
      ? skeleton.weeks.filter((w) => w.weekNumber === week_number)
      : skeleton.weeks
    if (week_number && weeksToGenerate.length === 0) {
      return json({ error: `Week ${week_number} is outside this plan (1-${skeleton.totalWeeks}).` }, 400)
    }

    const { data: cssResult } = await adminClient
      .from('css_results')
      .select('pace_per_100')
      .eq('swimmer_id', gr.swimmer_id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: pbs } = await adminClient
      .from('times')
      .select('stroke, distance, time_seconds')
      .eq('swimmer_id', gr.swimmer_id)
      .eq('is_pb', true)
      .order('recorded_at', { ascending: false })
      .limit(10)

    const availability = {
      days_per_week: gr.swimmer.days_per_week ?? 4,
      session_minutes: gr.swimmer.session_minutes ?? 60,
      preferred_days: gr.swimmer.preferred_days ?? [],
    }
    const cssPacePer100 = (cssResult?.pace_per_100 as number | undefined) ?? null

    const inputSnapshot = {
      goal_race: gr,
      skeleton,
      weeksToGenerate,
      cssPacePer100,
      recentPbs: pbs ?? [],
      availability,
    }

    // Logged before the model call so a crash mid-call still leaves a
    // record of exactly what was sent (Milestone 2 requirement: inspect or
    // regenerate a bad run without re-deriving inputs).
    const { data: run, error: runErr } = await adminClient
      .from('plan_generation_runs')
      .insert({
        goal_race_id,
        week_number: week_number ?? null,
        input_snapshot: inputSnapshot,
        model: MODEL,
        status: 'pending',
      })
      .select('id')
      .single()
    if (runErr) throw runErr

    let plan: GeneratedPlan
    try {
      // One Anthropic call per week rather than one call for the whole
      // batch — a full initial generation asking for every week (e.g. 6
      // weeks x 4 sessions x full set detail) in a single tool-use response
      // routinely exceeds max_tokens and comes back truncated (empty {}).
      // Weeks are independent (each only needs the skeleton/CSS/PBs, not
      // prior weeks' output), so this is safe to run in parallel.
      const weekPlans = await Promise.all(
        weeksToGenerate.map((week) => {
          const systemPrompt = buildSystemPrompt(gr, skeleton, [week], cssPacePer100, pbs ?? [], availability)
          return callAnthropic(systemPrompt)
        }),
      )
      const allWeeks: PlanWeekInput[] = weekPlans
        .flatMap((p) => p.weeks)
        .sort((a, b) => a.week_number - b.week_number)
      plan = { weeks: allWeeks }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await adminClient.from('plan_generation_runs').update({ status: 'error', error_message: message }).eq('id', run.id)
      return json({ error: 'Plan generation failed', detail: message }, 502)
    }

    await adminClient.from('plan_generation_runs').update({ status: 'success', output: plan }).eq('id', run.id)

    // Regenerating a single week must only replace that week's drafts —
    // confirmed sessions and every other week are untouched.
    if (week_number) {
      const { data: stale } = await adminClient
        .from('sessions')
        .select('id')
        .eq('goal_race_id', goal_race_id)
        .eq('plan_week_number', week_number)
        .eq('plan_status', 'draft')
      if (stale && stale.length > 0) {
        await adminClient.from('sessions').delete().in('id', stale.map((s) => s.id as string))
      }
    }

    const createdSessionIds = await persistPlan(gr, skeleton.totalWeeks, plan)

    return json({
      success: true,
      session_ids: createdSessionIds,
      weeks_generated: plan.weeks.map((w) => w.week_number),
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
