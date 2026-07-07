import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SwimmerCard } from '@/components/ui/SwimmerCard'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import {
  useLeaderboard,
  useSquadLeaderboard,
  type SwimmerStatsRow,
  type LeaderboardEntry,
} from '@/hooks/useSwimmerStats'

// ─── Types ─────────────────────────────────────────────────────────────────

type LeaderTab = 'Global' | 'My Squad' | 'By Stat'

type StatKey = keyof Pick<SwimmerStatsRow, 'spd' | 'end_stat' | 'tec' | 'con' | 'prg' | 'com'>

const STAT_OPTIONS: Array<{ key: StatKey; label: string }> = [
  { key: 'spd', label: 'Speed' },
  { key: 'end_stat', label: 'Endurance' },
  { key: 'tec', label: 'Technique' },
  { key: 'con', label: 'Consistency' },
  { key: 'prg', label: 'Progress' },
  { key: 'com', label: 'Commitment' },
]

// ─── Rank medal ────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="font-mono text-sm font-black" style={{ color: '#fde047' }}>
        #1
      </span>
    )
  if (rank === 2)
    return (
      <span className="font-mono text-sm font-black" style={{ color: '#d1d5db' }}>
        #2
      </span>
    )
  if (rank === 3)
    return (
      <span className="font-mono text-sm font-black" style={{ color: '#d97706' }}>
        #3
      </span>
    )
  return (
    <span className="font-mono text-sm font-semibold text-text-muted">#{rank}</span>
  )
}

// ─── Leader row ────────────────────────────────────────────────────────────

function LeaderRow({
  entry,
  rank,
  sortKey,
  myId,
  mostImprovedId,
}: {
  entry: LeaderboardEntry
  rank: number
  sortKey: string
  myId?: string
  mostImprovedId?: string
}) {
  const isMe = entry.user_id === myId
  const isImproved = entry.user_id === mostImprovedId
  const val = entry[sortKey as keyof SwimmerStatsRow] as number

  return (
    <li
      className={cn(
        'flex items-center gap-4 rounded-component px-3 py-3 transition-colors',
        isMe ? 'bg-primary/[0.07] ring-1 ring-primary/20' : 'hover:bg-bg',
      )}
    >
      <div className="w-8 text-center">
        <RankBadge rank={rank} />
      </div>
      <Avatar name={entry.profile?.display_handle || entry.profile?.full_name || '?'} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-text-primary">
            {entry.profile?.display_handle || entry.profile?.full_name || 'Unknown'}
          </span>
          {isMe && (
            <span className="font-mono text-[9px] uppercase text-text-muted">you</span>
          )}
          {isImproved && (
            <span className="flex items-center gap-0.5 font-mono text-[9px] uppercase text-secondary">
              <TrendingUp className="h-3 w-3" />
              improved
            </span>
          )}
        </div>
        <p className="text-xs capitalize text-text-muted">{entry.profile?.role ?? ''}</p>
      </div>
      <div className="text-right">
        <span className="font-mono text-lg font-black tabular-nums text-text-primary">{val}</span>
        <p className="font-mono text-[9px] uppercase text-text-muted">
          {sortKey === 'ovr' ? 'OVR' : sortKey.toUpperCase()}
        </p>
      </div>
      <div className="w-16 text-right">
        <Badge
          tone={
            entry.tier === 'mythic' || entry.tier === 'legend'
              ? 'blue'
              : entry.tier === 'elite' || entry.tier === 'gold'
                ? 'amber'
                : entry.tier === 'silver' || entry.tier === 'bronze'
                  ? 'gray'
                  : 'gray'
          }
          className="capitalize"
        >
          {entry.tier}
        </Badge>
      </div>
    </li>
  )
}

// ─── Podium (top 3 as cards) ───────────────────────────────────────────────

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 1) return null
  // Show top 3 in a row: 2nd | 1st | 3rd if ≥3 entries, otherwise just in order
  const top = entries.slice(0, Math.min(3, entries.length))
  const ordered = top.length === 3 ? [top[1], top[0], top[2]] : top
  const heights = top.length === 3 ? ['self-end', 'self-start', 'self-end'] : ['self-start']
  return (
    <div className="mb-6 flex items-end justify-center gap-4 pt-2">
      {ordered.map((e, i) => {
        const realRank = top.indexOf(e) + 1
        const displayName = e.profile?.display_handle || e.profile?.full_name || '?'
        return (
          <div key={e.user_id} className={`flex flex-col items-center gap-2 ${heights[i] ?? ''}`}>
            <RankBadge rank={realRank} />
            <SwimmerCard
              stats={e}
              name={displayName}
              avatarUrl={e.profile?.avatar_url}
              size="md"
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Board sub-component ───────────────────────────────────────────────────

function Board({
  entries,
  sortKey,
  myId,
  emptyMessage,
  showPodium = false,
}: {
  entries: LeaderboardEntry[]
  sortKey: string
  myId?: string
  emptyMessage?: string
  showPodium?: boolean
}) {
  const mostImprovedId = entries.reduce<{ id: string; gain: number } | null>((best, e) => {
    const gain = e.ovr - e.prev_ovr
    if (gain > 0 && (!best || gain > best.gain)) return { id: e.user_id, gain }
    return best
  }, null)?.id

  if (!entries.length) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        {emptyMessage ?? 'No entries yet'}
      </p>
    )
  }

  const podiumEntries = showPodium && sortKey === 'ovr' ? entries.slice(0, 3) : []
  const rowEntries = podiumEntries.length > 0 ? entries.slice(3) : entries

  return (
    <>
      {podiumEntries.length > 0 && <Podium entries={podiumEntries} />}
      {rowEntries.length > 0 && (
        <ul className="space-y-1">
          {rowEntries.map((e, i) => (
            <LeaderRow
              key={e.user_id}
              entry={e}
              rank={(podiumEntries.length > 0 ? 3 : 0) + i + 1}
              sortKey={sortKey}
              myId={myId}
              mostImprovedId={mostImprovedId}
            />
          ))}
        </ul>
      )}
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<LeaderTab>('Global')
  const [statKey, setStatKey] = useState<StatKey>('ovr' as unknown as StatKey)

  const squadCoachId =
    profile?.role === 'coach'
      ? profile.id
      : profile?.coach_id ?? null

  const { data: global = [] } = useLeaderboard(
    (statKey as unknown as string) === 'ovr' ? 'ovr' : (statKey as keyof SwimmerStatsRow),
  )
  const { data: squad = [] } = useSquadLeaderboard(squadCoachId)

  const TABS: LeaderTab[] = ['Global', 'My Squad', 'By Stat']

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Leaderboard" />

      {/* Tab bar */}
      <div className="flex border-b border-border">
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

      {activeTab === 'Global' && (
        <Card>
          <CardHeader
            title="Global ranking"
            subtitle="Top 20 public profiles by OVR"
          />
          <Board entries={global} sortKey="ovr" myId={user?.id} showPodium emptyMessage="No public profiles yet — enable Public in your profile settings" />
        </Card>
      )}

      {activeTab === 'My Squad' && (
        <Card>
          <CardHeader
            title="Squad ranking"
            subtitle={profile?.role === 'coach' ? "Your swimmers' OVR ranking" : "Swimmers with the same coach"}
          />
          {!squadCoachId ? (
            <p className="py-12 text-center text-sm text-text-muted">
              Connect to a coach to see your squad here
            </p>
          ) : (
            <Board entries={squad} sortKey="ovr" myId={user?.id} emptyMessage="No squad members found" />
          )}
        </Card>
      )}

      {activeTab === 'By Stat' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[{ key: 'ovr' as unknown as StatKey, label: 'Overall' }, ...STAT_OPTIONS].map(({ key, label }) => (
              <button
                key={String(key)}
                onClick={() => setStatKey(key)}
                className={cn(
                  'rounded-component px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors',
                  statKey === key
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-bg hover:text-text-secondary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Card>
            <CardHeader
              title={`Ranked by ${STAT_OPTIONS.find((s) => s.key === statKey)?.label ?? 'Overall'}`}
              subtitle="Public profiles only"
            />
            <Board
              entries={global}
              sortKey={String(statKey) === 'ovr' ? 'ovr' : (statKey as string)}
              myId={user?.id}
              emptyMessage="No public profiles yet"
            />
          </Card>
        </div>
      )}
    </div>
  )
}
