import { useState } from 'react'
import { Loader2, Pencil, Droplet } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { Modal } from '@/components/ui/Modal'
import { NutritionProfileSetup } from './NutritionProfileSetup'
import { useNutritionProfile } from '@/hooks/useNutritionProfile'
import { useTodayHydrationLogs, useLogHydration } from '@/hooks/useHydrationLogs'
import { getNutritionCards } from '@/lib/nutritionGuidance'
import {
  CARB_TARGET_RANGES_G_PER_KG,
  DAILY_TARGETS_DISCLAIMER,
  HYDRATION_EDUCATION,
  PROTEIN_TARGET_RANGE_G_PER_KG,
  PROTEIN_TARGET_RANGE_VEGAN_G_PER_KG,
  tipsForAgeBracket,
  type NutritionCard,
} from '@/lib/nutritionContent'

const HYDRATION_TAP_AMOUNTS = [250, 500, 750]

function NutritionCardView({ card, tone }: { card: NutritionCard; tone: 'primary' | 'coral' }) {
  return (
    <Card>
      <CardHeader title={card.title} subtitle={card.timing} />
      <p className="text-sm text-text-secondary">{card.guidance}</p>
      {card.foodExamples.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {card.foodExamples.map((food) => (
            <li
              key={food.label}
              className={`rounded-full border px-3 py-1 text-xs ${tone === 'coral' ? 'border-coral/20 bg-coral/10 text-coral' : 'border-primary/20 bg-primary/10 text-primary'}`}
            >
              {food.label}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** Shared full page content for /swimmer/nutrition and /beginner/nutrition —
 * identical logic, just a different accent tone (coral on beginner). */
export function NutritionPageContent({ tone }: { tone: 'primary' | 'coral' }) {
  const { data: profile, isLoading } = useNutritionProfile()
  const { data: hydrationLogs } = useTodayHydrationLogs()
  const logHydration = useLogHydration()
  const [editOpen, setEditOpen] = useState(false)
  const [isLongOrHigh, setIsLongOrHigh] = useState(true)
  const [isSecondSessionToday, setIsSecondSessionToday] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-xl space-y-8">
        <SectionHeader kicker="Nutrition" />
        <Card>
          <CardHeader
            title="Set up your nutrition profile"
            subtitle="A few quick training and preference questions — nothing about weight or body size."
          />
          <NutritionProfileSetup />
        </Card>
      </div>
    )
  }

  const cards = getNutritionCards(profile, { isLongOrHigh, isSecondSessionToday })
  const totalMl = (hydrationLogs ?? []).reduce((sum, l) => sum + l.amount_ml, 0)
  const tips = tipsForAgeBracket(profile.age_bracket)
  const carbRange = CARB_TARGET_RANGES_G_PER_KG[profile.training_volume]
  const proteinRange = profile.diet_pattern.includes('vegan') ? PROTEIN_TARGET_RANGE_VEGAN_G_PER_KG : PROTEIN_TARGET_RANGE_G_PER_KG
  const accentText = tone === 'coral' ? 'text-coral' : 'text-primary'

  return (
    <div className="max-w-2xl space-y-10">
      <SectionHeader
        kicker="Nutrition"
        action={
          <Button variant="outline" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)}>
            Edit profile
          </Button>
        }
      />

      {/* Today's fueling */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Today's fuelling</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isLongOrHigh}
              onChange={(e) => setIsLongOrHigh(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            Today's swim is 60+ min or race-pace
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSecondSessionToday}
              onChange={(e) => setIsSecondSessionToday(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            This is my second session today
          </label>
        </div>
        <div className="space-y-4">
          {cards.map((card) => (
            <NutritionCardView key={card.kind} card={card} tone={tone} />
          ))}
        </div>
      </div>

      {/* Hydration */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Hydration</h2>
        <Card>
          <p className={`font-medium ${accentText}`}>{HYDRATION_EDUCATION.headline}</p>
          <p className="mt-2 text-sm text-text-secondary">{HYDRATION_EDUCATION.body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <StatTile label="Today" value={totalMl.toLocaleString()} unit="ml" accent={tone === 'primary'} />
            <div className="flex flex-wrap gap-2">
              {HYDRATION_TAP_AMOUNTS.map((ml) => (
                <Button
                  key={ml}
                  variant="secondary"
                  size="sm"
                  leftIcon={<Droplet className="h-3.5 w-3.5" />}
                  loading={logHydration.isPending}
                  onClick={() => logHydration.mutate(ml)}
                >
                  +{ml}ml
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Daily targets */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Your daily targets</h2>
        <Card>
          <p className="text-sm text-text-secondary">{DAILY_TARGETS_DISCLAIMER}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatTile label="Carbohydrate" value={`${carbRange.min}–${carbRange.max}`} unit="g/kg/day" />
            <StatTile label="Protein" value={`${proteinRange.min}–${proteinRange.max}`} unit="g/kg/day" />
          </div>
        </Card>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Tips</h2>
          <div className="space-y-3">
            {tips.map((tip) => (
              <Card key={tip.id}>
                <CardHeader title={tip.title} />
                <p className="text-sm text-text-secondary">{tip.body}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit nutrition profile">
        <NutritionProfileSetup initial={profile} onSaved={() => setEditOpen(false)} />
      </Modal>
    </div>
  )
}
