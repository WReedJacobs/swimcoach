import { useMemo, useState } from 'react'
import { Library, Search, PlayCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Input, Select } from '@/components/ui/Input'
import { Badge, LevelBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDrills } from '@/hooks/useDrills'
import { useAuth } from '@/hooks/useAuth'
import { STROKES } from '@/types'
import type { Drill, Stroke } from '@/types'

export function DrillLibraryPage() {
  const { data: drills, isLoading } = useDrills()
  const { profile } = useAuth()
  // Level-aware language: beginners see plain descriptions, others see technical.
  const usePlain = profile?.role === 'beginner' || profile?.level === 'beginner' || !profile

  const [query, setQuery] = useState('')
  const [stroke, setStroke] = useState<Stroke | 'all'>('all')

  const filtered = useMemo(() => {
    return (drills ?? []).filter((d) => {
      if (stroke !== 'all' && d.stroke !== stroke) return false
      if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [drills, stroke, query])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Input placeholder="Search drills…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56 pl-9" />
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
        </div>
        <Select value={stroke} onChange={(e) => setStroke(e.target.value as Stroke | 'all')} className="w-40">
          <option value="all">All strokes</option>
          {STROKES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </Select>
      </div>

      <div>
        <SectionHeader kicker="DRILLS" />
        {isLoading ? (
          <Card>Loading drills…</Card>
        ) : filtered.length === 0 && (drills ?? []).length === 0 && profile?.role === 'coach' ? (
          <EmptyState
            icon={<Library className="h-6 w-6" />}
            title="No drills yet"
            description="The drill library is seeded from your database. Make sure to run the seed.sql file, or add drills directly in the Supabase dashboard."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Library className="h-6 w-6" />} title="No drills found" description="Try clearing your filters." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((d) => (
              <DrillCard key={d.id} drill={d} plain={usePlain} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DrillCard({ drill, plain }: { drill: Drill; plain: boolean }) {
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-text-primary">{drill.title}</h3>
        <div className="flex shrink-0 gap-1">
          {drill.stroke && <Badge tone="blue" className="capitalize">{drill.stroke}</Badge>}
          {drill.level && <LevelBadge level={drill.level} />}
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        {plain ? drill.description_plain : drill.description_technical}
      </p>
      {drill.video_url && (
        <a
          href={drill.video_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <PlayCircle className="h-4 w-4" /> Watch demo
        </a>
      )}
    </Card>
  )
}
