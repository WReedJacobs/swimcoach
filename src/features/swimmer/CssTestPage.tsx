import { useState, useEffect } from 'react'
import { Gauge, Save, Info, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatTile } from '@/components/ui/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useMyCssResult, useSaveCssResult, useAcceptCssTweak } from '@/hooks/useCssResults'
import { useCssTweakSuggestion } from '@/hooks/usePlanSetResults'
import { formatTime, parseTime } from '@/lib/formatTime'
import {
  calculateCss,
  paceForDistance,
  buildSetTarget,
  PACE_ZONES,
  CSS_LONG,
  CSS_SHORT,
} from '@/lib/cssCalculator'

interface StoredTrial {
  t400: number
  t200: number
}

const PACE_DISTANCES = [50, 100, 200, 400]

export function CssTestPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: dbResult } = useMyCssResult()
  const saveCssResult = useSaveCssResult()
  const { data: tweakSuggestion } = useCssTweakSuggestion(swimmer?.id)
  const acceptTweak = useAcceptCssTweak()
  // Dismissing is local-only and keyed to the specific suggestion, so a
  // genuinely new suggestion (different tier/pace) still surfaces even if
  // an earlier one was dismissed.
  const [dismissedKey, setDismissedKey] = useLocalStorage<string | null>(
    `swimcoach:css-tweak-dismissed:${swimmer?.id ?? 'me'}`,
    null,
  )
  const suggestionKey = tweakSuggestion
    ? `${tweakSuggestion.tier}:${tweakSuggestion.direction}:${tweakSuggestion.suggestedPacePer100.toFixed(1)}`
    : null
  const showSuggestion = Boolean(tweakSuggestion) && suggestionKey !== dismissedKey

  const acceptSuggestion = async () => {
    if (!swimmer?.id || !tweakSuggestion) return
    await acceptTweak.mutateAsync({ swimmer_id: swimmer.id, pace_per_100: tweakSuggestion.suggestedPacePer100 })
    setDismissedKey(null)
  }

  // localStorage fallback for offline / pre-account use
  const [stored, setStored] = useLocalStorage<StoredTrial | null>(
    `swimcoach:css:${swimmer?.id ?? 'me'}`,
    null,
  )

  // When swimmer row first becomes available, migrate anonymous trial data
  // from the 'me' fallback key into the id-scoped key so data survives login.
  useEffect(() => {
    if (!swimmer?.id) return
    const meKey = 'swimcoach:css:me'
    const meRaw = localStorage.getItem(meKey)
    if (!meRaw) return
    const idKey = `swimcoach:css:${swimmer.id}`
    if (!localStorage.getItem(idKey)) {
      localStorage.setItem(idKey, meRaw)
    }
    localStorage.removeItem(meKey)
  }, [swimmer?.id])

  const [long, setLong] = useState('')
  const [short, setShort] = useState('')

  const longSecs = parseTime(long)
  const shortSecs = parseTime(short)
  const previewCss =
    longSecs != null && shortSecs != null ? calculateCss(longSecs, shortSecs) : null
  const canSave = previewCss != null

  const save = async () => {
    if (longSecs == null || shortSecs == null || !canSave || !previewCss) return
    // Always update localStorage for offline access
    setStored({ t400: longSecs, t200: shortSecs })
    // Sync to Supabase when swimmer is linked
    if (swimmer?.id) {
      await saveCssResult.mutateAsync({
        swimmer_id: swimmer.id,
        t400: longSecs,
        t200: shortSecs,
        pace_per_100: previewCss.pacePer100,
      })
    }
    setLong('')
    setShort('')
  }

  // The raw 400/200 trial times, when there are any to show — an accepted
  // CSS tweak (source = 'adjustment') has no time trial behind it.
  const rawTrial: StoredTrial | null =
    dbResult && dbResult.t400 != null && dbResult.t200 != null
      ? { t400: dbResult.t400, t200: dbResult.t200 }
      : !dbResult
        ? stored
        : null

  // Supabase is the source of truth. Trust its stored pace_per_100 directly
  // rather than recomputing from t400/t200 — that also works uniformly for
  // an adjustment row, which has no t400/t200 at all.
  const css = dbResult
    ? { pacePer100: dbResult.pace_per_100, speedMps: 100 / dbResult.pace_per_100 }
    : stored
      ? calculateCss(stored.t400, stored.t200)
      : null

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader kicker="Test" />
        <Card>
          <CardHeader
            title="Critical Swim Speed test"
            subtitle={`Swim an all-out ${CSS_LONG}m and ${CSS_SHORT}m, then enter your times. CSS is the pace your training sets are built around.`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={`${CSS_LONG}m time`}
              placeholder="5:00.0"
              value={long}
              onChange={(e) => setLong(e.target.value)}
              error={long.length > 0 && longSecs == null ? 'Invalid time' : undefined}
            />
            <Input
              label={`${CSS_SHORT}m time`}
              placeholder="2:25.0"
              value={short}
              onChange={(e) => setShort(e.target.value)}
              error={short.length > 0 && shortSecs == null ? 'Invalid time' : undefined}
            />
          </div>
          {longSecs != null && shortSecs != null && !previewCss && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
              <Info className="h-4 w-4" />
              Your {CSS_LONG}m time must be slower than your {CSS_SHORT}m time.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              disabled={!canSave}
              loading={saveCssResult.isPending}
              onClick={save}
            >
              Save CSS
            </Button>
            {previewCss && (
              <p className="text-sm text-text-secondary">
                ≈ <span className="font-semibold text-text-primary">{formatTime(previewCss.pacePer100)}</span> / 100m
              </p>
            )}
          </div>
          {dbResult && (
            <p className="mt-2 text-xs text-text-muted">
              Last saved {new Date(dbResult.recorded_at).toLocaleDateString()} · visible to your coach
            </p>
          )}
        </Card>
      </div>

      {showSuggestion && tweakSuggestion && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader
            title="CSS pace suggestion"
            subtitle={`Your CSS pace looks ~${Math.round(Math.abs(tweakSuggestion.avgDeviationPct) * 100)}% ${
              tweakSuggestion.direction === 'faster' ? 'conservative' : 'aggressive'
            } based on your last 3 CSS-anchored sessions — update to ${formatTime(tweakSuggestion.suggestedPacePer100)}/100m?`}
          />
          <div className="flex items-center gap-2">
            <Button
              leftIcon={<Sparkles className="h-4 w-4" />}
              loading={acceptTweak.isPending}
              onClick={acceptSuggestion}
            >
              Update to {formatTime(tweakSuggestion.suggestedPacePer100)}
            </Button>
            <Button variant="ghost" onClick={() => setDismissedKey(suggestionKey)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {!css ? (
        <EmptyState
          icon={<Gauge className="h-6 w-6" />}
          title="No CSS recorded yet"
          description="Enter a 400m and 200m time trial above to unlock pace targets and training zones."
        />
      ) : (
        <>
          <div>
            <SectionHeader kicker="Results" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile
                label="CSS pace"
                value={`${formatTime(css.pacePer100)}`}
                hint="per 100m"
                accent
              />
              <StatTile
                label="Speed"
                value={`${css.speedMps.toFixed(2)} m/s`}
                hint="sustainable"
              />
              {rawTrial ? (
                <StatTile
                  label="From trial"
                  value={`${formatTime(rawTrial.t400)} / ${formatTime(rawTrial.t200)}`}
                  hint={`${CSS_LONG}m · ${CSS_SHORT}m`}
                />
              ) : (
                <StatTile
                  label="Source"
                  value="Training-based"
                  hint="adjusted from recent CSS-anchored sets"
                />
              )}
            </div>
          </div>

          <div>
            <SectionHeader kicker="Pace" />
            <Card>
              <CardHeader title="Pace targets at CSS" subtitle="What threshold pace looks like across distances" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PACE_DISTANCES.map((d) => (
                  <div key={d} className="rounded-component bg-bg p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{d}m</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-text-primary">
                      {formatTime(paceForDistance(css.pacePer100, d) ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <SectionHeader kicker="Zones" />
            <Card>
              <CardHeader
                title="Training zones"
                subtitle="Pace per 100m for each effort, relative to your CSS"
              />
              <div className="space-y-1">
                {PACE_ZONES.map((z) => {
                  const target = paceForDistance(css.pacePer100, 100, z.offsetPer100)
                  const sign = z.offsetPer100 > 0 ? `+${z.offsetPer100}` : z.offsetPer100 === 0 ? '±0' : `${z.offsetPer100}`
                  return (
                    <div
                      key={z.key}
                      className="flex items-center justify-between rounded-component px-3 py-2 text-sm odd:bg-bg"
                    >
                      <span className="font-medium text-text-primary">{z.label}</span>
                      <span className="text-text-secondary">
                        CSS {sign}s · <span className="font-mono font-semibold text-text-primary">{formatTime(target ?? 0)}</span> /100m
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div>
            <SectionHeader kicker="Sample set" />
            <Card>
              <CardHeader title="Sample threshold set" subtitle="Built from your CSS, at CSS+2 with ~15s rest" />
              {(() => {
                const set = buildSetTarget(css.pacePer100, 8, 100, 2, 15)
                if (!set) return null
                return (
                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">
                      {set.reps} × {set.distance}m
                    </span>{' '}
                    @ {formatTime(set.repSeconds)} — leave on{' '}
                    <span className="font-semibold">{formatTime(set.sendOffSeconds)}</span>
                  </p>
                )
              })()}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
