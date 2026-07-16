import { TrendingUp } from 'lucide-react'
import { useTrainingLoad } from '@/hooks/useTrainingLoad'

/** Milestone 5 — advisory-only "load rising" badge. Renders nothing
 * unless the swimmer's acute:chronic workload ratio has actually crossed
 * the threshold; this is a flag to prompt a conversation, never a gate. */
export function LoadFlagBadge({ swimmerId }: { swimmerId: string | undefined }) {
  const { data } = useTrainingLoad(swimmerId)
  if (!data?.flag) return null

  return (
    <span
      className="flex items-center gap-1 rounded-component bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger"
      title={`Acute:chronic load ratio ${data.ratio!.toFixed(2)} — recent training load is notably higher than this swimmer's 4-week average. Advisory only.`}
    >
      <TrendingUp className="h-3 w-3" />
      Load rising
    </span>
  )
}
