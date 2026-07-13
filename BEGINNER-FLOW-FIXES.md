# Beginner flow audit — fixes needed

**Status: all 5 items implemented 2026-07-13.** See commit history for
`src/features/beginner/`, `src/features/onboarding/`, `src/features/auth/
AuthCallbackPage.tsx`, `src/components/layout/nav.ts` and `TopBar.tsx` around
this date. `BeginnerHome.tsx` was confirmed unused and deleted rather than
revived, per the doc's own fallback option.

Context: audited the app end-to-end as a new user (dead ends, hidden menus,
Google sign-in gaps, beginner mode never reaching the dashboard). Findings
and required fixes below. Implement in the priority order given — items 1-2
are blocking, the rest are secondary.

All file paths are relative to the repo root. Read `CLAUDE.md` and
`DESIGN.md` before touching any UI (token usage, `font-mono` for numerals,
dark + light theme support).

---

## 1. CRITICAL — beginner journey can never complete (blocks graduation)

**Root cause:** `src/features/beginner/journeySteps.ts` defines the
Explorer-stage step `browse_drills` with `href: '/beginner/drills'`
(redirects to `/beginner/learn/drills`, which renders the shared
`DrillLibraryPage` at `src/features/shared/DrillLibraryPage.tsx`).

Every other guide page marks its journey step complete via
`src/components/ui/GuideFooter.tsx` (scroll-to-80% IntersectionObserver +
manual "Mark as read" button, calling `useJourneyStore().markStep(stepId)`).
`DrillLibraryPage` is shared across coach/swimmer/beginner and has **no**
`GuideFooter`, no "mark as read" affordance, and never imports
`useJourneyStore` — so `browse_drills` can never be marked done.

**Why this matters:** `src/features/beginner/JourneyPage.tsx` only renders
a stage's steps once all previous stages are 100% complete
(`prevStagesDone` check, ~line 212). Since Explorer can never finish, the
Learner and Ready stages stay permanently locked, `isAllComplete()` in
`src/store/beginnerJourneyStore.ts` never returns true, and the
`GraduationModal` (`src/features/beginner/GraduationModal.tsx`) never
appears. **This is the reason beginner mode is a dead end.**

**Fix:** Give `DrillLibraryPage` a way to mark `browse_drills` complete when
viewed from the beginner journey. Options, pick whichever fits the design
better:
- Add a beginner-only `GuideFooter`/"mark as read" affordance to
  `DrillLibraryPage`, gated on `profile?.role === 'beginner' || !profile`
  (same check the page already does for `usePlain`), calling
  `markStep('browse_drills')` — either on mount (simplest, matches "browse"
  intent) or on scroll/interaction.
- Or: don't require a "read" action at all for this step — auto-mark
  `browse_drills` complete as soon as the beginner visits
  `/beginner/learn/drills` (a `useEffect` on mount, same pattern as
  `SelfLogPage`'s auto-mark for `first_log`/`timed_swim`/`one_km`).

Verify: after visiting the Drill Library as a fresh beginner (clear
`localStorage` key `swimphoria:beginner-journey`), the Explorer stage should
be able to reach 100%, which should unlock Learner, then Ready, and
completing all 12 steps should trigger `GraduationModal`.

## 2. CRITICAL — no manual skip/graduate action

Currently the *only* way to become a Swimmer from beginner mode is
completing all 12 journey steps and accepting the auto-triggered
`GraduationModal`. There is no explicit "skip beginner mode" or "I'm ready
now" action independent of that.

Note: `src/features/beginner/BeginnerHome.tsx` is **dead code** — it's not
imported or routed anywhere in `src/App.tsx` — but it already contains a
useful pattern worth reviving: a persistent banner shown after the
graduation modal has been dismissed once (`showGradBanner = allDone &&
graduationPromptSeen`, ~line 75) offering "Create your Swimmer profile"
again. `JourneyPage.tsx` (the live `/beginner` page) has no equivalent — once
`GraduationModal` is dismissed via "Continue as Beginner for now", there's
no way to bring it back except finishing all steps again (which is already
true, so effectively no way back at all).

**Fix:**
- Add a persistent "Ready to skip ahead? Become a Swimmer" banner/button to
  `JourneyPage.tsx`, visible any time `graduationPromptSeen` is true (port
  the `BeginnerHome.tsx` banner pattern, ~lines 107-119), that re-opens
  `GraduationModal` on click.
- Additionally add an explicit **"Skip beginner mode"** action (e.g. in the
  beginner Settings page, `src/features/beginner/SettingsPage` route via
  `src/features/shared/SettingsPage.tsx`, or as a persistent low-emphasis
  link in `JourneyPage`) that opens `GraduationModal` immediately regardless
  of `allDone` — i.e. change `GraduationModal`'s `open` prop to be
  controllable independently of step completion, not just
  `allDone && !graduationPromptSeen`. This lets a user jump straight to the
  full dashboard without doing any of the 12 steps, matching "should also
  have a skip button."
- Once `DrillLibraryPage` is fixed (item 1) and a manual skip exists, delete
  `BeginnerHome.tsx` if it's confirmed unused, or otherwise wire it in
  instead of `JourneyPage` — don't leave two competing implementations.

## 3. Google sign-in missing from the main onboarding flow

`src/features/onboarding/OnboardingFlow.tsx` (routed at `/start`, the target
of every "Get started"/"Save your progress" CTA in the beginner area and
marketing pages) has an account-creation step ("Step 5 — Account wall",
~line 519) with email + password fields only. It never imports or renders
`GoogleSignInButton` (`src/features/auth/GoogleSignInButton.tsx`), even
though that exact component is already used on `LoginPage.tsx` and
`SignUpPage.tsx` and works correctly (it self-hides in local/dev mode via
`isLocalMode`).

**Fix:** import and render `<GoogleSignInButton />` in step 5 of
`OnboardingFlow.tsx`, above or below the email/password fields, matching how
it's placed in `SignUpPage.tsx`/`LoginPage.tsx`. After a successful Google
sign-in the existing `AuthCallbackPage` flow should still need to run
`setRole()` with `draft.onboardingRole`/`draft.level` — check whether
`AuthCallbackPage.tsx` currently reads the onboarding draft at all; if not,
persist `draft` (already done via `useOnboardingDraft`, presumably
localStorage-backed) and have `AuthCallbackPage` apply the role/level after
OAuth redirect, same as `submitAccount()` does for email/password today.

## 4. Two orphaned pages (hidden from navigation)

`beginnerNav` in `src/components/layout/nav.ts` (~lines 51-58) only lists:
My Journey, Log a Swim, Learn, Program, Find a Coach, Settings.

- **`MilestonesPage`** (`/beginner/milestones`) is not in `beginnerNav`. The
  only in-app links to it are inside the Ready-to-Swim journey stage
  (`journeySteps.ts` steps `one_km` and `first_milestone`), which per item 1
  never unlocks. `RoleSelectPage.tsx` (~line 14) explicitly advertises
  "milestones" as a reason to pick the beginner role, so this page needs to
  be reachable independent of journey progress.
- **`SelfGuidedPage`** (`/beginner/self-guided`) has zero incoming links from
  anywhere in the app — not in `beginnerNav`, not linked from `JourneyPage`,
  `LearnHub`, or anywhere else. Confirmed via full-repo grep.

**Fix:** add both to `beginnerNav`, or at minimum link `MilestonesPage` from
`JourneyPage` regardless of stage-lock state (e.g. a persistent "View
milestones" link outside the locked-stage sections) and link
`SelfGuidedPage` from `JourneyPage` or `LearnHub`. Decide with product intent
whether `SelfGuidedPage` duplicates `LearnHub`/`JourneyPage` enough to be cut
instead — it currently mostly re-links pages that are already reachable.

## 5. Minor fixes

- `src/features/beginner/SelfGuidedPage.tsx` — the "Take the CSS test" CTA
  (~line 12) links to `/beginner/training`, which redirects to the
  *Training Basics reading guide*, not an actual CSS test tool. There's no
  CSS test page in the beginner area at all (`CssTestPage` only exists at
  `/swimmer/css`). Either add a beginner-accessible CSS test route, or
  change the CTA copy/link so it doesn't overpromise.
- `src/features/beginner/JourneyPage.tsx` `ICON_MAP` (~line 32) is missing
  entries for `DoorOpen` and `Wind`, which `journeySteps.ts` uses for the
  `read_first_visit` and `read_breathing` steps (~lines 34, 41 in
  `journeySteps.ts`). Both currently silently fall back to the generic
  `Target` icon. Add the two missing imports/map entries.
- `src/components/layout/TopBar.tsx` `settingsPath` (~line 70) only computes
  a path for `role === 'coach'`/`'swimmer'`, so the avatar/settings button is
  a dead click for an authenticated user with `profile.role === 'beginner'`
  viewing beginner pages. Add a `/beginner/settings` case.

---

## Suggested implementation order

1. Fix `DrillLibraryPage` mark-as-read (unblocks everything downstream).
2. Add manual skip/re-open-graduation action to `JourneyPage`; resolve
   `BeginnerHome.tsx` dead code either by deleting or replacing `JourneyPage`.
3. Add `GoogleSignInButton` to `/start` step 5 and confirm role/level survive
   the OAuth redirect.
4. Add Milestones + Self-Guided to `beginnerNav` (or otherwise link them).
5. Minor fixes (CSS test link, icon map, TopBar settings path).

After each fix, run `npm test` and `npm run build` (typecheck) per
`CLAUDE.md`. Manually verify the full beginner journey end-to-end with a
cleared `localStorage` (`swimphoria:beginner-journey`,
`sc_beginner_logs`, `sc_beginner_milestones`, `sc_beginner_goal`,
`sc_fitness_done`) to confirm a fresh user can reach the Swimmer dashboard.
