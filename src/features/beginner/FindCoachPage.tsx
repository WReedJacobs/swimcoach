import { MapPin, Search, Users, Award } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'

const guidance = [
  { icon: Search, title: 'Search local clubs', body: 'Look up your national governing body (e.g. Swim England, USA Swimming) and use their club finder.' },
  { icon: MapPin, title: 'Visit your local pool', body: 'Most leisure centres run learn-to-swim and masters squads. Ask at reception about coached sessions.' },
  { icon: Award, title: 'Check coach credentials', body: 'A good coach holds a recognised coaching qualification and a current safeguarding certificate.' },
  { icon: Users, title: 'Try a taster session', body: 'Many squads let you attend a session before committing. See if the group and level suit you.' },
]

export function FindCoachPage() {
  return (
    <div className="space-y-8">
      <Card className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">Ready for a coach?</h2>
        <p className="mt-1 text-sm text-text-secondary">
          A coach can speed up your progress and keep you accountable. Here's how to find a good one. A searchable
          directory is coming soon.
        </p>
      </Card>

      <div>
      <SectionHeader kicker="Coaches" />
      <div className="grid gap-4 sm:grid-cols-2">
        {guidance.map((g) => (
          <Card key={g.title} className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-component bg-coral/10 text-coral">
              <g.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{g.title}</h3>
              <p className="mt-0.5 text-sm text-text-secondary">{g.body}</p>
            </div>
          </Card>
        ))}
      </div>
      </div>
    </div>
  )
}
