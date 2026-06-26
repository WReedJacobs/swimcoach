import { useMemo, useState } from 'react'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { TimesChart } from '@/components/charts/TimesChart'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useTimes } from '@/hooks/useTimes'
import { swimmerName } from '@/types'

export function ProgressPage() {
  const { data: swimmers } = useSwimmers()
  const [swimmerId, setSwimmerId] = useState<string>('')
  const effectiveId = swimmerId || swimmers?.[0]?.id || ''
  const { data: times } = useTimes(effectiveId || undefined)

  const selected = useMemo(
    () => swimmers?.find((s) => s.id === effectiveId),
    [swimmers, effectiveId],
  )

  if (!swimmers || swimmers.length === 0) {
    return (
      <EmptyState
        icon={<LineChartIcon className="h-6 w-6" />}
        title="No swimmers to chart yet"
        description="Add swimmers and log times to see progress."
      />
    )
  }

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Progress" />
      <Card>
      <CardHeader
        title="Progress charts"
        subtitle={selected ? swimmerName(selected) : undefined}
        action={
          <Select value={effectiveId} onChange={(e) => setSwimmerId(e.target.value)} className="w-48">
            {swimmers.map((s) => (
              <option key={s.id} value={s.id}>
                {swimmerName(s)}
              </option>
            ))}
          </Select>
        }
      />
      <TimesChart times={times ?? []} />
      </Card>
    </div>
  )
}
