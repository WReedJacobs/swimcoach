import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTilt } from '@/hooks/useTilt'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { BrandMark } from '@/components/BrandMark'

// Local copy of the /welcome layout + wording, adapted to float over the
// WebGL particle background (WelcomeHeroV2). Kept entirely inside the
// hero-v2 folder — the real WelcomePage is untouched, and deleting this
// folder removes the experiment cleanly. Only the shared UI primitives
// (BrandMark) and the app-wide motion hooks are imported; all copy is local.

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

const STEPS = [
  {
    index: '01',
    title: 'Log the way you already train',
    body: 'Warm-up, main set, cool-down — enter intervals in coach shorthand and Swimphoria parses the distance, stroke and rest for you. No spreadsheet, no re-typing.',
  },
  {
    index: '02',
    title: 'Test once, calibrate everything',
    body: 'A single 400m + 200m effort sets your Critical Swim Speed. Every future interval is then graded against the pace that actually matters for your event.',
  },
  {
    index: '03',
    title: 'Let the season tell the story',
    body: 'Volume, pace and PBs stack up week over week. Trends surface the stroke that\'s stalling and the one that\'s flying — long before race day forces the question.',
  },
]

/** A single tilt + reveal feature card with the growing accent rule on hover.
 * Solid surface, so it stays readable over the particle field as-is. */
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

export function WelcomeContent() {
  const navigate = useNavigate()
  const register = useReveal()
  const countRef = useCountUp(4250)

  return (
    <div style={{ color: v('--c-text-primary'), fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Sticky header — translucent glass bar over the particle field */}
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
          background: v('--c-bg', 0.7),
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
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
          onClick={() => navigate('/login')}
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
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section
        className="px-5 py-10 md:px-10 md:py-[70px] md:pb-[60px]"
        style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}
      >
        <div
          className="grid items-center gap-[54px] md:[grid-template-columns:1.05fr_0.95fr]"
          style={{ position: 'relative' }}
        >
          {/* Left column — floated onto a frosted panel so the copy stays
              legible over the bright particle field ("modal in front"). */}
          <div
            style={{
              background: v('--c-bg', 0.62),
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1px solid ${v('--c-border')}`,
              borderRadius: 14,
              padding: 32,
            }}
          >
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
              style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, animationDelay: '.18s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Path 1 — Coach */}
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    height: 46,
                    padding: '0 20px',
                    border: 'none',
                    borderRadius: 6,
                    background: v('--c-primary'),
                    color: v('--c-on-primary'),
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    boxShadow: 'var(--shadow-glow)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  I'm a coach →
                </button>

                {/* Path 2 — Swimmer with coach */}
                <button
                  onClick={() => navigate('/start')}
                  style={{
                    height: 46,
                    padding: '0 20px',
                    border: `1px solid ${v('--c-border')}`,
                    borderRadius: 6,
                    background: 'transparent',
                    color: v('--c-text-primary'),
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                    fontSize: 12,
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
                  I train with a coach →
                </button>
              </div>

              {/* Path 3 — New to swimming (no sign-up) */}
              <button
                onClick={() => navigate('/beginner')}
                style={{
                  height: 40,
                  padding: '0 16px',
                  border: 'none',
                  background: 'none',
                  color: v('--c-text-secondary'),
                  fontFamily: FONT_MONO,
                  fontSize: 11.5,
                  letterSpacing: '.08em',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color .2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = v('--c-text-primary'))}
                onMouseLeave={(e) => (e.currentTarget.style.color = v('--c-text-secondary'))}
              >
                <span style={{ fontSize: 13 }}>→</span> I'm new to swimming — no sign-up needed
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
              <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
                Example data · sign up to see your real stats
              </div>
            </div>
          </div>

          {/* Right column — floating dashboard card (already a solid surface). */}
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
      <section className="px-5 py-8 md:px-10 md:py-[30px] md:pb-[90px]" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 26,
            background: v('--c-bg', 0.55),
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
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

      {/* How it works — a vertical lane of steps that lengthens the "pool" as
          you scroll toward the far wall. */}
      <section className="px-5 py-8 md:px-10 md:py-[40px] md:pb-[80px]" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 32,
            background: v('--c-bg', 0.55),
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
            Three lengths to your first season
          </span>
          <span style={{ flex: 1, height: 1, background: v('--c-border') }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STEPS.map((step) => (
            <div
              key={step.index}
              ref={register}
              style={{
                display: 'flex',
                gap: 22,
                alignItems: 'flex-start',
                background: v('--c-surface'),
                border: `1px solid ${v('--c-border')}`,
                borderRadius: 10,
                padding: 24,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: `1px solid ${v('--c-primary', 0.35)}`,
                  background: v('--c-primary', 0.08),
                  color: v('--c-primary'),
                  fontFamily: FONT_MONO,
                  fontSize: 18,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step.index}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>{step.title}</h3>
                <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.6, color: v('--c-text-secondary'), maxWidth: '64ch' }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote strip — a beat of breathing room deeper down the pool. */}
      <section className="px-5 py-10 md:px-10 md:py-[60px]" style={{ maxWidth: 900, margin: '0 auto' }}>
        <figure
          ref={register}
          style={{
            margin: 0,
            background: v('--c-bg', 0.6),
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${v('--c-border')}`,
            borderRadius: 14,
            padding: '40px 36px',
            textAlign: 'center',
          }}
        >
          <blockquote
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: 1.4,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: v('--c-text-primary'),
            }}
          >
            “I stopped guessing whether I was improving. The splits don't lie — and neither does the trend line.”
          </blockquote>
          <figcaption style={{ marginTop: 20, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
            Distance squad captain · 3 seasons in
          </figcaption>
        </figure>
      </section>

      {/* Closing CTA — the far wall. */}
      <section className="px-5 pb-16 md:px-10 md:pb-[110px]" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          ref={register}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            border: `1px solid ${v('--c-primary', 0.3)}`,
            background: `linear-gradient(180deg, ${v('--c-surface')} 0%, ${v('--c-bg', 0.85)} 100%)`,
            padding: '56px 32px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: v('--c-primary'),
            }}
          >
            // push off the wall
          </span>
          <h2 style={{ margin: '16px auto 0', fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 700, maxWidth: '18ch' }}>
            Turn your next length into a season.
          </h2>
          <p style={{ margin: '16px auto 0', fontSize: 15.5, lineHeight: 1.6, color: v('--c-text-secondary'), maxWidth: '52ch' }}>
            Start free — log your first set in minutes, no card, no coach code required.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                height: 48,
                padding: '0 24px',
                border: 'none',
                borderRadius: 6,
                background: v('--c-primary'),
                color: v('--c-on-primary'),
                fontFamily: FONT_MONO,
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                boxShadow: 'var(--shadow-glow)',
                cursor: 'pointer',
              }}
            >
              I'm a coach →
            </button>
            <button
              onClick={() => navigate('/beginner')}
              style={{
                height: 48,
                padding: '0 24px',
                border: `1px solid ${v('--c-border')}`,
                borderRadius: 6,
                background: 'transparent',
                color: v('--c-text-primary'),
                fontFamily: FONT_MONO,
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              I'm new to swimming →
            </button>
          </div>
        </div>

        {/* Footer line */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: `1px solid ${v('--c-border')}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <BrandMark />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: v('--c-text-muted') }}>
            Swim training, reimagined
          </span>
        </div>
      </section>
    </div>
  )
}
