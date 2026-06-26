import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { beginnerProgram } from './content'

export function BeginnerProgram() {
  return (
    <div className="space-y-8">
      <Card className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">Your 4-week starter plan</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Two short sessions a week. Go at your own pace — it's fine to repeat a week before moving on.
        </p>
      </Card>

      <div className="space-y-5">
      <SectionHeader kicker="Program" />
      {beginnerProgram.map((week) => (
        <Card key={week.week}>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-semibold text-white font-mono tabular-nums">
              {week.week}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Week <span className="font-mono tabular-nums">{week.week}</span></h3>
              <p className="text-sm text-text-secondary">{week.focus}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {week.sessions.map((s) => (
              <div key={s.title} className="rounded-component border border-border p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-text-primary">{s.title}</span>
                  <Badge tone="coral">{s.distance}</Badge>
                </div>
                <p className="text-sm text-text-secondary">{s.what}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
      </div>
    </div>
  )
}
