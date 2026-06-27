import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCursorFx } from '@/hooks/useCursorFx'
import { useTilt } from '@/hooks/useTilt'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'
import { BrandMark } from '@/components/BrandMark'
import { useAuth } from '@/hooks/useAuth'

/** Reference a global theme token as a color, optionally with alpha. */
const v = (name: string, alpha?: number) =>
  alpha == null ? `rgb(var(${name}))` : `rgb(var(${name}) / ${alpha})`

const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace"
const EASE = 'cubic-bezier(.2,.7,.2,1)'

const FEATURES = [
  {
    index: '01',
    title: 'Track every split',
    body: 'Log sets and intervals in the language coaches use — "8 × 100m freestyle on 1:30" — not a generic distance box.',
  },
  {
    index: '02',
    title: 'Know your CSS',
    body: 'Run the 400m + 200m test and unlock your Critical Swim Speed — the pace threshold elite squads use to calibrate every interval.',
  },
  {
    index: '03',
    title: 'See every PB, every stroke',
    body: 'Volume, pace and consistency charted across the season. Spot which stroke is lagging before your coach has to say it.',
  },
]

/** A single tilt + reveal feature card with the growing accent rule on hover. */
function FeatureCard({
  feature,
  register,
}: {
  feature: (typeof FEATURES)[number]
  register: (el: HTMLElement | null) => void
}) {
  const tiltRef = useTilt<HTMLDivElement>()
  const ruleRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={(el) => {
        tiltRef.current = el
        register(el)
      }}
      data-tilt="1"
      onMouseEnter={() => {
        if (ruleRef.current) ruleRef.current.style.width = '80px'
      }}
      onMouseLeave={() => {
        if (ruleRef.current) ruleRef.current.style.width = '34px'
      }}
      style={{
        position: 'relative',
        background: v('--c-surface'),
        border: `1px solid ${v('--c-border')}`,
        borderRadius: 10,
        padding: 24,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: v('--c-primary'), letterSpacing: '.1em' }}>
        {feature.index}
      </div>
      <h3 style={{ margin: '16px 0 0', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
        {feature.title}
      </h3>
      <p style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.6, color: v('--c-text-secondary') }}>
        {feature.body}
      </p>
      <div
        ref={ruleRef}
        style={{
          height: 2,
          width: 34,
          background: v('--c-primary'),
          marginTop: 20,
          transition: `width .4s ${EASE}`,
        }}
      />
    </div>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, profile } = useAuth()
  // Signed-in visitors land on the hero too, so route them onward to their
  // own portal instead of bouncing through /login.
  const dashboardPath = isAuthenticated && profile?.role ? `/${profile.role}` : null
  // Logged-out visitors enter the anonymous onboarding flow (build first,
  // sign up at save); signed-in visitors jump to their dashboard.
  const primaryTo = dashboardPath ?? '/start'
  // Halo + lead dot are rendered app-wide by <CursorFxLayer>; here we only
  // need the grid-parallax and magnetic-CTA refs from the same loop.
  const { gridRef, magneticRef } = useCursorFx()
  const register = useReveal()
  const countRef = useCountUp(4250)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Route-transition veil (handoff Workstream 2g): fade a full-screen veil in,
  // navigate at the midpoint, let the destination mount behind it.
  const goWithVeil = (to: string) => {
    const ov = overlayRef.current
    if (prefersReducedMotion() || !ov) {
      navigate(to)
      return
    }
    ov.style.transition = 'opacity .2s ease'
    ov.style.opacity = '1'
    window.setTimeout(() => navigate(to), 210)
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: v('--c-bg'),
        color: v('--c-text-primary'),
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Route-transition veil (2g) */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          pointerEvents: 'none',
          opacity: 0,
          background: `radial-gradient(circle at 50% 44%, ${v('--c-primary', 0.07)} 0%, ${v('--c-bg')} 72%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `2px solid ${v('--c-border')}`,
            borderTopColor: v('--c-primary'),
            animation: 'spin .7s linear infinite',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Sticky header */}
        <header
          className="px-5 py-3 md:px-10 md:py-4"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            background: v('--c-bg', 0.78),
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${v('--c-border')}`,
          }}
        >
          <BrandMark />
          <nav style={{ display: 'flex', alignItems: 'center', gap: 30 }} className="hidden md:flex">
            {[
              ['For Coaches', '/login'],
              ['For Swimmers', '/start'],
              ['Beginners', '/beginner'],
            ].map(([label, to]) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: v('--c-text-secondary'),
                  transition: 'color .2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = v('--c-text-primary'))}
                onMouseLeave={(e) => (e.currentTarget.style.color = v('--c-text-secondary'))}
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => navigate(dashboardPath ?? '/login')}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              background: v('--c-surface'),
              border: `1px solid ${v('--c-border')}`,
              color: v('--c-text-primary'),
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {dashboardPath ? 'Go to app' : 'Sign in'}
          </button>
        </header>

        {/* Hero */}
        <section
          className="px-5 py-10 md:px-10 md:py-[70px] md:pb-[60px]"
          style={{
            position: 'relative',
            maxWidth: 1280,
            margin: '0 auto',
            overflow: 'hidden',
          }}
        >
          {/* Background grid parallax (2d) */}
          <div
            ref={gridRef}
            style={{
              position: 'absolute',
              inset: -40,
              willChange: 'transform',
              backgroundImage: `linear-gradient(${v('--c-border')} 1px, transparent 1px), linear-gradient(90deg, ${v('--c-border')} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              opacity: 0.22,
              WebkitMaskImage: 'radial-gradient(circle at 38% 40%, #000, transparent 70%)',
              maskImage: 'radial-gradient(circle at 38% 40%, #000, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="grid items-center gap-[54px] md:[grid-template-columns:1.05fr_0.95fr]"
            style={{ position: 'relative' }}
          >
            {/* Left column */}
            <div>
              <span
                className="animate-fade-up"
                style={{
                  display: 'inline-block',
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: v('--c-primary'),
                }}
              >
                // swim training, reimagined
              </span>
              <h1
                className="animate-fade-up"
                style={{
                  margin: '18px 0 0',
                  fontSize: 58,
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontWeight: 700,
                  maxWidth: '14ch',
                  animationDelay: '.06s',
                }}
              >
                Swim with the precision of a pro.
              </h1>
              <p
                className="animate-fade-up"
                style={{
                  margin: '20px 0 0',
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: v('--c-text-secondary'),
                  maxWidth: '46ch',
                  animationDelay: '.12s',
                }}
              >
                Every set, split and interval — logged, paced and trended. The instrument that turns
                laps into a season.
              </p>
              <div
                className="animate-fade-up"
                style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32, animationDelay: '.18s' }}
              >
                <button
                  ref={magneticRef}
                  onClick={() => goWithVeil(primaryTo)}
                  style={{
                    height: 50,
                    padding: '0 24px',
                    border: 'none',
                    borderRadius: 6,
                    background: v('--c-primary'),
                    color: v('--c-on-primary'),
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    fontSize: 12.5,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    boxShadow: 'var(--shadow-glow)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    willChange: 'transform',
                  }}
                >
                  {dashboardPath ? 'Go to dashboard' : 'Start training'}{' '}
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>→</span>
                </button>
                <button
                  onClick={() => navigate('/beginner')}
                  style={{
                    height: 50,
                    padding: '0 20px',
                    border: `1px solid ${v('--c-border')}`,
                    borderRadius: 6,
                    background: 'transparent',
                    color: v('--c-text-primary'),
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    fontSize: 12.5,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'border-color .25s, background .25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = v('--c-primary')
                    e.currentTarget.style.background = v('--c-primary', 0.08)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = v('--c-border')
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Explore as guest
                </button>
              </div>

              {/* Metric strip */}
              <div className="animate-fade-up" style={{ marginTop: 44, animationDelay: '.26s' }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                      This week
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: v('--c-text-primary'), marginTop: 8 }}>
                      <span ref={countRef}>0</span>
                      <span style={{ fontSize: 15, color: v('--c-text-secondary'), marginLeft: 4 }}>m</span>
                    </div>
                  </div>
                  <div style={{ width: 1, background: v('--c-border') }} />
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                      Avg /100m
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: v('--c-text-primary'), marginTop: 8 }}>
                      1:42
                    </div>
                  </div>
                  <div style={{ width: 1, background: v('--c-border') }} />
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                      Streak
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: v('--c-primary'), marginTop: 8 }}>
                      12<span style={{ fontSize: 15, color: v('--c-text-secondary'), marginLeft: 4 }}>d</span>
                    </div>
                  </div>
                </div>
                {!isAuthenticated && (
                  <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                    Example data · sign up to see your real stats
                  </div>
                )}
              </div>
            </div>

            {/* Right column — floating dashboard card */}
            <div className="animate-fade-up" style={{ animationDelay: '.2s' }}>
              <div
                className="animate-drift"
                style={{
                  background: v('--c-surface'),
                  border: `1px solid ${v('--c-border')}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 30px 80px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${v('--c-border')}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: v('--c-primary', 0.16), color: v('--c-primary'), fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      MV
                    </span>
                    <div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                        Good morning
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Mara Voss</div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 2, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', border: `1px solid ${v('--c-primary', 0.32)}`, color: v('--c-primary') }}>
                    <span style={{ width: 5, height: 5, background: v('--c-primary') }} />
                    Intermediate
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 18px', borderBottom: `1px solid ${v('--c-border')}` }}>
                  <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
                    <svg width="104" height="104" viewBox="0 0 116 116" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="58" cy="58" r="50" fill="none" stroke={v('--c-border')} strokeWidth="10" />
                      <circle
                        cx="58"
                        cy="58"
                        r="50"
                        fill="none"
                        stroke={v('--c-primary')}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="314"
                        strokeDashoffset="100"
                        className="animate-ring-in"
                        style={{ animationDelay: '.4s', filter: `drop-shadow(0 0 6px ${v('--c-primary', 0.6)})` }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600 }}>68%</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: v('--c-text-muted'), marginTop: 2 }}>
                        weekly goal
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      ['Distance', '4,250', 'm'],
                      ['Sessions', '05', ''],
                    ].map(([label, value, unit]) => (
                      <div key={label} style={{ border: `1px solid ${v('--c-border')}`, borderRadius: 6, padding: '11px 12px' }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: '.12em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, marginTop: 6 }}>
                          {value}
                          {unit && <span style={{ fontSize: 10, color: v('--c-text-secondary') }}>{unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: v('--c-text-muted'), marginBottom: 4 }}>
                    Recent
                  </div>
                  {[
                    ['Endurance', 'TUE · JUN 24', '2,000 m', '34:10'],
                    ['Threshold', 'MON · JUN 23', '1,400 m', '23:48'],
                  ].map(([title, when, dist, time]) => (
                    <div
                      key={title}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px', margin: '0 -10px', borderRadius: 6, cursor: 'pointer', transition: 'background .2s, box-shadow .2s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = v('--c-primary', 0.07)
                        e.currentTarget.style.boxShadow = `inset 2px 0 0 ${v('--c-primary')}`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: v('--c-text-muted') }}>{when}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 13 }}>{dist}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: v('--c-text-secondary') }}>{time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature row */}
        <section
          className="px-5 py-8 md:px-10 md:py-[30px] md:pb-[90px]"
          style={{ maxWidth: 1280, margin: '0 auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
              Built for the long game
            </span>
            <span style={{ flex: 1, height: 1, background: v('--c-border') }} />
          </div>
          <div className="grid gap-[18px] md:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.index} feature={f} register={register} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
