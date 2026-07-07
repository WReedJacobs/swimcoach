// SwimmerCard — "Fixed art" component.
// This file uses self-contained hex colors and is exempt from the Deepwater token rule.
// See DESIGN.md § "Fixed-art components".

import { useRef, useState } from 'react'
import { Lock, Info, Share2, ChevronUp, ChevronDown } from 'lucide-react'
import { toPng } from 'html-to-image'
import type { SwimmerStatsRow } from '@/hooks/useSwimmerStats'
import { formatTime } from '@/lib/formatTime'

// ─── Tier configuration ────────────────────────────────────────────────────────

type Tier = 'rookie' | 'bronze' | 'silver' | 'gold' | 'elite' | 'legend' | 'mythic'

interface TierConfig {
  label: string
  borderStyle: React.CSSProperties
  bgStyle: React.CSSProperties
  textColor: string
  ovrColor: string
  wrapperClass?: string
}

const TIER_CONFIG: Record<Tier, TierConfig> = {
  rookie: {
    label: 'Rookie',
    borderStyle: { background: 'linear-gradient(135deg, #6b7280, #9ca3af)' },
    bgStyle: { background: 'linear-gradient(160deg, #1a1f27 0%, #0f1319 100%)' },
    textColor: '#9ca3af',
    ovrColor: '#d1d5db',
  },
  bronze: {
    label: 'Bronze',
    borderStyle: { background: 'linear-gradient(135deg, #92400e, #d97706, #b45309)' },
    bgStyle: { background: 'linear-gradient(160deg, #1c1508 0%, #0f0c04 100%)' },
    textColor: '#d97706',
    ovrColor: '#f59e0b',
  },
  silver: {
    label: 'Silver',
    borderStyle: { background: 'linear-gradient(135deg, #6b7280, #e5e7eb, #9ca3af)' },
    bgStyle: { background: 'linear-gradient(160deg, #18191f 0%, #0c0d12 100%)' },
    textColor: '#d1d5db',
    ovrColor: '#f9fafb',
  },
  gold: {
    label: 'Gold',
    borderStyle: { background: 'linear-gradient(135deg, #ca8a04, #fde047, #b45309)' },
    bgStyle: { background: 'linear-gradient(160deg, #1a1500 0%, #0d0b00 100%)' },
    textColor: '#fbbf24',
    ovrColor: '#fde047',
  },
  elite: {
    label: 'Elite',
    borderStyle: { background: 'linear-gradient(135deg, #0891b2, #22d3ee, #0e7490)' },
    bgStyle: { background: 'linear-gradient(160deg, #00161a 0%, #000e12 100%)' },
    textColor: '#22d3ee',
    ovrColor: '#67e8f9',
  },
  legend: {
    label: 'Legend',
    borderStyle: { background: 'linear-gradient(135deg, #7c3aed, #a78bfa, #6d28d9)' },
    bgStyle: { background: 'linear-gradient(160deg, #0f0018 0%, #07000f 100%)' },
    textColor: '#a78bfa',
    ovrColor: '#c4b5fd',
  },
  mythic: {
    label: 'Mythic',
    borderStyle: {},
    bgStyle: { background: 'linear-gradient(160deg, #1a0010 0%, #0a000a 100%)' },
    textColor: '#f0abfc',
    ovrColor: '#f0abfc',
    wrapperClass: 'mythic-card-wrapper',
  },
}

// ─── Fixed stat colors ─────────────────────────────────────────────────────────

function statBarColor(val: number): string {
  if (val >= 90) return '#22d3ee'
  if (val >= 75) return '#4ade80'
  if (val >= 60) return '#94a3b8'
  if (val >= 40) return '#fbbf24'
  return '#f87171'
}

// ─── Position badge ────────────────────────────────────────────────────────────

const STROKE_TO_POS: Record<string, string> = {
  freestyle: 'FR',
  backstroke: 'BK',
  breaststroke: 'BR',
  butterfly: 'FLY',
  IM: 'IM',
}

function positionBadge(mainStroke: string | null | undefined): string {
  return mainStroke ? (STROKE_TO_POS[mainStroke] ?? 'SWIM') : 'SWIM'
}

// ─── Ratings explainer ────────────────────────────────────────────────────────

const STAT_TIPS: [string, string][] = [
  ['SPD', 'Speed — PBs logged and CSS T-pace.'],
  ['END', 'Endurance — total distance, milestones, weekly sessions.'],
  ['TEC', 'Technique — drill activity, stroke variety, coach feedback.'],
  ['CON', 'Consistency — daily/weekly streaks. Decays after 2 inactive weeks.'],
  ['PRG', 'Progress — goals achieved and personal bests.'],
  ['COM', 'Commitment — active days, structured sessions, goals, having a coach.'],
]

// ─── Share helper ──────────────────────────────────────────────────────────────

async function shareCard(el: HTMLElement, name: string) {
  try {
    const dataUrl = await toPng(el, { pixelRatio: 2 })
    const blob = await (await fetch(dataUrl)).blob()
    const fileName = `${name.replace(/\s+/g, '-').toLowerCase()}-swimcard.png`
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] })
    } else {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = fileName
      a.click()
    }
  } catch {
    // ignore
  }
}

// ─── Stat row ──────────────────────────────────────────────────────────────────

function StatRow({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  const color = statBarColor(value)
  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <span
        className="font-mono text-[10px] font-semibold tracking-wider uppercase w-6"
        style={{ color: '#6b7280' }}
      >
        {label}
      </span>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: compact ? 3 : 4, background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span
        className="font-mono text-xs font-bold tabular-nums w-6 text-right"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SwimmerCardProps {
  stats: SwimmerStatsRow
  name: string
  avatarUrl?: string | null
  club?: string | null
  size?: 'sm' | 'md' | 'lg'
  locked?: boolean
}

// ─── OVR delta display ─────────────────────────────────────────────────────────

function OvrDelta({ stats }: { stats: SwimmerStatsRow }) {
  const delta = stats.ovr - stats.prev_ovr
  if (delta === 0) return null
  const positive = delta > 0
  return (
    <span
      className="flex items-center gap-0.5 font-mono text-[9px] font-semibold"
      style={{ color: positive ? '#4ade80' : '#f87171' }}
    >
      {positive ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {positive ? '+' : ''}{delta}
    </span>
  )
}

// ─── Small variant ─────────────────────────────────────────────────────────────

function CardSm({ stats, name, locked }: SwimmerCardProps) {
  const cfg = TIER_CONFIG[(stats.tier as Tier) ?? 'rookie']
  const delta = stats.ovr - stats.prev_ovr
  return (
    <div
      className={`p-[2px] rounded-component ${cfg.wrapperClass ?? ''}`}
      style={!cfg.wrapperClass ? cfg.borderStyle : undefined}
    >
      <div className="flex items-center gap-3 rounded-[4px] px-3 py-2" style={cfg.bgStyle}>
        {locked ? (
          <span className="font-mono text-sm font-bold w-8 text-center" style={{ color: '#6b7280' }}>?</span>
        ) : (
          <div className="flex flex-col items-center w-8">
            <span className="font-mono text-sm font-bold" style={{ color: cfg.ovrColor }}>
              {stats.ovr}
            </span>
            {delta !== 0 && (
              <span
                className="font-mono text-[8px] font-semibold leading-none"
                style={{ color: delta > 0 ? '#4ade80' : '#f87171' }}
              >
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
        )}
        <span className="text-sm font-medium flex-1 truncate" style={{ color: '#f1f5f9' }}>
          {name}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.textColor }}>
          {cfg.label}
        </span>
      </div>
    </div>
  )
}

// ─── Ratings explainer overlay ────────────────────────────────────────────────

function RatingsPopover({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-72 rounded-card border border-border bg-surface p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          How ratings work
        </p>
        <ul className="space-y-2">
          {STAT_TIPS.map(([stat, tip]) => (
            <li key={stat} className="text-sm">
              <span className="font-mono font-bold text-text-primary">{stat}</span>
              <span className="ml-2 text-text-secondary">{tip}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-text-muted">Tap anywhere to close</p>
      </div>
    </div>
  )
}

// ─── Medium + Large variants ───────────────────────────────────────────────────

export function SwimmerCard({ stats, name, avatarUrl, club, size = 'md', locked = false }: SwimmerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [sharing, setSharing] = useState(false)

  if (size === 'sm') return <CardSm stats={stats} name={name} size={size} locked={locked} />

  const cfg = TIER_CONFIG[(stats.tier as Tier) ?? 'rookie']
  const isLg = size === 'lg'
  const pos = positionBadge(stats.main_stroke)

  const statLabels: Array<{ key: keyof SwimmerStatsRow; label: string }> = [
    { key: 'spd', label: 'SPD' },
    { key: 'end_stat', label: 'END' },
    { key: 'tec', label: 'TEC' },
    { key: 'con', label: 'CON' },
    { key: 'prg', label: 'PRG' },
    { key: 'com', label: 'COM' },
  ]

  async function handleShare() {
    if (!cardRef.current || sharing) return
    setSharing(true)
    await shareCard(cardRef.current, name)
    setSharing(false)
  }

  return (
    <>
      {infoOpen && <RatingsPopover onClose={() => setInfoOpen(false)} />}

      <div
        ref={cardRef}
        className={`relative p-[2px] rounded-card select-none ${cfg.wrapperClass ?? ''} ${isLg ? 'w-56' : 'w-40'}`}
        style={!cfg.wrapperClass ? cfg.borderStyle : undefined}
      >
        <div
          className="rounded-[8px] flex flex-col overflow-hidden"
          style={cfg.bgStyle}
        >
          {/* Header strip */}
          <div className={`relative flex flex-col items-center ${isLg ? 'pt-5 pb-3 gap-1' : 'pt-3 pb-2 gap-0.5'}`}>
            {/* Position badge — top left */}
            <span
              className="absolute top-2 left-2 font-mono font-bold leading-none"
              style={{ fontSize: 9, color: cfg.textColor }}
            >
              {pos}
            </span>

            {/* ⓘ button — top right */}
            <button
              onClick={() => setInfoOpen(true)}
              className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: cfg.textColor }}
              aria-label="Rating info"
            >
              <Info size={isLg ? 13 : 11} />
            </button>

            {/* OVR */}
            {locked ? (
              <div className="relative">
                <span
                  className={`font-mono font-black blur-sm ${isLg ? 'text-5xl' : 'text-3xl'}`}
                  style={{ color: cfg.ovrColor }}
                >
                  88
                </span>
                <Lock
                  className="absolute inset-0 m-auto"
                  size={isLg ? 20 : 14}
                  style={{ color: '#6b7280' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span
                  className={`font-mono font-black ${isLg ? 'text-5xl' : 'text-3xl'}`}
                  style={{ color: cfg.ovrColor }}
                >
                  {stats.ovr}
                </span>
                <OvrDelta stats={stats} />
              </div>
            )}

            {/* Tier label */}
            <span
              className={`font-semibold uppercase tracking-widest ${isLg ? 'text-xs' : 'text-[9px]'}`}
              style={{ color: cfg.textColor }}
            >
              {cfg.label}
            </span>

            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className={`rounded-full object-cover mt-1 ring-1 ${isLg ? 'w-16 h-16' : 'w-10 h-10'}`}
                style={{ '--tw-ring-color': cfg.textColor } as React.CSSProperties}
              />
            ) : (
              <div
                className={`rounded-full flex items-center justify-center mt-1 font-bold font-mono ${isLg ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm'}`}
                style={{ background: 'rgba(255,255,255,0.06)', color: cfg.textColor }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name */}
            <span
              className={`font-semibold text-center truncate max-w-[90%] ${isLg ? 'text-sm mt-1' : 'text-[10px]'}`}
              style={{ color: '#f1f5f9' }}
            >
              {name}
            </span>

            {/* Club */}
            {club && (
              <span
                className={`truncate max-w-[90%] italic ${isLg ? 'text-[10px]' : 'text-[8px]'}`}
                style={{ color: cfg.textColor, opacity: 0.7 }}
              >
                {club}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="mx-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Stats */}
          <div className={`flex flex-col px-3 ${isLg ? 'py-3 gap-2' : 'py-2 gap-1.5'} ${locked ? 'blur-sm' : ''}`}>
            {statLabels.map(({ key, label }) => (
              <StatRow
                key={key}
                label={label}
                value={(stats[key] as number) ?? 0}
                compact={!isLg}
              />
            ))}
          </div>

          {/* Signature PB footer */}
          {!locked && stats.signature_event && stats.signature_time_seconds && (
            <>
              <div className="mx-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <div className={`px-3 ${isLg ? 'py-2' : 'py-1.5'} flex items-center justify-between gap-1`}>
                <span
                  className="font-mono truncate"
                  style={{ fontSize: isLg ? 9 : 8, color: cfg.textColor, opacity: 0.8 }}
                >
                  {stats.signature_event}
                </span>
                <span
                  className="font-mono font-bold tabular-nums shrink-0"
                  style={{ fontSize: isLg ? 10 : 9, color: '#f1f5f9' }}
                >
                  {formatTime(stats.signature_time_seconds)}
                </span>
              </div>
            </>
          )}

          {/* Share button */}
          {!locked && (
            <>
              <div className="mx-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <div className={`flex justify-end px-2 ${isLg ? 'py-1.5' : 'py-1'}`}>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-1 rounded opacity-50 hover:opacity-90 transition-opacity disabled:opacity-30"
                  style={{ color: cfg.textColor }}
                  aria-label="Share card"
                >
                  <Share2 size={isLg ? 11 : 9} />
                  <span className="font-mono" style={{ fontSize: isLg ? 9 : 8 }}>
                    {sharing ? '…' : 'share'}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* Locked overlay */}
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 gap-1 pointer-events-none">
              <Lock size={16} style={{ color: '#6b7280' }} />
              <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>
                Join as swimmer
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default SwimmerCard
