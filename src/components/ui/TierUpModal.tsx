import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { SwimmerCard } from './SwimmerCard'
import type { SwimmerStatsRow } from '@/hooks/useSwimmerStats'

const TIER_ORDER = ['rookie', 'bronze', 'silver', 'gold', 'elite', 'legend', 'mythic']

const TIER_COPY: Record<string, string> = {
  bronze:  "You're swimming now. Bronze unlocked.",
  silver:  "Solid form, real progress. Welcome to Silver.",
  gold:    "You're pushing into the upper ranks. Gold — earned.",
  elite:   "Few swimmers reach this level. Elite is yours.",
  legend:  "You've outlasted almost everyone. Legend status.",
  mythic:  "This is the highest peak. You are Mythic.",
  _default: "You've levelled up.",
}

function tierRank(tier: string) {
  return TIER_ORDER.indexOf(tier)
}

interface TierUpModalProps {
  userId: string
  stats: SwimmerStatsRow
  name: string
  avatarUrl?: string | null
  club?: string | null
}

export function TierUpModal({ userId, stats, name, avatarUrl, club }: TierUpModalProps) {
  const storageKey = `swimphoria.tier.${userId}`
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) ?? 'rookie'
    if (tierRank(stats.tier) > tierRank(stored)) {
      setOpen(true)
    }
  }, [userId, stats.tier, storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, stats.tier)
    setOpen(false)
  }

  if (!open) return null

  const message = TIER_COPY[stats.tier] ?? TIER_COPY._default

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/90 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-xs rounded-modal border border-border bg-surface p-6 shadow-2xl flex flex-col items-center gap-5">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Tier Up
        </p>

        {/* Animated card */}
        <div className="animate-[scale-in_0.4s_cubic-bezier(0.2,0.7,0.2,1)_both]">
          <SwimmerCard
            stats={stats}
            name={name}
            avatarUrl={avatarUrl}
            club={club}
            size="lg"
          />
        </div>

        <p className="text-center font-semibold text-text-primary">{message}</p>

        <button
          onClick={dismiss}
          className="w-full rounded-component border border-primary/30 bg-primary/10 py-2 font-mono text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Keep going →
        </button>
      </div>
    </div>
  )
}
