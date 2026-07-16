import { CheckSquare } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { buildRaceWeekChecklist, type ChecklistCategory } from '@/lib/raceWeekChecklist'

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  sleep: 'Sleep',
  nutrition: 'Nutrition',
  logistics: 'Logistics',
  gear: 'Gear',
}

const CATEGORY_ORDER: ChecklistCategory[] = ['sleep', 'nutrition', 'logistics', 'gear']

/** Milestone 6 — static race-week checklist, shown once a goal race enters
 * its taper phase. Parameterized by days-to-race, not an LLM call — see
 * raceWeekChecklist.ts. */
export function RaceWeekChecklistCard({ daysToRace }: { daysToRace: number }) {
  const items = buildRaceWeekChecklist(daysToRace)
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <Card className="border-secondary/30 bg-secondary/5">
      <CardHeader
        title="Race week checklist"
        subtitle={daysToRace <= 0 ? "It's race day — good luck!" : `${daysToRace} day${daysToRace === 1 ? '' : 's'} to go`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {grouped.map(({ category, items: categoryItems }) => (
          <div key={category}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
              {CATEGORY_LABELS[category]}
            </p>
            <ul className="space-y-1.5">
              {categoryItems.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-text-primary">
                  <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  )
}
