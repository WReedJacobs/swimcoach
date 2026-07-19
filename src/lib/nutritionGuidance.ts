import type { AgeBracket, DietBase, DietPattern, TrainingVolume, TypicalSessionTime } from '@/types'
import { NUTRITION_CARDS, REHYDRATION_NOTE, type FoodExample, type NutritionCard } from './nutritionContent'

/**
 * Pure, DOM-free branching logic: (profile, session) -> which cards to show,
 * with food examples already filtered for diet pattern + allergies. No
 * network calls, no React — see nutritionGuidance.test.ts.
 */

export interface NutritionGuidanceProfile {
  training_volume: TrainingVolume
  typical_session_time: TypicalSessionTime
  diet_pattern: DietPattern[]
  allergies: string | null
  age_bracket: AgeBracket
}

export interface NutritionSessionContext {
  /** True for sessions 60+ minutes, or high-intensity/race-pace — the one
   * real branch point the research draws for during-session fuelling. */
  isLongOrHigh: boolean
  isSecondSessionToday: boolean
}

function resolveDietBase(dietPattern: DietPattern[]): DietBase {
  if (dietPattern.includes('vegan')) return 'vegan'
  if (dietPattern.includes('vegetarian')) return 'vegetarian'
  return 'omnivore'
}

/** Filters food examples by diet base + dairy-free modifier + free-text
 * allergy terms. Allergy matching is a simple substring filter — this is
 * scoped as a food-example filter, not a medical/allergen-safety feature. */
export function filterFoodExamples(
  foods: FoodExample[],
  profile: Pick<NutritionGuidanceProfile, 'diet_pattern' | 'allergies'>,
): FoodExample[] {
  const base = resolveDietBase(profile.diet_pattern)
  const dairyFree = profile.diet_pattern.includes('dairy_free')
  const allergyTerms = (profile.allergies ?? '')
    .toLowerCase()
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  return foods.filter((food) => {
    if (!food.dietBases.includes(base)) return false
    if (dairyFree && food.containsDairy) return false
    if (allergyTerms.length > 0) {
      const haystackWords = `${food.label} ${(food.tags ?? []).join(' ')}`.toLowerCase().split(/\W+/).filter(Boolean)
      // Word-prefix match (not a plain substring check) so "peanuts" still
      // catches a "peanut" tag and vice versa — simple pluralization in
      // either direction, without a real stemmer.
      const isAllergen = allergyTerms.some((term) =>
        haystackWords.some((word) => word.startsWith(term) || term.startsWith(word)),
      )
      if (isAllergen) return false
    }
    return true
  })
}

function buildCard(
  kind: 'pre_session_fasted' | 'pre_session_standard' | 'during_session' | 'post_session',
  profile: NutritionGuidanceProfile,
): NutritionCard {
  const base = NUTRITION_CARDS[kind]
  return { ...base, foodExamples: filterFoodExamples(base.foodExamples, profile) }
}

function buildRehydrationCard(): NutritionCard {
  return {
    kind: 'rehydration_note',
    title: REHYDRATION_NOTE.title,
    timing: 'Between sessions',
    guidance: REHYDRATION_NOTE.guidance,
    foodExamples: [],
  }
}

/**
 * The session-matched card stack for "Today's fuelling". Order:
 * pre-session (fasted-start variant if the profile's typical session time is
 * morning, otherwise the standard meal variant) → during-session + recovery
 * only for 60+ minute / high-intensity sessions → a rehydration note if this
 * is a second session today.
 */
export function getNutritionCards(
  profile: NutritionGuidanceProfile,
  session: NutritionSessionContext,
): NutritionCard[] {
  const cards: NutritionCard[] = []

  const preKind = profile.typical_session_time === 'morning' ? 'pre_session_fasted' : 'pre_session_standard'
  cards.push(buildCard(preKind, profile))

  if (session.isLongOrHigh) {
    cards.push(buildCard('during_session', profile))
    cards.push(buildCard('post_session', profile))
  }

  if (session.isSecondSessionToday) {
    cards.push(buildRehydrationCard())
  }

  return cards
}
