import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Library, Search, PlayCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Input, Select } from '@/components/ui/Input'
import { Badge, LevelBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDrills } from '@/hooks/useDrills'
import { useAuth } from '@/hooks/useAuth'
import { STROKES } from '@/types'
import type { Drill, Stroke, Level } from '@/types'

type LevelFilter = 'all' | Level

export function DrillLibraryPage() {
  const { data: drills, isLoading } = useDrills()
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const usePlain = profile?.role === 'beginner' || profile?.level === 'beginner' || !profile

  const [query, setQuery] = useState('')
  const [stroke, setStroke] = useState<Stroke | 'all'>('all')
  const [level, setLevel] = useState<LevelFilter>('all')

  // Pre-set stroke from URL param (e.g. from stroke guide "related drills" links)
  useEffect(() => {
    const s = searchParams.get('stroke')
    if (s && (STROKES as readonly string[]).includes(s)) {
      setStroke(s as Stroke)
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    return (drills ?? []).filter((d) => {
      if (stroke !== 'all' && d.stroke !== stroke) return false
      if (level !== 'all' && d.level !== level) return false
      if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [drills, stroke, level, query])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Input
            placeholder="Search drills…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56 pl-9"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
        </div>
        <Select
          value={stroke}
          onChange={(e) => setStroke(e.target.value as Stroke | 'all')}
          className="w-40"
        >
          <option value="all">All strokes</option>
          {STROKES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </Select>
        <Select
          value={level}
          onChange={(e) => setLevel(e.target.value as LevelFilter)}
          className="w-40"
        >
          <option value="all">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="elite">Elite</option>
        </Select>
      </div>

      <div>
        <SectionHeader kicker={`DRILLS${filtered.length ? ` · ${filtered.length}` : ''}`} />
        {isLoading ? (
          <Card>Loading drills…</Card>
        ) : filtered.length === 0 && (drills ?? []).length === 0 && profile?.role === 'coach' ? (
          <EmptyState
            icon={<Library className="h-6 w-6" />}
            title="No drills yet"
            description="Run supabase/migrations/011_seed_drills.sql in the Supabase SQL Editor to populate the library."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Library className="h-6 w-6" />}
            title="No drills found"
            description="Try clearing your filters."
          />
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
      {drill.focus && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Focus: {drill.focus}
        </p>
      )}
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
