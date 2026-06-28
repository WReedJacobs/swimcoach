import { Link } from 'react-router-dom'
import { Gauge, GraduationCap, Timer, Target, Users, ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'

const sections = [
  {
    icon: Gauge,
    title: 'Set your own pace',
    body: 'Use the CSS test to find your critical swim speed — the training pace where you build fitness fastest. The test takes 20 minutes in the pool and gives you a personalised T-pace you can use for every session.',
    cta: { label: 'Take the CSS test', href: '/beginner/training' },
  },
  {
    icon: GraduationCap,
    title: 'Follow the program',
    body: "The 4-week fitness program is designed for exactly this: swimmers who don't yet have a coach. Each week builds on the last, combining distance work with technique sets. You don't need equipment beyond a pool and a clock.",
    cta: { label: 'Start the program', href: '/beginner/program' },
  },
  {
    icon: Timer,
    title: 'Track your times',
    body: "Logging timed swims is the single most powerful habit a self-guided swimmer can build. Even rough times — 'about 55 seconds for 50m' — show you whether you're improving over weeks. Personal bests are detected automatically once you upgrade to a Swimmer account.",
    cta: { label: 'Log a swim', href: '/beginner/log' },
  },
  {
    icon: Target,
    title: 'Set goals',
    body: "After upgrading to a Swimmer account, you can set event goals like '100m freestyle in 1:30' and track your progress against them. The app calculates how close you are each time you log a swim. Goals keep you focused on what matters.",
    cta: null,
  },
  {
    icon: Users,
    title: 'Find a coach later',
    body: "Coaches unlock session assignments, personalised feedback, and structured progress tracking. But there's no rush — many swimmers train solo for months before connecting with a coach. Use the coach directory when you feel ready.",
    cta: { label: 'Browse coaches', href: '/beginner/find-coach' },
  },
]

export function SelfGuidedPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <SectionHeader kicker="Going Solo" />

      <Card className="border-primary/20 bg-primary/5">
        <h2 className="text-lg font-semibold text-text-primary">
          You don't need a coach to make real progress.
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Swimphoria is built so that a determined self-guided swimmer can go from first lap to
          competitive times using nothing but the tools on this page. Here's how.
        </p>
      </Card>

      <div className="space-y-4">
        {sections.map(({ icon: Icon, title, body, cta }, i) => (
          <Card key={title}>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-component bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-text-muted">
                    0{i + 1}
                  </span>
                  <h3 className="font-semibold text-text-primary">{title}</h3>
                </div>
                <p className="text-sm text-text-secondary">{body}</p>
                {cta && (
                  <Link to={cta.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      {cta.label}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-secondary/20 bg-secondary/5">
        <CardHeader
          title="Ready to level up?"
          subtitle="When you're ready for full time tracking, goal setting and your swimmer card, graduating takes 30 seconds."
        />
        <Link to="/beginner/journey">
          <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
            View my journey progress
          </Button>
        </Link>
      </Card>
    </div>
  )
}
