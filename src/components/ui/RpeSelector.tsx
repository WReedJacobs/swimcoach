import { Select } from './Input'

const RPE_LABELS: Record<number, string> = {
  1: 'Very light',
  2: 'Light',
  3: 'Light',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Somewhat hard',
  7: 'Hard',
  8: 'Hard',
  9: 'Very hard',
  10: 'Maximal',
}

/** RPE (rate of perceived exertion, 1-10) picker — optional on every swim
 * log entry point, feeds Milestone 5's training-load flag (see
 * trainingLoad.ts). Never required; "Not set" keeps that swim out of the
 * load calculation entirely rather than assuming a value. */
export function RpeSelector({
  value,
  onChange,
  label = 'RPE (optional)',
}: {
  value: number | null
  onChange: (value: number | null) => void
  /** Pass null to omit the label entirely (e.g. inside a table cell where
   * a column header already says "RPE"). */
  label?: string | null
}) {
  return (
    <Select
      label={label ?? undefined}
      aria-label={label == null ? 'RPE' : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">Not set</option>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>{n} — {RPE_LABELS[n]}</option>
      ))}
    </Select>
  )
}
