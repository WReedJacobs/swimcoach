import { useState } from 'react'
import { Lightbulb, AlertTriangle, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { strokeGuides } from './content'

export function StrokeGuidesPage() {
  const [active, setActive] = useState(0)
  const guide = strokeGuides[active]

  return (
    <div className="space-y-5">
      <SectionHeader kicker="Guides" />
      <div className="flex flex-wrap gap-2">
        {strokeGuides.map((g, i) => (
          <button
            key={g.stroke}
            onClick={() => setActive(i)}
            className={cn(
              'rounded-component px-4 py-2 text-sm font-medium transition-colors',
              i === active ? 'bg-coral text-white' : 'border border-border bg-surface text-text-secondary hover:bg-bg',
            )}
          >
            {g.stroke}
          </button>
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text-primary">{guide.stroke}</h2>
        <p className="mt-1 text-text-secondary">{guide.blurb}</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
            <Lightbulb className="h-5 w-5 text-coral" /> Key tips
          </div>
          <ul className="space-y-2">
            {guide.tips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary">
                <span className="text-coral">•</span> {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
            <AlertTriangle className="h-5 w-5 text-accent" /> Common mistakes
          </div>
          <ul className="space-y-2">
            {guide.mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary">
                <span className="text-accent">•</span> {m}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
          <MessageCircle className="h-5 w-5 text-primary" /> What your coach will say vs what it means
        </div>
        <div className="overflow-hidden rounded-component border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left text-xs font-mono uppercase tracking-[0.14em] text-text-muted">
              <tr>
                <th className="px-4 py-2">Coach says</th>
                <th className="px-4 py-2">What it means</th>
              </tr>
            </thead>
            <tbody>
              {guide.coachSpeak.map((c, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-text-primary">{c.phrase}</td>
                  <td className="px-4 py-2 text-text-secondary">{c.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
