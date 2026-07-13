import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { CursorFxLayer } from '@/components/CursorFxLayer'
import { ProtectedRoute, AdminRoute, HomeRedirect } from '@/components/RouteGuards'
import { AdminShell } from '@/features/admin/AdminShell'

const CURSOR_FX_PATHS = new Set(['/', '/welcome', '/start', '/login', '/signup', '/role-select', '/forgot-password', '/reset-password'])

function CursorFxGate() {
  const { pathname } = useLocation()
  if (!CURSOR_FX_PATHS.has(pathname)) return null
  return <CursorFxLayer />
}

// ─── Lazy page imports ─────────────────────────────────────────────────────
// Marketing
const WelcomePage    = lazy(() => import('@/features/marketing/WelcomePage').then(m => ({ default: m.WelcomePage })))
const OnboardingFlow = lazy(() => import('@/features/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })))

// Auth
const LoginPage          = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignUpPage          = lazy(() => import('@/features/auth/SignUpPage').then(m => ({ default: m.SignUpPage })))
const RoleSelectPage      = lazy(() => import('@/features/auth/RoleSelectPage').then(m => ({ default: m.RoleSelectPage })))
const ForgotPasswordPage  = lazy(() => import('@/features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage   = lazy(() => import('@/features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const AuthCallbackPage    = lazy(() => import('@/features/auth/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))

// Coach
const CoachDashboard   = lazy(() => import('@/features/coach/CoachDashboard').then(m => ({ default: m.CoachDashboard })))
const RosterPage       = lazy(() => import('@/features/coach/RosterPage').then(m => ({ default: m.RosterPage })))
const SwimmerProfilePage = lazy(() => import('@/features/coach/SwimmerProfilePage').then(m => ({ default: m.SwimmerProfilePage })))
const TimeLogger       = lazy(() => import('@/features/coach/TimeLogger').then(m => ({ default: m.TimeLogger })))
const SessionsPage     = lazy(() => import('@/features/coach/SessionsPage').then(m => ({ default: m.SessionsPage })))
const SessionBuilder   = lazy(() => import('@/features/coach/SessionBuilder').then(m => ({ default: m.SessionBuilder })))
const ProgressPage     = lazy(() => import('@/features/coach/ProgressPage').then(m => ({ default: m.ProgressPage })))
const FeedbackPage     = lazy(() => import('@/features/coach/FeedbackPage').then(m => ({ default: m.FeedbackPage })))
const CoachMessagesPage = lazy(() => import('@/features/coach/MessagesPage').then(m => ({ default: m.MessagesPage })))
const BookingPage      = lazy(() => import('@/features/shared/BookingPage').then(m => ({ default: m.BookingPage })))

// Swimmer
const SwimmerDashboard   = lazy(() => import('@/features/swimmer/SwimmerDashboard').then(m => ({ default: m.SwimmerDashboard })))
const TodaySessionPage   = lazy(() => import('@/features/swimmer/TodaySessionPage').then(m => ({ default: m.TodaySessionPage })))
const MyTimesPage        = lazy(() => import('@/features/swimmer/MyTimesPage').then(m => ({ default: m.MyTimesPage })))
const GoalsPage          = lazy(() => import('@/features/swimmer/GoalsPage').then(m => ({ default: m.GoalsPage })))
const CssTestPage        = lazy(() => import('@/features/swimmer/CssTestPage').then(m => ({ default: m.CssTestPage })))
const FeedbackViewPage   = lazy(() => import('@/features/swimmer/FeedbackViewPage').then(m => ({ default: m.FeedbackViewPage })))
const AchievementsPage   = lazy(() => import('@/features/swimmer/AchievementsPage').then(m => ({ default: m.AchievementsPage })))
const SwimmerMessagesPage = lazy(() => import('@/features/swimmer/MessagesPage').then(m => ({ default: m.MessagesPage })))
const SwimmerSchedulePage = lazy(() => import('@/features/swimmer/SwimmerSchedulePage').then(m => ({ default: m.SwimmerSchedulePage })))
const ProfilePage        = lazy(() => import('@/features/swimmer/ProfilePage').then(m => ({ default: m.ProfilePage })))
const SwimPlannerPage    = lazy(() => import('@/features/swimmer/SwimPlannerPage').then(m => ({ default: m.SwimPlannerPage })))

// Beginner
const JourneyPage           = lazy(() => import('@/features/beginner/JourneyPage').then(m => ({ default: m.JourneyPage })))
const LearnHub              = lazy(() => import('@/features/beginner/LearnHub').then(m => ({ default: m.LearnHub })))
const StrokeGuidesPage      = lazy(() => import('@/features/beginner/StrokeGuidesPage').then(m => ({ default: m.StrokeGuidesPage })))
const GlossaryPage          = lazy(() => import('@/features/beginner/GlossaryPage').then(m => ({ default: m.GlossaryPage })))
const MilestonesPage        = lazy(() => import('@/features/beginner/MilestonesPage').then(m => ({ default: m.MilestonesPage })))
const SelfLogPage           = lazy(() => import('@/features/beginner/SelfLogPage').then(m => ({ default: m.SelfLogPage })))
const FindCoachPage         = lazy(() => import('@/features/beginner/FindCoachPage').then(m => ({ default: m.FindCoachPage })))
const PoolGuidePage         = lazy(() => import('@/features/beginner/PoolGuidePage').then(m => ({ default: m.PoolGuidePage })))
const TrainingBasicsPage    = lazy(() => import('@/features/beginner/TrainingBasicsPage').then(m => ({ default: m.TrainingBasicsPage })))
const FitnessProgramPage    = lazy(() => import('@/features/beginner/FitnessProgramPage').then(m => ({ default: m.FitnessProgramPage })))
const WaterConfidencePage   = lazy(() => import('@/features/beginner/WaterConfidencePage').then(m => ({ default: m.WaterConfidencePage })))
const FirstVisitPage        = lazy(() => import('@/features/beginner/FirstVisitPage').then(m => ({ default: m.FirstVisitPage })))
const BreathingPage         = lazy(() => import('@/features/beginner/BreathingPage').then(m => ({ default: m.BreathingPage })))
const ConfidenceFaqPage     = lazy(() => import('@/features/beginner/ConfidenceFaqPage').then(m => ({ default: m.ConfidenceFaqPage })))
const SafetyPage            = lazy(() => import('@/features/beginner/SafetyPage').then(m => ({ default: m.SafetyPage })))
const PaceClockPage         = lazy(() => import('@/features/beginner/PaceClockPage').then(m => ({ default: m.PaceClockPage })))
const SelfGuidedPage        = lazy(() => import('@/features/beginner/SelfGuidedPage').then(m => ({ default: m.SelfGuidedPage })))

// Admin
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))

// Shared
const DrillLibraryPage = lazy(() => import('@/features/shared/DrillLibraryPage').then(m => ({ default: m.DrillLibraryPage })))
const SettingsPage     = lazy(() => import('@/features/shared/SettingsPage').then(m => ({ default: m.SettingsPage })))
const LeaderboardPage  = lazy(() => import('@/features/shared/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const NotFoundPage     = lazy(() => import('@/features/shared/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    void init()
  }, [init])

  return (
    <>
    <CursorFxGate />
    <Suspense fallback={null}>
      <Routes>
        {/* Entry — authenticated users skip marketing and go to their role home. */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/start" element={<OnboardingFlow />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/role-select" element={<RoleSelectPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Coach */}
        <Route
          element={
            <ProtectedRoute role="coach">
              <AppShell role="coach" />
            </ProtectedRoute>
          }
        >
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/roster" element={<RosterPage />} />
          <Route path="/coach/roster/:swimmerId" element={<SwimmerProfilePage />} />
          <Route path="/coach/log" element={<TimeLogger />} />
          <Route path="/coach/sessions" element={<SessionsPage />} />
          <Route path="/coach/sessions/new" element={<SessionBuilder />} />
          <Route path="/coach/sessions/:sessionId/edit" element={<SessionBuilder />} />
          <Route path="/coach/progress" element={<ProgressPage />} />
          <Route path="/coach/feedback" element={<FeedbackPage />} />
          <Route path="/coach/messages" element={<CoachMessagesPage />} />
          <Route path="/coach/bookings" element={<BookingPage />} />
          <Route path="/coach/drills" element={<DrillLibraryPage />} />
          <Route path="/coach/settings" element={<SettingsPage />} />
          <Route path="/coach/profile" element={<ProfilePage />} />
          <Route path="/coach/leaderboard" element={<LeaderboardPage />} />
        </Route>

        {/* Swimmer */}
        <Route
          element={
            <ProtectedRoute role="swimmer">
              <AppShell role="swimmer" />
            </ProtectedRoute>
          }
        >
          <Route path="/swimmer" element={<SwimmerDashboard />} />
          <Route path="/swimmer/today" element={<TodaySessionPage />} />
          <Route path="/swimmer/times" element={<MyTimesPage />} />
          <Route path="/swimmer/goals" element={<GoalsPage />} />
          <Route path="/swimmer/css" element={<CssTestPage />} />
          <Route path="/swimmer/schedule" element={<SwimmerSchedulePage />} />
          <Route path="/swimmer/feedback" element={<FeedbackViewPage />} />
          <Route path="/swimmer/achievements" element={<AchievementsPage />} />
          <Route path="/swimmer/messages" element={<SwimmerMessagesPage />} />
          <Route path="/swimmer/drills" element={<DrillLibraryPage />} />
          <Route path="/swimmer/settings" element={<SettingsPage />} />
          <Route path="/swimmer/profile" element={<ProfilePage />} />
          <Route path="/swimmer/planner" element={<SwimPlannerPage />} />
          <Route path="/swimmer/leaderboard" element={<LeaderboardPage />} />
        </Route>

        {/* Beginner — public, no auth required */}
        <Route element={<AppShell role="beginner" />}>
          <Route path="/beginner" element={<JourneyPage />} />
          <Route path="/beginner/journey" element={<Navigate to="/beginner" replace />} />
          <Route path="/beginner/log" element={<SelfLogPage />} />
          <Route path="/beginner/program" element={<FitnessProgramPage />} />
          <Route path="/beginner/find-coach" element={<FindCoachPage />} />
          <Route path="/beginner/settings" element={<SettingsPage />} />
          <Route path="/beginner/milestones" element={<MilestonesPage />} />
          <Route path="/beginner/self-guided" element={<SelfGuidedPage />} />

          {/* Learn hub + all guide pages */}
          <Route path="/beginner/learn" element={<LearnHub />} />
          <Route path="/beginner/learn/water-confidence" element={<WaterConfidencePage />} />
          <Route path="/beginner/learn/first-visit" element={<FirstVisitPage />} />
          <Route path="/beginner/learn/breathing" element={<BreathingPage />} />
          <Route path="/beginner/learn/pool-guide" element={<PoolGuidePage />} />
          <Route path="/beginner/learn/training-basics" element={<TrainingBasicsPage />} />
          <Route path="/beginner/learn/pace-clock" element={<PaceClockPage />} />
          <Route path="/beginner/learn/strokes" element={<StrokeGuidesPage />} />
          <Route path="/beginner/learn/glossary" element={<GlossaryPage />} />
          <Route path="/beginner/learn/drills" element={<DrillLibraryPage />} />
          <Route path="/beginner/learn/confidence-faq" element={<ConfidenceFaqPage />} />
          <Route path="/beginner/learn/safety" element={<SafetyPage />} />

          {/* Legacy redirects — keep old bookmarks working */}
          <Route path="/beginner/pool-guide" element={<Navigate to="/beginner/learn/pool-guide" replace />} />
          <Route path="/beginner/training" element={<Navigate to="/beginner/learn/training-basics" replace />} />
          <Route path="/beginner/strokes" element={<Navigate to="/beginner/learn/strokes" replace />} />
          <Route path="/beginner/glossary" element={<Navigate to="/beginner/learn/glossary" replace />} />
          <Route path="/beginner/drills" element={<Navigate to="/beginner/learn/drills" replace />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <AdminRoute>
              <AdminShell />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
    </>
  )
}
