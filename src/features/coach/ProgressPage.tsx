import { useMemo, useState } from 'react'
import { LineChart as LineChartIcon, Users } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { TimesChart } from '@/components/charts/TimesChart'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useTimes } from '@/hooks/useTimes'
import { useAttendanceMatrix } from '@/hooks/useSessions'
import { swimmerName } from '@/types'

function AttendanceTable() {
  const { data: att } = useAttendanceMatrix()

  if (!att || att.tableSessions.length === 0) return null

  return (
    <Card>
      <CardHeader title="Attendance" subtitle="Last 10 sessions" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-6 text-left font-medium text-text-secondary">Session</th>
              {att.tableSwimmers.map((sw) => (
                <th key={sw.id} className="px-3 py-2 text-center font-medium text-text-secondary">
                  <span className="block max-w-[72px] truncate">{sw.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {att.tableSessions.map((session) => (
              <tr key={session.id} className="border-b border-border/40 last:border-0">
                <td className="py-2 pr-6">
                  <p className="font-medium text-text-primary">{session.title}</p>
                  <p className="font-mono text-xs tabular-nums text-text-muted">
                    {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </td>
                {att.tableSwimmers.map((sw) => {
                  const cell = att.matrix[session.id]?.[sw.id]
                  return (
                    <td key={sw.id} className="px-3 py-2 text-center">
                      {cell === true ? (
                        <span className="font-mono text-secondary">✓</span>
                      ) : (
                        <span className="font-mono text-text-muted">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function ProgressPage() {
  const { data: swimmers } = useSwimmers()
  const { data: att } = useAttendanceMatrix()
  const [swimmerId, setSwimmerId] = useState<string>('')
  const effectiveId = swimmerId || swimmers?.[0]?.id || ''
  const { data: times } = useTimes(effectiveId || undefined)

  const selected = useMemo(
    () => swimmers?.find((s) => s.id === effectiveId),
    [swimmers, effectiveId],
  )

  const hasAttendance = (att?.tableSessions.length ?? 0) > 0 || (att?.sessionsThisMonth ?? 0) > 0

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Progress" />

      {/* Attendance analytics */}
      <div className="space-y-4">
        <SectionHeader kicker="Attendance" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Sessions this month"
            value={att?.sessionsThisMonth ?? '—'}
            accent
          />
          <StatTile
            label="Avg attendance rate"
            value={att?.avgAttendanceRate != null ? att.avgAttendanceRate : '—'}
            unit={att?.avgAttendanceRate != null ? '%' : undefined}
          />
          <StatTile
            label="Most consistent"
            value={
              <span className="text-2xl font-semibold text-text-primary">
                {att?.mostConsistentName ?? '—'}
              </span>
            }
            hint="Last 30 days"
          />
          <StatTile
            label="0% attendance sessions"
            value={
              <span className={att?.zeroAttendanceSessions ? 'text-danger' : undefined}>
                {att?.zeroAttendanceSessions ?? '—'}
              </span>
            }
            hint={att?.zeroAttendanceSessions ? 'Sessions where no one attended' : undefined}
          />
        </div>
        {hasAttendance && <AttendanceTable />}
        {!hasAttendance && (
          <Card>
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No session data yet"
              description="Create sessions and assign swimmers to see attendance analytics."
            />
          </Card>
        )}
      </div>

      {/* Progress charts */}
      {!swimmers || swimmers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LineChartIcon className="h-6 w-6" />}
            title="No swimmers to chart yet"
            description="Add swimmers and log times to see progress."
          />
        </Card>
      ) : (
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
      )}
    </div>
  )
}
