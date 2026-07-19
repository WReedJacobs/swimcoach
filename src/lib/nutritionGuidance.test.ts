import { describe, it, expect } from 'vitest'
import { filterFoodExamples, getNutritionCards, type NutritionGuidanceProfile } from './nutritionGuidance'
import type { FoodExample } from './nutritionContent'

function makeProfile(overrides: Partial<NutritionGuidanceProfile>): NutritionGuidanceProfile {
  return {
    training_volume: 'club',
    typical_session_time: 'afternoon_evening',
    diet_pattern: ['omnivore'],
    allergies: null,
    age_bracket: '18_plus',
    ...overrides,
  }
}

describe('filterFoodExamples', () => {
  const foods: FoodExample[] = [
    { label: 'Chicken and rice', dietBases: ['omnivore'], containsDairy: false },
    { label: 'Chocolate milk', dietBases: ['omnivore', 'vegetarian'], containsDairy: true },
    { label: 'Peanut butter banana', dietBases: ['omnivore', 'vegetarian', 'vegan'], containsDairy: false, tags: ['nuts'] },
  ]

  it('includes only foods compatible with the omnivore base', () => {
    const result = filterFoodExamples(foods, { diet_pattern: ['omnivore'], allergies: null })
    expect(result.map((f) => f.label)).toEqual(['Chicken and rice', 'Chocolate milk', 'Peanut butter banana'])
  })

  it('excludes meat/fish-only items for a vegan base', () => {
    const result = filterFoodExamples(foods, { diet_pattern: ['vegan'], allergies: null })
    expect(result.map((f) => f.label)).toEqual(['Peanut butter banana'])
  })

  it('excludes dairy items when dairy-free is set, independent of base', () => {
    const result = filterFoodExamples(foods, { diet_pattern: ['omnivore', 'dairy_free'], allergies: null })
    expect(result.map((f) => f.label)).toEqual(['Chicken and rice', 'Peanut butter banana'])
  })

  it('filters out items matching a free-text allergy term', () => {
    const result = filterFoodExamples(foods, { diet_pattern: ['vegan'], allergies: 'peanuts' })
    expect(result).toEqual([])
  })
})

describe('getNutritionCards', () => {
  it('gives only a pre-session card for a short/moderate session', () => {
    const cards = getNutritionCards(makeProfile({}), { isLongOrHigh: false, isSecondSessionToday: false })
    expect(cards.map((c) => c.kind)).toEqual(['pre_session_standard'])
  })

  it('adds during-session and post-session cards for a 60+ minute or high-intensity session', () => {
    const cards = getNutritionCards(makeProfile({}), { isLongOrHigh: true, isSecondSessionToday: false })
    expect(cards.map((c) => c.kind)).toEqual(['pre_session_standard', 'during_session', 'post_session'])
  })

  it('uses the fasted-start pre-session card for morning-session profiles', () => {
    const cards = getNutritionCards(
      makeProfile({ typical_session_time: 'morning' }),
      { isLongOrHigh: false, isSecondSessionToday: false },
    )
    expect(cards.map((c) => c.kind)).toEqual(['pre_session_fasted'])
  })

  it('appends a rehydration note for a second session of the day', () => {
    const cards = getNutritionCards(makeProfile({}), { isLongOrHigh: true, isSecondSessionToday: true })
    expect(cards.map((c) => c.kind)).toEqual(['pre_session_standard', 'during_session', 'post_session', 'rehydration_note'])
  })

  it('filters every card\'s food examples through the profile\'s diet pattern', () => {
    const cards = getNutritionCards(
      makeProfile({ diet_pattern: ['vegan'], typical_session_time: 'morning' }),
      { isLongOrHigh: false, isSecondSessionToday: false },
    )
    for (const card of cards) {
      for (const food of card.foodExamples) {
        expect(food.dietBases).toContain('vegan')
      }
    }
  })
})
