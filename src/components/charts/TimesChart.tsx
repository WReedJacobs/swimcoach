import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { LineChart as LineChartIcon } from 'lucide-react'
import { formatTime } from '@/lib/formatTime'
import { STROKES } from '@/types'
import type { SwimTime, Stroke } from '@/types'

/**
 * Line chart of times over date for a chosen stroke + distance.
 * Lower is better, so the Y axis is inverted.
 */
export function TimesChart({ times }: { times: SwimTime[] }) {
  const [stroke, setStroke] = useState<Stroke>('freestyle')

  // Distances available for the selected stroke.
  const distances = useMemo(() => {
    const set = new Set(times.filter((t) => t.stroke === stroke).map((t) => t.distance))
    return [...set].sort((a, b) => a - b)
  }, [times, stroke])

  const [distance, setDistance] = useState<number | null>(null)
  const effectiveDistance = distance ?? distances[0] ?? null

  const data = useMemo(() => {
    if (effectiveDistance == null) return []
    return times
      .filter((t) => t.stroke === stroke && t.distance === effectiveDistance)
      .slice()
      .sort((a, b) => +new Date(a.recorded_at) - +new Date(b.recorded_at))
      .map((t) => ({
        date: new Date(t.recorded_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        seconds: Number(t.time_seconds.toFixed(2)),
        isPb: t.is_pb,
      }))
  }, [times, stroke, effectiveDistance])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select
          value={stroke}
          onChange={(e) => {
            setStroke(e.target.value as Stroke)
            setDistance(null)
          }}
          className="w-40"
        >
          {STROKES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={effectiveDistance ?? ''}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="w-32"
          disabled={distances.length === 0}
        >
          {distances.map((d) => (
            <option key={d} value={d}>
              {d}m
            </option>
          ))}
        </Select>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={<LineChartIcon className="h-6 w-6" />}
          title="No times for this event yet"
          description="Log a few times for this stroke and distance to see a trend."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'rgb(var(--c-text-secondary))' }} />
            <YAxis
              reversed
              tick={{ fontSize: 12, fill: 'rgb(var(--c-text-secondary))' }}
              tickFormatter={(v) => formatTime(v)}
              width={60}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(v: number) => [formatTime(v), 'Time']}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid rgb(var(--c-border))',
                background: 'rgb(var(--c-surface))',
                color: 'rgb(var(--c-text-primary))',
              }}
            />
            <Line
              type="monotone"
              dataKey="seconds"
              stroke="rgb(var(--c-primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'rgb(var(--c-primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
