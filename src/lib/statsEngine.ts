// Logarithmic curve: score approaches 99 but never reaches it.
// Lower k = harder to climb.
export function curve(activityScore: number, k = 0.018): number {
  return Math.floor(99 * (1 - Math.exp(-k * activityScore)))
}

export interface RawActivity {
  pbCount: number
  cssResult: number | null   // T-pace in seconds per 100m (lower = better)
  strokeVariety: number
  totalDistanceKm: number
  distanceMilestones: number
  drillsViewed: number       // coaches: drills created × 2
  structuredSessionsDone: number
  currentStreak: number
  longestStreak: number
  weeksWithSessions: number
  goalsAchieved: number
  improvementCount: number
  daysActive: number
  hasCoach: boolean
  messagesSent: number       // kept for type compat; not used in COM formula
  goalsSet: number
  feedbackReceived: number
  lastSwimDate: string | null  // ISO date; used for CON decay
}

export function calculateStats(a: RawActivity) {
  // SPD — speed; improvementCount*5 added, strokeVariety removed
  const spdScore =
    a.pbCount * 4 +
    (a.cssResult ? Math.max(0, 200 - a.cssResult) * 0.5 : 0) +
    a.improvementCount * 5
  const spd = Math.max(15, curve(spdScore, 0.016))

  // END — endurance (unchanged)
  const endScore =
    a.totalDistanceKm * 2.5 + a.distanceMilestones * 12 + a.weeksWithSessions * 3
  const end_stat = Math.max(15, curve(endScore, 0.014))

  // TEC — technique; structuredSessionsDone removed
  const tecScore =
    a.drillsViewed * 3 +
    a.strokeVariety * 8 +
    a.feedbackReceived * 5
  const tec = Math.max(10, curve(tecScore, 0.015))

  // CON — consistency with inactive-week decay (-2 per week beyond 14 days, floor 20)
  const conScore =
    a.currentStreak * 2 + a.longestStreak * 1.5 + a.weeksWithSessions * 4
  let con = Math.max(20, curve(conScore, 0.017))
  if (a.lastSwimDate) {
    const inactiveDays = Math.floor(
      (Date.now() - new Date(a.lastSwimDate).getTime()) / 86_400_000,
    )
    if (inactiveDays > 14) {
      con = Math.max(20, con - Math.floor((inactiveDays - 14) / 7) * 2)
    }
  }

  // PRG — progress; goalsAchieved weight raised, improvementCount removed
  const prgScore = a.goalsAchieved * 12 + a.pbCount * 3
  const prg = Math.max(10, curve(prgScore, 0.013))

  // COM — commitment; structuredSessionsDone*3 added, messagesSent removed
  const comScore =
    a.daysActive * 1.5 +
    (a.hasCoach ? 20 : 0) +
    a.goalsSet * 4 +
    a.structuredSessionsDone * 3
  const com = Math.max(20, curve(comScore, 0.016))

  // OVR — weighted composite
  const weighted =
    spd * 0.25 + end_stat * 0.2 + tec * 0.15 + con * 0.2 + prg * 0.1 + com * 0.1
  const ovr = Math.floor(weighted)

  const tier =
    ovr >= 97
      ? 'mythic'
      : ovr >= 92
        ? 'legend'
        : ovr >= 85
          ? 'elite'
          : ovr >= 75
            ? 'gold'
            : ovr >= 65
              ? 'silver'
              : ovr >= 50
                ? 'bronze'
                : 'rookie'

  return { ovr, spd, end_stat, tec, con, prg, com, tier }
}

export type CalculatedStats = ReturnType<typeof calculateStats>

export const TIER_THRESHOLDS = [
  { tier: 'bronze', label: 'Bronze', ovr: 50 },
  { tier: 'silver', label: 'Silver', ovr: 65 },
  { tier: 'gold', label: 'Gold', ovr: 75 },
  { tier: 'elite', label: 'Elite', ovr: 85 },
  { tier: 'legend', label: 'Legend', ovr: 92 },
  { tier: 'mythic', label: 'Mythic', ovr: 97 },
] as const
