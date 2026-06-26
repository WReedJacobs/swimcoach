import type { Session } from '@/types'

/** Renders a session's warm-up / main set / cool-down as labelled blocks. */
export function SessionBlocks({ session }: { session: Session }) {
  const blocks: [string, string | null][] = [
    ['Warm-up', session.warm_up],
    ['Main set', session.main_set],
    ['Cool-down', session.cool_down],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {blocks.map(([label, body]) => (
        <div key={label} className="rounded-component bg-bg p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-text-primary">{body || '—'}</p>
        </div>
      ))}
    </div>
  )
}
