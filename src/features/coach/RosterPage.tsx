import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Users, Search, Timer, Copy, Check, RefreshCw,
  Pencil, Trash2, ChevronDown,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { LevelBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { AddSwimmerModal } from './AddSwimmerModal'
import { useSwimmers, useUpdateSwimmer, useDeleteSwimmer } from '@/hooks/useSwimmers'
import { useTimes } from '@/hooks/useTimes'
import { useMyJoinCode } from '@/hooks/useJoinCode'
import { formatTime } from '@/lib/formatTime'
import { cn } from '@/lib/cn'
import { swimmerName } from '@/types'
import type { Level, Swimmer } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function avgLevelLabel(list: Swimmer[]): string {
  const scores: Record<string, number> = { beginner: 0, intermediate: 1, elite: 2 }
  const avg = list.reduce((s, sw) => s + (scores[sw.level] ?? 0), 0) / list.length
  if (avg < 0.5) return 'Beginner avg'
  if (avg < 1.5) return 'Intermediate avg'
  return 'Elite avg'
}

// ─── sub-components ──────────────────────────────────────────────────────────

function JoinCodeCard() {
  const { code, generate, generating } = useMyJoinCode()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mb-6">
      <CardHeader
        title="Swimmer join code"
        subtitle="Share this code with swimmers — they enter it on their dashboard to link to your roster instantly."
      />
      {code ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-component border border-border bg-bg px-4 py-3">
            <span className="font-mono text-2xl font-bold tracking-[0.3em] text-primary">
              {code}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
            onClick={copy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={generating}
            onClick={generate}
            title="Generate a new code"
          >
            New
          </Button>
        </div>
      ) : (
        <Button leftIcon={<Plus className="h-4 w-4" />} loading={generating} onClick={generate}>
          Generate join code
        </Button>
      )}
    </Card>
  )
}

function EditSwimmerModal({ swimmer, onClose }: { swimmer: Swimmer; onClose: () => void }) {
  const updateSwimmer = useUpdateSwimmer()
  const [name, setName] = useState(swimmer.display_name)
  const [email, setEmail] = useState(swimmer.invite_email ?? '')
  const [level, setLevel] = useState<Level>(swimmer.level)
  const [squad, setSquad] = useState(swimmer.squad ?? '')
  const [notes, setNotes] = useState(swimmer.notes ?? '')

  const save = async () => {
    await updateSwimmer.mutateAsync({
      id: swimmer.id,
      full_name: name.trim(),
      email: email.trim(),
      level,
      squad: squad.trim(),
      notes: notes.trim(),
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Edit swimmer">
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="elite">Elite</option>
          </Select>
          <Input label="Squad (optional)" value={squad} onChange={(e) => setSquad(e.target.value)} />
        </div>
        <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={updateSwimmer.isPending} disabled={!name.trim()} onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function EditSquadModal({ swimmer, onClose }: { swimmer: Swimmer; onClose: () => void }) {
  const updateSwimmer = useUpdateSwimmer()
  const [squad, setSquad] = useState(swimmer.squad ?? '')

  const save = async () => {
    await updateSwimmer.mutateAsync({
      id: swimmer.id,
      full_name: swimmer.display_name,
      squad: squad.trim(),
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Edit squad">
      <div className="space-y-4">
        <Input
          label="Squad name"
          placeholder="e.g. Sprint Squad"
          value={squad}
          onChange={(e) => setSquad(e.target.value)}
          hint="Leave blank to remove from squad"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={updateSwimmer.isPending} onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function SwimmerCard({
  s,
  latestTime,
  onEdit,
  onEditSquad,
  onDelete,
}: {
  s: Swimmer
  latestTime: string | undefined
  onEdit: () => void
  onEditSquad: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group flex items-center gap-3">
      <Avatar name={swimmerName(s)} />
      <div className="min-w-0 flex-1">
        <Link
          to={`/coach/roster/${s.id}`}
          className="block truncate font-medium text-text-primary hover:text-primary"
        >
          {swimmerName(s)}
        </Link>
        <div className="mt-0.5 flex items-center gap-2">
          <LevelBadge level={s.level} />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditSquad() }}
            className="flex items-center gap-1 rounded text-xs text-text-muted hover:text-primary"
            title="Edit squad"
          >
            {s.squad
              ? <span>{s.squad}</span>
              : <span className="hidden group-hover:inline">+ squad</span>}
            <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
          </button>
        </div>
        <p className="mt-1 truncate font-mono text-xs tabular-nums text-text-secondary">
          {latestTime ?? 'No times logged'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link to="/coach/log">
          <Button variant="outline" size="sm" leftIcon={<Timer className="h-4 w-4" />}>
            Log
          </Button>
        </Link>
        <button
          onClick={onEdit}
          className="hidden rounded p-1.5 text-text-muted hover:bg-bg hover:text-text-primary group-hover:flex"
          title="Edit swimmer"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="hidden rounded p-1.5 text-text-muted hover:bg-bg hover:text-danger group-hover:flex"
          title="Delete swimmer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function RosterPage() {
  const { data: swimmers, isLoading } = useSwimmers()
  const { data: times } = useTimes()
  const deleteSwimmer = useDeleteSwimmer()
  const [modal, setModal] = useState(false)
  const [editSwimmer, setEditSwimmer] = useState<Swimmer | null>(null)
  const [editSquadSwimmer, setEditSquadSwimmer] = useState<Swimmer | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Swimmer | null>(null)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [squadFilter, setSquadFilter] = useState<string>('all')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const squads = useMemo(() => {
    const set = new Set((swimmers ?? []).map((s) => s.squad).filter(Boolean) as string[])
    return [...set]
  }, [swimmers])

  const hasAnySquad = useMemo(() => (swimmers ?? []).some((s) => s.squad), [swimmers])

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
      if (squadFilter !== 'all' && s.squad !== squadFilter) return false
      if (search && !swimmerName(s).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [swimmers, level, squadFilter, search])

  // Squad groups — null means "show flat list"
  const squadGroups = useMemo(() => {
    if (!hasAnySquad) return null
    const map = new Map<string, Swimmer[]>()
    for (const s of filtered) {
      const key = s.squad ?? ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a === '' && b !== '') return 1
      if (b === '' && a !== '') return -1
      return a.localeCompare(b)
    })
    return keys.map((k) => ({ squadName: k || null, swimmers: map.get(k)! }))
  }, [filtered, hasAnySquad])

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const swimmerCard = (s: Swimmer) => (
    <SwimmerCard
      key={s.id}
      s={s}
      latestTime={latestBySwimmer.get(s.id)}
      onEdit={() => setEditSwimmer(s)}
      onEditSquad={() => setEditSquadSwimmer(s)}
      onDelete={() => setConfirmDelete(s)}
    />
  )

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Roster" />
      <JoinCodeCard />
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
          <Select value={squadFilter} onChange={(e) => setSquadFilter(e.target.value)} className="w-40">
            <option value="all">All squads</option>
            {squads.map((sq) => (
              <option key={sq} value={sq}>{sq}</option>
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
          description="Add swimmers manually below, or share your join code above so swimmers can link themselves to your roster instantly."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>
              Add swimmer
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="No swimmers match your filters" />
      ) : squadGroups ? (
        // Grouped view
        <div className="space-y-6">
          {squadGroups.map(({ squadName, swimmers: groupSwimmers }) => {
            const key = squadName ?? '__ungrouped__'
            const isCollapsed = collapsed.has(key)
            return (
              <div key={key}>
                <button
                  onClick={() => toggleCollapse(key)}
                  className="mb-2 flex w-full items-center gap-2 rounded-component px-1 py-1.5 text-left hover:bg-bg"
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-text-muted transition-transform',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  <span className="font-semibold text-text-primary">
                    {squadName ?? 'Ungrouped'}
                  </span>
                  <span className="text-sm text-text-secondary">
                    · {groupSwimmers.length} swimmer{groupSwimmers.length !== 1 ? 's' : ''}
                  </span>
                  <span className="ml-auto text-xs text-text-muted">
                    {avgLevelLabel(groupSwimmers)}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {groupSwimmers.map(swimmerCard)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Flat view (no squads assigned at all)
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(swimmerCard)}
        </div>
      )}

      <AddSwimmerModal open={modal} onClose={() => setModal(false)} />
      {editSwimmer && <EditSwimmerModal swimmer={editSwimmer} onClose={() => setEditSwimmer(null)} />}
      {editSquadSwimmer && <EditSquadModal swimmer={editSquadSwimmer} onClose={() => setEditSquadSwimmer(null)} />}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-text-primary">Remove {swimmerName(confirmDelete)}?</p>
            <p className="mt-1 text-sm text-text-secondary">
              This removes the swimmer from your roster. Their times and session history will also be deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteSwimmer.isPending}
                onClick={async () => {
                  await deleteSwimmer.mutateAsync(confirmDelete.id)
                  setConfirmDelete(null)
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
