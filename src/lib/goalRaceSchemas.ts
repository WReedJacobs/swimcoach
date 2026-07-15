// Zod schemas for the goal-race training plan generator. Framework-agnostic
// (no DOM/React deps) so the same file works for the Milestone 3 form and
// the Milestone 2 edge function's structured LLM output validation.
import { z } from 'zod'
// Relative import with an explicit /index.ts — also imported directly by
// the generate-training-plan edge function under Deno, which needs the
// full path (no directory-index resolution like Vite/tsc do).
import { GOAL_EVENT_TYPES, GOAL_PRIORITIES, PLAN_PHASES } from '../types/index.ts'

// ─── Goal race form input (Milestone 3) ────────────────────────────────────

export const goalRaceInputSchema = z.object({
  name: z.string().min(2, 'Enter a race name'),
  race_date: z.string().refine((d) => !isNaN(Date.parse(d)) && d > '', 'Enter a valid date'),
  event_type: z.enum(GOAL_EVENT_TYPES as [string, ...string[]]),
  distance_meters: z.number().int().positive('Enter a distance'),
  priority: z.enum(GOAL_PRIORITIES as [string, ...string[]]).default('A'),
  target_time_seconds: z.number().positive().nullable().optional(),
})
export type GoalRaceInput = z.infer<typeof goalRaceInputSchema>

// ─── Training availability (swimmer profile) ───────────────────────────────

export const trainingAvailabilitySchema = z.object({
  days_per_week: z.number().int().min(1).max(14),
  session_minutes: z.number().int().positive(),
  preferred_days: z.array(z.string()).default([]),
})
export type TrainingAvailabilityInput = z.infer<typeof trainingAvailabilitySchema>

// ─── LLM structured output (Milestone 2) ───────────────────────────────────
// This is the shape the edge function asks Anthropic's tool-use to return.
// Deliberately strict — the phase/taper boundaries are computed in code
// (see phaseCalculator, added alongside Milestone 2) and passed to the LLM
// as hard constraints; this schema is what keeps the LLM inside them
// structurally rather than trusting free text.

export const planSetSchema = z.object({
  block: z.enum(['warm_up', 'main_set', 'cool_down']),
  set_order: z.number().int().nonnegative(),
  set_type: z.string().nullable().optional(),
  reps: z.number().int().positive(),
  distance_meters: z.number().int().positive(),
  stroke: z.enum(['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'IM']).nullable().optional(),
  target_pace_seconds: z.number().positive().nullable().optional(),
  css_offset_seconds: z.number().nullable().optional(),
  rest_seconds: z.number().nonnegative().nullable().optional(),
  intensity_zone: z.string().nullable().optional(),
})
export type PlanSetInput = z.infer<typeof planSetSchema>

export const planSessionSchema = z.object({
  title: z.string().min(1),
  /** 0 = Monday .. 6 = Sunday, matching preferred_days convention. */
  day_of_week: z.number().int().min(0).max(6),
  sets: z.array(planSetSchema).min(1),
})
export type PlanSessionInput = z.infer<typeof planSessionSchema>

export const planWeekSchema = z.object({
  week_number: z.number().int().positive(),
  phase: z.enum(PLAN_PHASES as [string, ...string[]]),
  sessions: z.array(planSessionSchema),
})
export type PlanWeekInput = z.infer<typeof planWeekSchema>

export const generatedPlanSchema = z.object({
  // Tool-use output for a single requested week occasionally comes back
  // as a bare week object (array wrapper dropped) or as that array/object
  // double-encoded into a JSON string — tolerate both rather than
  // rejecting an otherwise-valid plan.
  weeks: z.preprocess((val) => {
    if (typeof val === 'string') val = JSON.parse(val)
    return Array.isArray(val) ? val : [val]
  }, z.array(planWeekSchema).min(1)),
})
export type GeneratedPlan = z.infer<typeof generatedPlanSchema>
