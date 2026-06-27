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

type DateRange = '30d' | '90d' | '365d' | 'all'

const RANGE_LABELS: Record<DateRange, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '365d': 'Last year',
  all: 'All time',
}

function PbDot(props: {
  cx?: number
  cy?: number
  payload?: { isPb: boolean }
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const isPb = payload?.isPb ?? false
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isPb ? 5 : 4}
      fill={isPb ? 'rgb(var(--c-accent))' : 'rgb(var(--c-primary))'}
      stroke={isPb ? 'rgb(var(--c-surface))' : 'none'}
      strokeWidth={isPb ? 1.5 : 0}
    />
  )
}

export function TimesChart({ times }: { times: SwimTime[] }) {
  const [stroke, setStroke] = useState<Stroke>('freestyle')
  const [range, setRange] = useState<DateRange>('all')

  const distances = useMemo(() => {
    const set = new Set(times.filter((t) => t.stroke === stroke).map((t) => t.distance))
    return [...set].sort((a, b) => a - b)
  }, [times, stroke])

  const [distance, setDistance] = useState<number | null>(null)
  const effectiveDistance = distance ?? distances[0] ?? null

  const cutoff = useMemo(() => {
    if (range === 'all') return null
    const ms = range === '30d' ? 30 : range === '90d' ? 90 : 365
    const d = new Date()
    d.setDate(d.getDate() - ms)
    return d
  }, [range])

  const data = useMemo(() => {
    if (effectiveDistance == null) return []
    return times
      .filter((t) => {
        if (t.stroke !== stroke || t.distance !== effectiveDistance) return false
        if (cutoff && new Date(t.recorded_at) < cutoff) return false
        return true
      })
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
  }, [times, stroke, effectiveDistance, cutoff])

  const hasPbs = data.some((d) => d.isPb)

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
          className="w-28"
          disabled={distances.length === 0}
        >
          {distances.map((d) => (
            <option key={d} value={d}>
              {d}m
            </option>
          ))}
        </Select>
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value as DateRange)}
          className="w-36"
        >
          {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
            <option key={r} value={r}>
              {RANGE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={<LineChartIcon className="h-6 w-6" />}
          title="No times for this filter"
          description="Try a different stroke, distance, or date range."
        />
      ) : (
        <>
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
                formatter={(v: number, _name, item) => [
                  `${formatTime(v)}${item.payload?.isPb ? ' 🏆 PB' : ''}`,
                  'Time',
                ]}
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
                dot={<PbDot />}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {hasPbs && (
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                Time logged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
                Personal best
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
