import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { CursorFxLayer } from '@/components/CursorFxLayer'
import { ProtectedRoute } from '@/components/RouteGuards'

// Marketing
import { WelcomePage } from '@/features/marketing/WelcomePage'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'

// Auth
import { LoginPage } from '@/features/auth/LoginPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { RoleSelectPage } from '@/features/auth/RoleSelectPage'

// Coach
import { CoachDashboard } from '@/features/coach/CoachDashboard'
import { RosterPage } from '@/features/coach/RosterPage'
import { SwimmerProfilePage } from '@/features/coach/SwimmerProfilePage'
import { TimeLogger } from '@/features/coach/TimeLogger'
import { SessionsPage } from '@/features/coach/SessionsPage'
import { SessionBuilder } from '@/features/coach/SessionBuilder'
import { ProgressPage } from '@/features/coach/ProgressPage'
import { FeedbackPage } from '@/features/coach/FeedbackPage'
import { MessagesPage } from '@/features/coach/MessagesPage'

// Swimmer
import { SwimmerDashboard } from '@/features/swimmer/SwimmerDashboard'
import { TodaySessionPage } from '@/features/swimmer/TodaySessionPage'
import { MyTimesPage } from '@/features/swimmer/MyTimesPage'
import { GoalsPage } from '@/features/swimmer/GoalsPage'
import { CssTestPage } from '@/features/swimmer/CssTestPage'
import { FeedbackViewPage } from '@/features/swimmer/FeedbackViewPage'
import { AchievementsPage } from '@/features/swimmer/AchievementsPage'

// Beginner
import { BeginnerHome } from '@/features/beginner/BeginnerHome'
import { StrokeGuidesPage } from '@/features/beginner/StrokeGuidesPage'
import { GlossaryPage } from '@/features/beginner/GlossaryPage'
import { MilestonesPage } from '@/features/beginner/MilestonesPage'
import { SelfLogPage } from '@/features/beginner/SelfLogPage'
import { BeginnerProgram } from '@/features/beginner/BeginnerProgram'
import { FindCoachPage } from '@/features/beginner/FindCoachPage'

// Shared
import { DrillLibraryPage } from '@/features/shared/DrillLibraryPage'
import { BookingPage } from '@/features/shared/BookingPage'

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    void init()
  }, [init])

  return (
    <>
    <CursorFxLayer />
    <Routes>
      {/* Entry — the hero landing is the root for everyone (signed in or not). */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/start" element={<OnboardingFlow />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />

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
        <Route path="/coach/progress" element={<ProgressPage />} />
        <Route path="/coach/feedback" element={<FeedbackPage />} />
        <Route path="/coach/messages" element={<MessagesPage />} />
        <Route path="/coach/bookings" element={<BookingPage />} />
        <Route path="/coach/drills" element={<DrillLibraryPage />} />
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
        <Route path="/swimmer/feedback" element={<FeedbackViewPage />} />
        <Route path="/swimmer/achievements" element={<AchievementsPage />} />
        <Route path="/swimmer/drills" element={<DrillLibraryPage />} />
      </Route>

      {/* Beginner — public, no auth required */}
      <Route element={<AppShell role="beginner" />}>
        <Route path="/beginner" element={<BeginnerHome />} />
        <Route path="/beginner/strokes" element={<StrokeGuidesPage />} />
        <Route path="/beginner/glossary" element={<GlossaryPage />} />
        <Route path="/beginner/milestones" element={<MilestonesPage />} />
        <Route path="/beginner/log" element={<SelfLogPage />} />
        <Route path="/beginner/program" element={<BeginnerProgram />} />
        <Route path="/beginner/find-coach" element={<FindCoachPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
