// Milestone 6 — race-week checklist. Pure, framework-agnostic, static
// content parameterized by days-to-race — deliberately not another LLM
// call (per the build prompt): this is the same handful of logistics
// reminders for every swimmer, just revealed progressively as race day
// approaches, so unit-testable like the rest of src/lib.

export type ChecklistCategory = 'sleep' | 'nutrition' | 'logistics' | 'gear'

export interface ChecklistItem {
  id: string
  category: ChecklistCategory
  text: string
  /** Item only appears once daysToRace is at or below this value.
   * Omitted = relevant for the whole taper. */
  withinDays?: number
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Sleep
  { id: 'sleep-consistent', category: 'sleep', text: 'Keep a consistent sleep schedule this week — same bed and wake time every day.' },
  { id: 'sleep-early-night-before', category: 'sleep', text: 'Get to bed extra early the night before — race nerves often cut sleep short.', withinDays: 1 },

  // Nutrition
  { id: 'nutrition-hydrate', category: 'nutrition', text: 'Keep hydration up through the week — training volume is down, but fluid needs don\'t drop with it.' },
  { id: 'nutrition-avoid-new-foods', category: 'nutrition', text: 'Avoid trying new foods, restaurants, or supplements this week.', withinDays: 3 },
  { id: 'nutrition-carb-load', category: 'nutrition', text: 'Shift toward a carbohydrate-heavy dinner the night before.', withinDays: 1 },
  { id: 'nutrition-familiar-breakfast', category: 'nutrition', text: 'Eat a familiar, already-tested breakfast on race morning — nothing new.', withinDays: 0 },

  // Logistics
  { id: 'logistics-venue-check', category: 'logistics', text: 'Confirm check-in time, parking, and venue directions.', withinDays: 5 },
  { id: 'logistics-warmup-plan', category: 'logistics', text: 'Plan your warm-up window and where you\'ll do it before the race.', withinDays: 2 },
  { id: 'logistics-arrival-time', category: 'logistics', text: 'Set an alarm early enough to arrive with buffer for parking, check-in, and queues.', withinDays: 1 },

  // Gear
  { id: 'gear-check-suit', category: 'gear', text: 'Check your race suit/wetsuit for wear and confirm it still fits well.', withinDays: 7 },
  { id: 'gear-required-cap', category: 'gear', text: 'Confirm you have the event-required cap — colour and branding rules vary by race.', withinDays: 5 },
  { id: 'gear-goggles-spare', category: 'gear', text: 'Pack a spare pair of goggles — always bring two.', withinDays: 2 },
  { id: 'gear-lay-out', category: 'gear', text: 'Lay out everything you need the night before: suit, goggles, cap, towel, snacks.', withinDays: 1 },
]

/** Returns the checklist items relevant at `daysToRace` days out —
 * progressively longer as race day approaches. Deterministic, no
 * randomness or external state. */
export function buildRaceWeekChecklist(daysToRace: number): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => item.withinDays == null || daysToRace <= item.withinDays)
}
