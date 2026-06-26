import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Search, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { LevelBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { AddSwimmerModal } from './AddSwimmerModal'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useTimes } from '@/hooks/useTimes'
import { formatTime } from '@/lib/formatTime'
import { swimmerName } from '@/types'
import type { Level } from '@/types'

export function RosterPage() {
  const { data: swimmers, isLoading } = useSwimmers()
  const { data: times } = useTimes()
  const [modal, setModal] = useState(false)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [squad, setSquad] = useState<string>('all')

  const squads = useMemo(() => {
    const set = new Set((swimmers ?? []).map((s) => s.squad).filter(Boolean) as string[])
    return [...set]
  }, [swimmers])

  const latestBySwimmer = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of times ?? []) {
      if (!map.has(t.swimmer_id)) {
        map.set(t.swimmer_id, `${t.distance}m ${t.stroke} · ${formatTime(t.time_seconds)}`)
      }
    }
    return map
  }, [times])

  const filtered = useMemo(() => {
    return (swimmers ?? []).filter((s) => {
      if (level !== 'all' && s.level !== level) return false
      if (squad !== 'all' && s.squad !== squad) return false
      if (search && !swimmerName(s).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [swimmers, level, squad, search])

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Roster" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative">
            <Input
              placeholder="Search swimmers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-9"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          </div>
          <Select value={level} onChange={(e) => setLevel(e.target.value as Level | 'all')} className="w-40">
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="elite">Elite</option>
          </Select>
          <Select value={squad} onChange={(e) => setSquad(e.target.value)} className="w-40">
            <option value="all">All squads</option>
            {squads.map((sq) => (
              <option key={sq} value={sq}>
                {sq}
              </option>
            ))}
          </Select>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>
          Add swimmer
        </Button>
      </div>

      {isLoading ? (
        <SkeletonRows count={5} />
      ) : (swimmers ?? []).length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Add your first swimmer to get started"
          description="Build your roster, then log times and assign sessions."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>
              Add swimmer
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="No swimmers match your filters" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="flex items-center gap-3">
              <Avatar name={swimmerName(s)} />
              <div className="min-w-0 flex-1">
                <Link to={`/coach/roster/${s.id}`} className="block truncate font-medium text-text-primary hover:text-primary">
                  {swimmerName(s)}
                </Link>
                <div className="mt-0.5 flex items-center gap-2">
                  <LevelBadge level={s.level} />
                  {s.squad && <span className="text-xs text-text-muted">{s.squad}</span>}
                </div>
                <p className="mt-1 truncate font-mono text-xs tabular-nums text-text-secondary">
                  {latestBySwimmer.get(s.id) ?? 'No times logged'}
                </p>
              </div>
              <Link to="/coach/log">
                <Button variant="outline" size="sm" leftIcon={<Timer className="h-4 w-4" />}>
                  Log
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <AddSwimmerModal open={modal} onClose={() => setModal(false)} />
    </div>
  )
}
