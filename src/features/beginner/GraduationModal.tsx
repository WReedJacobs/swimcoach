import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Waves } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useJourneyStore } from '@/store/beginnerJourneyStore'
import { supabase } from '@/lib/supabase'
import { useMilestones, MILESTONES } from './beginnerStore'

const SWIMMER_PERKS = [
  'Full time tracking and PB detection',
  'Goals with progress tracking',
  'Your swimmer card and leaderboard ranking',
  'Coach messaging (optional — find one when you\'re ready)',
  'Achievements and milestones',
]

export function GraduationModal({ open }: { open: boolean }) {
  const { user, setRole } = useAuth()
  const { setGraduationSeen } = useJourneyStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [milestones] = useMilestones()

  if (!open) return null

  async function handleGraduate() {
    setLoading(true)
    try {
      if (user) {
        // Sync any achieved beginner milestones to the DB before the role change
        // so recalc_swimmer_stats can read them on the first post-graduation recalc.
        const achieved = milestones
          .map((state, i) =>
            state.achievedAt
              ? { label: MILESTONES[i].label, distance: MILESTONES[i].distance, achievedAt: state.achievedAt }
              : null,
          )
          .filter((m): m is { label: string; distance: number; achievedAt: string } => m !== null)

        if (achieved.length > 0) {
          await supabase.from('milestones').upsert(
            achieved.map((m) => ({
              profile_id: user.id,
              label: m.label,
              distance: m.distance,
              achieved: true,
              achieved_at: m.achievedAt,
            })),
            { onConflict: 'profile_id,label' },
          )
        }

        await setRole('swimmer', 'beginner')
        navigate('/swimmer')
      } else {
        navigate('/signup')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    setGraduationSeen()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/90 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-modal border border-primary/30 bg-surface p-8 shadow-2xl">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Waves className="h-8 w-8" />
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-text-primary">
          You're ready to swim.
        </h2>
        <p className="mb-6 text-center text-sm text-text-secondary">
          You've learned the basics, built your first habits, and logged real swim data. It's time
          to unlock the full Swimmer experience.
        </p>

        {/* Perks */}
        <div className="mb-8 space-y-2 rounded-card border border-border bg-bg p-4">
          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            What you'll get as a Swimmer
          </p>
          {SWIMMER_PERKS.map((perk) => (
            <div key={perk} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <span className="text-sm text-text-secondary">{perk}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button className="w-full" size="lg" loading={loading} onClick={handleGraduate}>
            {user ? 'Become a Swimmer' : 'Create Swimmer Account'}
          </Button>
          <div className="rounded-card border border-border bg-bg p-4 text-center">
            <p className="mb-2 text-sm text-text-secondary">
              Not ready yet? Keep going at your own pace — your progress is saved.
            </p>
            <button
              onClick={handleDismiss}
              className="text-sm font-medium text-coral transition-colors hover:underline"
            >
              Continue as Beginner for now →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
