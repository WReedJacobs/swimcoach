import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { useSaveNutritionProfile } from '@/hooks/useNutritionProfile'
import {
  AGE_BRACKET_LABELS,
  TRAINING_VOLUME_LABELS,
  TYPICAL_SESSION_TIME_LABELS,
} from '@/types'
import type {
  AgeBracket,
  DietBase,
  NutritionProfile,
  TrainingVolume,
  TypicalSessionTime,
} from '@/types'

const DIET_BASE_OPTIONS: { value: DietBase; label: string }[] = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
]

/**
 * The only inputs are training-related and preference-related — no weight,
 * no BMI, per the feature's safety guardrails. Used both for first-time
 * setup (inline on the Nutrition pages) and editing (Settings modal).
 */
export function NutritionProfileSetup({
  initial,
  onSaved,
}: {
  initial?: NutritionProfile | null
  onSaved?: () => void
}) {
  const save = useSaveNutritionProfile()
  const [trainingVolume, setTrainingVolume] = useState<TrainingVolume>(initial?.training_volume ?? 'club')
  const [sessionTime, setSessionTime] = useState<TypicalSessionTime>(initial?.typical_session_time ?? 'afternoon_evening')
  const [ageBracket, setAgeBracket] = useState<AgeBracket>(initial?.age_bracket ?? '18_plus')
  const [dietBase, setDietBase] = useState<DietBase>(
    (initial?.diet_pattern.find((d): d is DietBase => d === 'omnivore' || d === 'vegetarian' || d === 'vegan')) ?? 'omnivore',
  )
  const [dairyFree, setDairyFree] = useState(initial?.diet_pattern.includes('dairy_free') ?? false)
  const [allergies, setAllergies] = useState(initial?.allergies ?? '')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      await save.mutateAsync({
        training_volume: trainingVolume,
        typical_session_time: sessionTime,
        age_bracket: ageBracket,
        diet_pattern: dairyFree ? [dietBase, 'dairy_free'] : [dietBase],
        allergies: allergies.trim() || null,
      })
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your nutrition profile')
    }
  }

  return (
    <div className="space-y-4">
      <Select
        label="Training volume"
        value={trainingVolume}
        onChange={(e) => setTrainingVolume(e.target.value as TrainingVolume)}
      >
        {(Object.keys(TRAINING_VOLUME_LABELS) as TrainingVolume[]).map((v) => (
          <option key={v} value={v}>{TRAINING_VOLUME_LABELS[v]}</option>
        ))}
      </Select>

      <div>
        <Select
          label="Typical session time"
          value={sessionTime}
          onChange={(e) => setSessionTime(e.target.value as TypicalSessionTime)}
        >
          {(Object.keys(TYPICAL_SESSION_TIME_LABELS) as TypicalSessionTime[]).map((v) => (
            <option key={v} value={v}>{TYPICAL_SESSION_TIME_LABELS[v]}</option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-text-muted">Early-morning sessions get a lighter, fasted-start snack card by default.</p>
      </div>

      <Select
        label="Age bracket"
        value={ageBracket}
        onChange={(e) => setAgeBracket(e.target.value as AgeBracket)}
      >
        {(Object.keys(AGE_BRACKET_LABELS) as AgeBracket[]).map((v) => (
          <option key={v} value={v}>{AGE_BRACKET_LABELS[v]}</option>
        ))}
      </Select>

      <Select
        label="Diet pattern"
        value={dietBase}
        onChange={(e) => setDietBase(e.target.value as DietBase)}
      >
        {DIET_BASE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={dairyFree}
          onChange={(e) => setDairyFree(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
        />
        Also dairy-free
      </label>

      <div>
        <Textarea
          label="Known allergies (optional)"
          placeholder="e.g. peanuts, gluten"
          rows={2}
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
        />
        <p className="mt-1 text-xs text-text-muted">Only used to filter food examples shown to you — not a medical safety feature.</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button leftIcon={<Save className="h-4 w-4" />} loading={save.isPending} onClick={submit}>
        Save nutrition profile
      </Button>
    </div>
  )
}
