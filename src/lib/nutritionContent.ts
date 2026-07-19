import type { AgeBracket, DietBase, TrainingVolume } from '@/types'

/**
 * Static, typed nutrition reference content — mirrors how the beginner
 * glossary/stroke-guide content is structured (plain data, filtered at
 * render time), keeping this framework-agnostic for the eventual RN port.
 *
 * Hard rules threaded through every entry here (see the feature spec):
 * no calorie counts, no weight/BMI framing, no "burn" language. Youth
 * copy only ever asks "are you fueling enough" — never "eat less".
 */

export type NutritionCardKind =
  | 'pre_session_fasted'
  | 'pre_session_standard'
  | 'during_session'
  | 'post_session'
  | 'rehydration_note'

export interface FoodExample {
  label: string
  /** Which base diets this fits — vegan items also fit vegetarian/omnivore. */
  dietBases: DietBase[]
  containsDairy: boolean
  /** Free-text tags an allergy filter can match against (e.g. 'nuts', 'gluten'). */
  tags?: string[]
}

export interface NutritionCard {
  kind: NutritionCardKind
  title: string
  timing: string
  guidance: string
  foodExamples: FoodExample[]
}

// ---------- Food examples, by card ----------

const FASTED_START_FOODS: FoodExample[] = [
  { label: 'Banana with peanut butter', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['nuts', 'peanut'] },
  { label: 'White toast with jam', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['gluten'] },
  { label: 'Pretzels', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['gluten'] },
  { label: 'Low-fibre cereal with milk', dietBases: ['omnivore', 'vegetarian'], containsDairy: true, tags: ['gluten', 'dairy'] },
  { label: 'Low-fibre cereal with oat milk', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['gluten'] },
  { label: 'Rice cakes with honey', dietBases: ['omnivore', 'vegetarian'], containsDairy: false },
  { label: 'A few dates', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false },
]

const STANDARD_PRE_MEAL_FOODS: FoodExample[] = [
  { label: 'Pasta with tomato sauce and grilled chicken', dietBases: ['omnivore'], containsDairy: false, tags: ['gluten'] },
  { label: 'Pasta with tomato sauce and beans', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['gluten'] },
  { label: 'Rice, grilled tofu and vegetables', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['soy'] },
  { label: 'Baked potato with cheese and beans', dietBases: ['omnivore', 'vegetarian'], containsDairy: true },
  { label: 'Sandwich with turkey, rice and vegetables', dietBases: ['omnivore'], containsDairy: false, tags: ['gluten'] },
  { label: 'Oatmeal with fruit and nut butter', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['nuts', 'gluten'] },
]

const DURING_SESSION_FOODS: FoodExample[] = [
  { label: 'Sports drink', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false },
  { label: 'Orange slices or other fruit', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false },
  { label: 'Granola bar', dietBases: ['omnivore', 'vegetarian'], containsDairy: false, tags: ['gluten', 'nuts'] },
  { label: 'Vegan granola/energy bar', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['gluten', 'nuts'] },
  { label: 'Diluted juice', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false },
]

const RECOVERY_FOODS: FoodExample[] = [
  { label: 'Chocolate milk', dietBases: ['omnivore', 'vegetarian'], containsDairy: true },
  { label: 'Fortified soy or oat milk with cocoa', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['soy'] },
  { label: 'Greek yoghurt smoothie with fruit', dietBases: ['omnivore', 'vegetarian'], containsDairy: true },
  { label: 'Soy or coconut yoghurt smoothie with fruit', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['soy'] },
  { label: 'Rice, chicken and vegetables', dietBases: ['omnivore'], containsDairy: false },
  { label: 'Rice, tofu or lentils and vegetables', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['soy'] },
  { label: 'Wrap with rice and beans', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['gluten'] },
]

// ---------- Cards ----------

export const NUTRITION_CARDS: Record<Exclude<NutritionCardKind, 'rehydration_note'>, NutritionCard> = {
  pre_session_fasted: {
    kind: 'pre_session_fasted',
    title: 'Before your swim',
    timing: '30–60 minutes before',
    guidance:
      "Training fasted after overnight glycogen depletion tends to feel sluggish and can blunt a session's quality, even though it's sometimes chosen for body-composition reasons — it doesn't reliably burn more fat over time. A small, low-fat, low-fibre, carb-forward snack close to an early session sits well and fuels without weighing you down.",
    foodExamples: FASTED_START_FOODS,
  },
  pre_session_standard: {
    kind: 'pre_session_standard',
    title: 'Before your swim',
    timing: 'A full meal 3–4 hours before, or a small snack 30–60 minutes before',
    guidance:
      'A proper meal a few hours out, topped up with a small carb-forward snack closer to the session, outperforms training on empty. This is the window to actually eat, not skip.',
    foodExamples: STANDARD_PRE_MEAL_FOODS,
  },
  during_session: {
    kind: 'during_session',
    title: 'During your swim',
    timing: 'Every 15–20 minutes, sessions 60+ minutes',
    guidance:
      'For longer or harder sessions, roughly 30–60g of carbohydrate per hour keeps output up, and a small amount of protein alongside it (5–10g/hr) adds a modest recovery edge. Shorter, easier sessions generally don\'t need this at all.',
    foodExamples: DURING_SESSION_FOODS,
  },
  post_session: {
    kind: 'post_session',
    title: 'After your swim',
    timing: 'Within the recovery window after finishing',
    guidance:
      'A roughly 3:1 carbohydrate-to-protein mix in the window after a session helps replenish glycogen and supports repair. It doesn\'t need to be exact — these all land in the right range.',
    foodExamples: RECOVERY_FOODS,
  },
}

export const REHYDRATION_NOTE = {
  title: 'Two sessions today',
  guidance:
    "Fully rehydrating between two sessions on the same day is genuinely hard to hit — give it deliberate attention rather than assuming you'll catch up by thirst alone.",
}

// ---------- Hydration education (v1.1) ----------

export const HYDRATION_EDUCATION = {
  headline: 'You probably need more than you feel like you need.',
  body:
    "Swimmers underestimate fluid needs more than almost any other athletes — you don't see or feel sweat the way runners do. Competitive swimmers still lose roughly 0.4–1.2 litres an hour (more in a heated pool), but the water's cooling effect suppresses thirst without reducing the actual loss. \"Drink when thirsty\" works less well here than in most other sports — treat hydration as something to check on deliberately, not just wait to feel.",
}

// ---------- Daily targets (v1.1) — ranges, never a quota ----------

export const CARB_TARGET_RANGES_G_PER_KG: Record<TrainingVolume, { min: number; max: number }> = {
  recreational: { min: 3, max: 5 },
  club: { min: 5, max: 8 },
  high_performance: { min: 8, max: 12 },
}

export const PROTEIN_TARGET_RANGE_G_PER_KG = { min: 1.4, max: 2.1 }
/** Vegan athletes are commonly advised toward the higher end (or ~10–20% more)
 * to offset lower digestibility of plant protein. */
export const PROTEIN_TARGET_RANGE_VEGAN_G_PER_KG = { min: 1.6, max: 2.4 }

export const DAILY_TARGETS_DISCLAIMER =
  'A range to aim for most days — not a daily quota. There\'s no tracking against this and no pass/fail here.'

// ---------- Tips library (v1.2) ----------

export interface NutritionTip {
  id: string
  title: string
  audience: 'youth' | 'vegan' | 'general'
  body: string
}

export const NUTRITION_TIPS: NutritionTip[] = [
  {
    id: 'youth-calcium-iron',
    title: 'Growing bones and iron — why this matters more right now',
    audience: 'youth',
    body:
      "During the pubertal growth spurt, calcium needs peak around 1300mg/day (roughly ages 9–18) because growing bones are more injury-prone under training load than fully-grown adult bone. Iron is also commonly under-consumed by young swimmers — girls especially — and running low can mean fatigue and slower recovery. Surveyed adolescent swimmers already tend to fall short on carbohydrate, calcium and iron: the question worth asking is usually \"am I eating enough,\" not less.",
  },
  {
    id: 'vegan-protein-nutrients',
    title: 'Fuelling well on a plant-based diet',
    audience: 'vegan',
    body:
      'Plant protein digests a little less efficiently than animal protein, so vegan athletes are often better served aiming at the higher end of the protein range (or roughly 10–20% more). The nutrients most worth keeping an eye on are B12, iron (pairing plant iron sources with vitamin C helps absorption), zinc and vitamin D — not because plant-based fuelling doesn\'t work, but because these are the ones that quietly run short first.',
  },
  {
    id: 'electrolytes-chlorine',
    title: 'Electrolytes and pool exposure',
    audience: 'general',
    body:
      "Sweat carries sodium and other electrolytes out even when you can't see it happening in the water. On longer or hotter sessions, a sports drink or an electrolyte-containing snack alongside your fluids covers more ground than water alone.",
  },
  {
    id: 'two-a-day-rehydration',
    title: 'Two-a-day rehydration',
    audience: 'general',
    body:
      "Swimmers training twice in a day rarely fully rehydrate between sessions — the gap is usually too short and thirst under-signals how much was actually lost. Treat the break between sessions as active rehydration time, not just rest.",
  },
]

export function tipsForAgeBracket(ageBracket: AgeBracket): NutritionTip[] {
  return NUTRITION_TIPS.filter((t) => t.audience === 'general' || (t.audience === 'youth' && ageBracket === 'under_18'))
}
