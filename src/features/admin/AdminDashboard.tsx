import { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  MoreHorizontal,
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  Link2,
  Link2Off,
  KeyRound,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Bookmark,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { formatTime } from '@/lib/formatTime'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCards } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import type { Role, Level, Stroke, Drill, BookingStatus } from '@/types'
import { STROKES } from '@/types'
import {
  useAllProfiles,
  useAdminStats,
  useAllDrills,
  useAllBookings,
  useAdminActivity,
  useSignupsByDay,
  useSetAdmin,
  useUpdateUserRole,
  useUnlinkCoach,
  useLinkToCoach,
  useDeleteUser,
  useCreateDrill,
  useUpdateDrill,
  useDeleteDrill,
  useUpdateBookingStatus,
  type ProfileWithCoach,
  type ActivityItem,
} from '@/hooks/useAdmin'
import { useAllStats, useAdminRecalculate } from '@/hooks/useSwimmerStats'

// ─── Helpers ──────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const roleTone: Record<Role, 'blue' | 'green' | 'coral'> = {
  coach: 'blue',
  swimmer: 'green',
  beginner: 'coral',
}

const ROLES: Role[] = ['coach', 'swimmer', 'beginner']
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced', 'elite']

type Tab = 'Overview' | 'Users' | 'Coaches' | 'Drills' | 'Activity' | 'Bookings' | 'Ratings'
const TABS: Tab[] = ['Overview', 'Users', 'Coaches', 'Drills', 'Activity', 'Bookings', 'Ratings']

// ─── Overview tab ─────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats()
  const { data: activity } = useAdminActivity()
  const { data: profiles } = useAllProfiles()

  const nameMap = useMemo(
    () => new Map((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles],
  )

  return (
    <div className="space-y-8">
      {isLoading ? (
        <SkeletonCards />
      ) : (
        <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <StatTile label="Total users" value={stats?.total ?? 0} />
          <StatTile label="Coaches" value={stats?.coaches ?? 0} />
          <StatTile label="Swimmers" value={stats?.swimmers ?? 0} />
          <StatTile label="Beginners" value={stats?.beginners ?? 0} />
          <StatTile label="Admins" value={stats?.admins ?? 0} accent />
          <StatTile label="Sessions" value={stats?.sessions ?? 0} />
          <StatTile label="Times logged" value={stats?.times ?? 0} />
          <StatTile label="Bookings" value={stats?.bookings ?? 0} />
        </div>
      )}

      <Card>
        <CardHeader title="Recent activity" subtitle="Last 60 events across all users" />
        <ActivityFeed items={activity ?? []} nameMap={nameMap} />
      </Card>
    </div>
  )
}

// ─── Activity feed (shared) ────────────────────────────────────────────────

function ActivityFeed({
  items,
  nameMap,
}: {
  items: ActivityItem[]
  nameMap: Map<string, string>
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">No activity yet</p>
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        if (item.type === 'session') {
          return (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">
                  <span className="font-medium">{nameMap.get(item.coachId) ?? 'Coach'}</span>
                  {' created session '}
                  <span className="font-medium">"{item.title}"</span>
                </p>
                <p className="font-mono text-[10px] text-text-muted">{timeAgo(item.sortKey)}</p>
              </div>
            </li>
          )
        }
        if (item.type === 'time') {
          return (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">
                  <span className="font-medium">{nameMap.get(item.swimmerId) ?? 'Swimmer'}</span>
                  {' logged '}
                  <span className="font-mono font-medium">
                    {item.distance}m {item.stroke} — {formatTime(item.timeSeconds)}
                  </span>
                  {item.isPB && (
                    <Badge tone="amber" className="ml-2">
                      PB
                    </Badge>
                  )}
                </p>
                <p className="font-mono text-[10px] text-text-muted">{timeAgo(item.sortKey)}</p>
              </div>
            </li>
          )
        }
        // booking
        return (
          <li key={item.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Bookmark className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary">
                <span className="font-medium">{nameMap.get(item.swimmerId) ?? 'Swimmer'}</span>
                {' booked '}
                <span className="font-medium">{nameMap.get(item.coachId) ?? 'Coach'}</span>
                {' — '}
                <Badge
                  tone={
                    item.status === 'confirmed'
                      ? 'green'
                      : item.status === 'cancelled'
                        ? 'red'
                        : 'gray'
                  }
                >
                  {item.status}
                </Badge>
              </p>
              <p className="font-mono text-[10px] text-text-muted">{timeAgo(item.sortKey)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────

function UsersTab() {
  const { profile: me } = useAuth()
  const { data: profiles, isLoading, error } = useAllProfiles()
  const setAdmin = useSetAdmin()
  const updateRole = useUpdateUserRole()
  const unlinkCoach = useUnlinkCoach()
  const linkCoach = useLinkToCoach()
  const deleteUser = useDeleteUser()

  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [roleModal, setRoleModal] = useState<{ open: boolean; profile: ProfileWithCoach | null; role: Role }>({
    open: false,
    profile: null,
    role: 'swimmer',
  })
  const [linkModal, setLinkModal] = useState<{ open: boolean; profile: ProfileWithCoach | null; coachId: string }>({
    open: false,
    profile: null,
    coachId: '',
  })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; profile: ProfileWithCoach | null }>({
    open: false,
    profile: null,
  })
  const [resetStatus, setResetStatus] = useState<Record<string, 'idle' | 'sent' | 'error'>>({})

  const coaches = useMemo(
    () => (profiles ?? []).filter((p) => p.role === 'coach'),
    [profiles],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (profiles ?? []).filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q),
    )
  }, [profiles, search])

  useEffect(() => {
    if (!openMenu) return
    const close = () => setOpenMenu(null)
    setTimeout(() => document.addEventListener('click', close), 0)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  function exportCSV() {
    const rows = [
      ['Name', 'Email', 'Role', 'Coach', 'Admin', 'Joined'],
      ...(profiles ?? []).map((p) => [
        p.full_name,
        p.email ?? '',
        p.role,
        p.coachName ?? '—',
        p.is_admin ? 'yes' : 'no',
        fmtDate(p.created_at),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'swimphoria-users.csv',
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function sendReset(p: ProfileWithCoach) {
    if (!p.email) return
    setResetStatus((s) => ({ ...s, [p.id]: 'idle' }))
    const { error } = await supabase.auth.resetPasswordForEmail(p.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetStatus((s) => ({ ...s, [p.id]: error ? 'error' : 'sent' }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {error && (
        <p className="text-sm text-danger">
          Failed to load users — ensure the admin RLS policies are applied.
        </p>
      )}

      <Card>
        {isLoading ? (
          <SkeletonCards />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['User', 'Role', 'Coach', 'Joined', ''].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const isSelf = p.id === me?.id
                  return (
                    <tr key={p.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.full_name} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-text-primary">
                                {p.full_name}
                              </span>
                              {p.is_admin && (
                                <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                              )}
                              {isSelf && (
                                <span className="font-mono text-[9px] uppercase text-text-muted">
                                  you
                                </span>
                              )}
                            </div>
                            {p.email && (
                              <p className="truncate font-mono text-[10px] text-text-muted">
                                {p.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={roleTone[p.role]} className="capitalize">
                          {p.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-text-secondary">
                        {p.coachName ?? <span className="text-text-muted">—</span>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs tabular-nums text-text-muted">
                        {fmtDate(p.created_at)}
                      </td>
                      <td className="py-3">
                        <div className="relative flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenu(openMenu === p.id ? null : p.id)
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-component text-text-muted hover:bg-bg hover:text-text-primary"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openMenu === p.id && (
                            <div
                              className="absolute right-0 top-8 z-20 w-52 rounded-card border border-border bg-surface shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-1">
                                <MenuAction
                                  icon={<Shield className="h-4 w-4" />}
                                  label="Change role"
                                  onClick={() => {
                                    setRoleModal({ open: true, profile: p, role: p.role })
                                    setOpenMenu(null)
                                  }}
                                />
                                {p.role !== 'coach' && (
                                  <>
                                    <MenuAction
                                      icon={<Link2 className="h-4 w-4" />}
                                      label="Link to coach"
                                      onClick={() => {
                                        setLinkModal({ open: true, profile: p, coachId: p.coach_id ?? '' })
                                        setOpenMenu(null)
                                      }}
                                    />
                                    {p.coach_id && (
                                      <MenuAction
                                        icon={<Link2Off className="h-4 w-4" />}
                                        label="Unlink coach"
                                        onClick={() => {
                                          unlinkCoach.mutate(p.id)
                                          setOpenMenu(null)
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                                <MenuAction
                                  icon={<KeyRound className="h-4 w-4" />}
                                  label={
                                    resetStatus[p.id] === 'sent'
                                      ? 'Reset email sent ✓'
                                      : 'Send password reset'
                                  }
                                  disabled={!p.email || resetStatus[p.id] === 'sent'}
                                  onClick={() => {
                                    sendReset(p)
                                    setOpenMenu(null)
                                  }}
                                />
                                <MenuAction
                                  icon={<Shield className="h-4 w-4" />}
                                  label={p.is_admin ? 'Remove admin' : 'Make admin'}
                                  disabled={isSelf}
                                  onClick={() => {
                                    setAdmin.mutate({ id: p.id, isAdmin: !p.is_admin })
                                    setOpenMenu(null)
                                  }}
                                />
                                <div className="my-1 border-t border-border" />
                                <MenuAction
                                  icon={<Trash2 className="h-4 w-4" />}
                                  label="Delete user"
                                  danger
                                  disabled={isSelf}
                                  onClick={() => {
                                    setDeleteModal({ open: true, profile: p })
                                    setOpenMenu(null)
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-text-muted">No users match your search</p>
            )}
          </div>
        )}
      </Card>

      {/* Change role modal */}
      <Modal
        open={roleModal.open}
        onClose={() => setRoleModal((s) => ({ ...s, open: false }))}
        title="Change role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Changing role for{' '}
            <span className="font-medium text-text-primary">{roleModal.profile?.full_name}</span>
          </p>
          <Select
            label="Role"
            value={roleModal.role}
            onChange={(e) => setRoleModal((s) => ({ ...s, role: e.target.value as Role }))}
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setRoleModal((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              loading={updateRole.isPending}
              onClick={() => {
                if (!roleModal.profile) return
                updateRole.mutate(
                  { id: roleModal.profile.id, role: roleModal.role },
                  { onSuccess: () => setRoleModal((s) => ({ ...s, open: false })) },
                )
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link to coach modal */}
      <Modal
        open={linkModal.open}
        onClose={() => setLinkModal((s) => ({ ...s, open: false }))}
        title="Link to coach"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Assign a coach to{' '}
            <span className="font-medium text-text-primary">{linkModal.profile?.full_name}</span>
          </p>
          <Select
            label="Coach"
            value={linkModal.coachId}
            onChange={(e) => setLinkModal((s) => ({ ...s, coachId: e.target.value }))}
          >
            <option value="">— select coach —</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setLinkModal((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              loading={linkCoach.isPending}
              disabled={!linkModal.coachId}
              onClick={() => {
                if (!linkModal.profile || !linkModal.coachId) return
                linkCoach.mutate(
                  { userId: linkModal.profile.id, coachId: linkModal.coachId },
                  { onSuccess: () => setLinkModal((s) => ({ ...s, open: false })) },
                )
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal((s) => ({ ...s, open: false }))}
        title="Delete user"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Permanently delete{' '}
            <span className="font-medium text-text-primary">{deleteModal.profile?.full_name}</span>?
            This cannot be undone.
          </p>
          {deleteUser.error && (
            <p className="text-sm text-danger">{String(deleteUser.error)}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteModal((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteUser.isPending}
              onClick={() => {
                if (!deleteModal.profile) return
                deleteUser.mutate(deleteModal.profile.id, {
                  onSuccess: () => setDeleteModal((s) => ({ ...s, open: false })),
                })
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MenuAction({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-component px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text-secondary hover:bg-bg hover:text-text-primary',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Coaches tab ──────────────────────────────────────────────────────────

function CoachesTab() {
  const { data: profiles } = useAllProfiles()
  const unlinkCoach = useUnlinkCoach()
  const [expanded, setExpanded] = useState<string | null>(null)

  const coaches = useMemo(
    () => (profiles ?? []).filter((p) => p.role === 'coach'),
    [profiles],
  )
  const swimmersByCoach = useMemo(() => {
    const map = new Map<string, ProfileWithCoach[]>()
    ;(profiles ?? [])
      .filter((p) => p.role === 'swimmer' && p.coach_id)
      .forEach((p) => {
        const list = map.get(p.coach_id!) ?? []
        list.push(p)
        map.set(p.coach_id!, list)
      })
    return map
  }, [profiles])

  if (coaches.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">No coaches registered yet</p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coaches.map((coach) => {
        const swimmers = swimmersByCoach.get(coach.id) ?? []
        const isOpen = expanded === coach.id
        return (
          <Card key={coach.id}>
            <div className="flex items-start gap-3">
              <Avatar name={coach.full_name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{coach.full_name}</p>
                {coach.email && (
                  <p className="truncate font-mono text-[10px] text-text-muted">{coach.email}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone="gray">
                    {swimmers.length} swimmer{swimmers.length !== 1 ? 's' : ''}
                  </Badge>
                  {coach.join_code && (
                    <span className="font-mono text-[10px] text-text-muted">
                      code: {coach.join_code}
                    </span>
                  )}
                </div>
              </div>
              {swimmers.length > 0 && (
                <button
                  onClick={() => setExpanded(isOpen ? null : coach.id)}
                  className="shrink-0 text-text-muted hover:text-text-primary"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {isOpen && swimmers.length > 0 && (
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {swimmers.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 py-2">
                    <Avatar name={s.full_name} size="sm" />
                    <span className="flex-1 truncate text-sm text-text-secondary">
                      {s.full_name}
                    </span>
                    <button
                      onClick={() => unlinkCoach.mutate(s.id)}
                      disabled={unlinkCoach.isPending}
                      title="Unlink from coach"
                      className="shrink-0 text-text-muted hover:text-danger disabled:opacity-40"
                    >
                      <Link2Off className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ─── Drills tab ───────────────────────────────────────────────────────────

type DrillForm = {
  title: string
  description_plain: string
  description_technical: string
  stroke: Stroke | ''
  level: Level | ''
  video_url: string
}

const EMPTY_DRILL: DrillForm = {
  title: '',
  description_plain: '',
  description_technical: '',
  stroke: '',
  level: '',
  video_url: '',
}

function DrillsTab() {
  const { data: drills, isLoading } = useAllDrills()
  const createDrill = useCreateDrill()
  const updateDrill = useUpdateDrill()
  const deleteDrill = useDeleteDrill()

  const [editModal, setEditModal] = useState<{
    open: boolean
    id: string | null
    form: DrillForm
  }>({ open: false, id: null, form: EMPTY_DRILL })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null; title: string }>({
    open: false,
    id: null,
    title: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  function openAdd() {
    setFormError(null)
    setEditModal({ open: true, id: null, form: EMPTY_DRILL })
  }

  function openEdit(d: Drill) {
    setFormError(null)
    setEditModal({
      open: true,
      id: d.id,
      form: {
        title: d.title,
        description_plain: d.description_plain,
        description_technical: d.description_technical,
        stroke: d.stroke ?? '',
        level: d.level ?? '',
        video_url: d.video_url ?? '',
      },
    })
  }

  function setField<K extends keyof DrillForm>(key: K, value: DrillForm[K]) {
    setEditModal((s) => ({ ...s, form: { ...s.form, [key]: value } }))
  }

  function handleSave() {
    const { id, form } = editModal
    if (!form.title.trim()) {
      setFormError('Title is required')
      return
    }
    setFormError(null)
    const payload = {
      title: form.title.trim(),
      description_plain: form.description_plain.trim(),
      description_technical: form.description_technical.trim(),
      stroke: (form.stroke || null) as Stroke | null,
      level: (form.level || null) as Level | null,
      focus: null as string | null,
      video_url: form.video_url.trim() || null,
    }
    if (id) {
      updateDrill.mutate(
        { id, ...payload },
        { onSuccess: () => setEditModal((s) => ({ ...s, open: false })) },
      )
    } else {
      createDrill.mutate(payload, {
        onSuccess: () => setEditModal((s) => ({ ...s, open: false })),
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add drill
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonCards />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['Title', 'Stroke', 'Level', 'Description', ''].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(drills ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4 font-medium text-text-primary">{d.title}</td>
                    <td className="py-3 pr-4">
                      {d.stroke ? (
                        <Badge tone="blue" className="capitalize">
                          {d.stroke}
                        </Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {d.level ? (
                        <Badge tone="gray" className="capitalize">
                          {d.level}
                        </Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="max-w-xs py-3 pr-4 text-text-secondary">
                      <p className="truncate">{d.description_plain}</p>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="flex h-7 w-7 items-center justify-center rounded-component text-text-muted hover:bg-bg hover:text-text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({ open: true, id: d.id, title: d.title })
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-component text-text-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(drills ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-text-muted">No drills yet — add one above</p>
            )}
          </div>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal((s) => ({ ...s, open: false }))}
        title={editModal.id ? 'Edit drill' : 'Add drill'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={editModal.form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Stroke"
              value={editModal.form.stroke}
              onChange={(e) => setField('stroke', e.target.value as Stroke | '')}
            >
              <option value="">— any stroke —</option>
              {STROKES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </Select>
            <Select
              label="Level"
              value={editModal.form.level}
              onChange={(e) => setField('level', e.target.value as Level | '')}
            >
              <option value="">— any level —</option>
              {LEVELS.map((l) => (
                <option key={l} value={l} className="capitalize">
                  {l}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Plain description"
            rows={3}
            value={editModal.form.description_plain}
            onChange={(e) => setField('description_plain', e.target.value)}
          />
          <Textarea
            label="Technical description"
            rows={3}
            value={editModal.form.description_technical}
            onChange={(e) => setField('description_technical', e.target.value)}
          />
          <Input
            label="Video URL (optional)"
            type="url"
            value={editModal.form.video_url}
            onChange={(e) => setField('video_url', e.target.value)}
          />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setEditModal((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              loading={createDrill.isPending || updateDrill.isPending}
              onClick={handleSave}
            >
              {editModal.id ? 'Save changes' : 'Create drill'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal((s) => ({ ...s, open: false }))}
        title="Delete drill"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete <span className="font-medium text-text-primary">"{deleteModal.title}"</span>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteModal((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteDrill.isPending}
              onClick={() => {
                if (!deleteModal.id) return
                deleteDrill.mutate(deleteModal.id, {
                  onSuccess: () => setDeleteModal((s) => ({ ...s, open: false })),
                })
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Activity tab ─────────────────────────────────────────────────────────

function ActivityTab() {
  const { data: days } = useSignupsByDay()
  const { data: activity } = useAdminActivity()
  const { data: profiles } = useAllProfiles()

  const nameMap = useMemo(
    () => new Map((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles],
  )

  const maxCount = useMemo(
    () => Math.max(...(days ?? []).map((d) => d.count), 1),
    [days],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Signups — last 14 days" />
        <div className="flex h-28 items-end gap-1 pt-2">
          {(days ?? []).map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              {d.count > 0 && (
                <span className="font-mono text-[9px] text-text-muted">{d.count}</span>
              )}
              <div
                className="w-full rounded-sm bg-primary transition-all"
                style={{ height: Math.max(4, (d.count / maxCount) * 72) }}
              />
              <span className="font-mono text-[9px] text-text-muted">{d.dayLabel}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Recent events" />
        <div className="max-h-80 overflow-y-auto">
          <ActivityFeed items={activity ?? []} nameMap={nameMap} />
        </div>
      </Card>
    </div>
  )
}

// ─── Bookings tab ─────────────────────────────────────────────────────────

const BOOKING_STATUSES: Array<BookingStatus | 'all'> = ['all', 'pending', 'confirmed', 'cancelled']

function BookingsTab() {
  const { data: bookings, isLoading } = useAllBookings()
  const updateStatus = useUpdateBookingStatus()
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')

  const filtered = useMemo(
    () =>
      (bookings ?? []).filter(
        (b) => statusFilter === 'all' || b.status === statusFilter,
      ),
    [bookings, statusFilter],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BOOKING_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-component px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors',
              statusFilter === s
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:bg-bg hover:text-text-secondary',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <SkeletonCards />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['Swimmer', 'Coach', 'Status', 'Requested', 'Notes', ''].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 font-medium text-text-primary">{b.swimmerName}</td>
                    <td className="py-3 pr-4 text-text-secondary">{b.coachName}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        tone={
                          b.status === 'confirmed'
                            ? 'green'
                            : b.status === 'cancelled'
                              ? 'red'
                              : 'gray'
                        }
                        className="capitalize"
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs tabular-nums text-text-muted">
                      {fmtDate(b.requested_at)}
                    </td>
                    <td className="max-w-xs py-3 pr-4 text-text-secondary">
                      <p className="truncate">{b.notes ?? <span className="text-text-muted">—</span>}</p>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {b.status !== 'confirmed' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: b.id, status: 'confirmed' })}
                            disabled={updateStatus.isPending}
                            className="rounded-component px-2 py-1 font-mono text-[10px] uppercase text-secondary hover:bg-secondary/10 disabled:opacity-40"
                          >
                            Confirm
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: b.id, status: 'cancelled' })}
                            disabled={updateStatus.isPending}
                            className="rounded-component px-2 py-1 font-mono text-[10px] uppercase text-danger hover:bg-danger/10 disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-text-muted">No bookings</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Ratings tab ─────────────────────────────────────────────────────────

function RatingsTab() {
  const { data: allStats, isLoading } = useAllStats()
  const recalculate = useAdminRecalculate()
  const [recalcAll, setRecalcAll] = useState<{ running: boolean; done: number; total: number }>({
    running: false,
    done: 0,
    total: 0,
  })

  async function handleRecalcAll() {
    if (!allStats?.length) return
    setRecalcAll({ running: true, done: 0, total: allStats.length })
    for (const row of allStats) {
      await recalculate.mutateAsync(row.user_id).catch(() => null)
      setRecalcAll((s) => ({ ...s, done: s.done + 1 }))
    }
    setRecalcAll((s) => ({ ...s, running: false }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{allStats?.length ?? 0} swimmer profiles</p>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          loading={recalcAll.running}
          onClick={handleRecalcAll}
        >
          {recalcAll.running
            ? `${recalcAll.done} / ${recalcAll.total}`
            : 'Recalculate All'}
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonCards />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['User', 'OVR', 'SPD', 'END', 'TEC', 'CON', 'PRG', 'COM', 'Tier', 'Updated', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-3 pr-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted last:pr-0"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(allStats ?? []).map((row) => (
                  <tr key={row.user_id}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.profile?.full_name ?? '?'} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">
                            {row.profile?.full_name ?? 'Unknown'}
                          </p>
                          <p className="truncate font-mono text-[10px] text-text-muted capitalize">
                            {row.profile?.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 font-mono font-black tabular-nums text-text-primary">
                      {row.ovr}
                    </td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-text-secondary">{row.spd}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-text-secondary">{row.end_stat}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-text-secondary">{row.tec}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-text-secondary">{row.con}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-text-secondary">{row.prg}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-text-secondary">{row.com}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone="gray" className="capitalize">
                        {row.tier}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[10px] tabular-nums text-text-muted">
                      {fmtDate(row.last_calculated)}
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => recalculate.mutate(row.user_id)}
                        disabled={recalculate.isPending || recalcAll.running}
                        title="Recalculate stats"
                        className="flex h-7 w-7 items-center justify-center rounded-component text-text-muted hover:bg-bg hover:text-text-primary disabled:opacity-40"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(allStats ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-text-muted">
                No stats yet — run the migration and recalculate
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Admin" />

      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              'border-b-2 -mb-px',
              activeTab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Users' && <UsersTab />}
        {activeTab === 'Coaches' && <CoachesTab />}
        {activeTab === 'Drills' && <DrillsTab />}
        {activeTab === 'Activity' && <ActivityTab />}
        {activeTab === 'Bookings' && <BookingsTab />}
        {activeTab === 'Ratings' && <RatingsTab />}
      </div>
    </div>
  )
}
