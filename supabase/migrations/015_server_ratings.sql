-- ─── Phase 1: server-side rating engine ──────────────────────────────────────
-- ─── Phase 2: formula fixes (applied here; mirrored in statsEngine.ts) ───────

-- ─── recalc_swimmer_stats ─────────────────────────────────────────────────────
-- Recalculates all six stat dimensions + OVR/tier for a single user.
-- Security definer so it can read cross-user data for the admin path.
-- Authenticated users may only target their own user_id; pg_cron calls
-- with auth.uid() = NULL which skips that check.
CREATE OR REPLACE FUNCTION public.recalc_swimmer_stats(
  target_user   uuid,
  snapshot_prev boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swimmer_id         uuid;
  v_coach_id           uuid;
  v_pb_count           integer := 0;
  v_css_pace           numeric;
  v_stroke_variety     integer := 0;
  v_total_dist_km      numeric := 0;
  v_dist_milestones    integer := 0;
  v_drills_created     integer := 0;
  v_structured_done    integer := 0;
  v_weeks_sessions     integer := 0;
  v_goals_achieved     integer := 0;
  v_goals_set          integer := 0;
  v_feedback_received  integer := 0;
  v_days_active        integer := 0;
  v_has_coach          boolean := false;
  v_improvement_count  integer := 0;

  v_dates          date[];
  v_longest_streak integer := 0;
  v_current_streak integer := 0;
  v_run            integer;
  v_today          date := CURRENT_DATE;
  v_check_date     date;
  v_last_swim_date date;

  v_spd_score  numeric;
  v_end_score  numeric;
  v_tec_score  numeric;
  v_con_score  numeric;
  v_prg_score  numeric;
  v_com_score  numeric;

  v_spd      integer;
  v_end_stat integer;
  v_tec      integer;
  v_con      integer;
  v_prg      integer;
  v_com      integer;
  v_ovr      integer;
  v_tier     text;

  v_existing_ovr       integer;
  v_existing_last_calc timestamptz;
  v_prev_ovr           integer;
  v_inactive_days      integer;
BEGIN
  -- Authenticated users may only recalc their own stats.
  -- Admins and pg_cron (auth.uid() = NULL) are exempt.
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> target_user
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- ── Profile ──────────────────────────────────────────────────────────────────
  SELECT coach_id INTO v_coach_id FROM public.profiles WHERE id = target_user;
  v_has_coach := v_coach_id IS NOT NULL;

  -- ── Swimmer row ──────────────────────────────────────────────────────────────
  SELECT id INTO v_swimmer_id FROM public.swimmers WHERE profile_id = target_user LIMIT 1;

  -- ── Times ────────────────────────────────────────────────────────────────────
  IF v_swimmer_id IS NOT NULL THEN
    SELECT
      COUNT(*)              FILTER (WHERE is_pb),
      COUNT(DISTINCT stroke),
      COALESCE(SUM(distance) / 1000.0, 0),
      COUNT(DISTINCT recorded_at::date)
    INTO v_pb_count, v_stroke_variety, v_total_dist_km, v_days_active
    FROM public.times
    WHERE swimmer_id = v_swimmer_id;

    v_improvement_count := v_pb_count;

    -- Distinct swim dates sorted ascending
    SELECT ARRAY_AGG(dt ORDER BY dt)
    INTO v_dates
    FROM (
      SELECT DISTINCT recorded_at::date AS dt
      FROM public.times
      WHERE swimmer_id = v_swimmer_id
    ) sub;

    IF v_dates IS NOT NULL AND array_length(v_dates, 1) > 0 THEN
      v_last_swim_date := v_dates[array_length(v_dates, 1)];

      -- Longest consecutive-day streak
      v_longest_streak := 1;
      v_run := 1;
      FOR i IN 2 .. array_length(v_dates, 1) LOOP
        IF v_dates[i] = v_dates[i - 1] + 1 THEN
          v_run := v_run + 1;
          IF v_run > v_longest_streak THEN v_longest_streak := v_run; END IF;
        ELSE
          v_run := 1;
        END IF;
      END LOOP;

      -- Current streak back from today
      v_check_date := v_today;
      WHILE v_check_date = ANY(v_dates) LOOP
        v_current_streak := v_current_streak + 1;
        v_check_date := v_check_date - 1;
      END LOOP;
    END IF;

    -- ISO weeks that had at least one session
    SELECT COUNT(DISTINCT TO_CHAR(recorded_at, 'IYYY-IW'))
    INTO v_weeks_sessions
    FROM public.times
    WHERE swimmer_id = v_swimmer_id;

    -- Most recent CSS T-pace (seconds per 100 m; lower = faster)
    SELECT pace_per_100 INTO v_css_pace
    FROM public.css_results
    WHERE swimmer_id = v_swimmer_id
    ORDER BY recorded_at DESC LIMIT 1;

    -- Goals
    SELECT
      COUNT(*) FILTER (WHERE achieved),
      COUNT(*)
    INTO v_goals_achieved, v_goals_set
    FROM public.goals
    WHERE swimmer_id = v_swimmer_id;

    -- Structured sessions attended
    SELECT COUNT(*) INTO v_structured_done
    FROM public.session_assignments
    WHERE swimmer_id = v_swimmer_id AND attended = true;

    -- Feedback received from coach
    SELECT COUNT(*) INTO v_feedback_received
    FROM public.feedback
    WHERE swimmer_id = v_swimmer_id;
  END IF;

  -- ── Milestones (profile-scoped) ───────────────────────────────────────────────
  SELECT COUNT(*) INTO v_dist_milestones
  FROM public.milestones
  WHERE profile_id = target_user AND achieved = true;

  -- ── Drills created (coaches earn TEC via drills they create; ×2 = drillsViewed) ──
  SELECT COUNT(*) INTO v_drills_created
  FROM public.drills
  WHERE coach_id = target_user;

  -- ─────────────────────────────────────────────────────────────────────────────
  -- Phase 2 formulas — keep in sync with src/lib/statsEngine.ts
  -- ─────────────────────────────────────────────────────────────────────────────

  -- SPD: pbCount*4 + cssBonus + improvementCount*5 (strokeVariety removed)
  v_spd_score := v_pb_count * 4
    + CASE WHEN v_css_pace IS NOT NULL THEN GREATEST(0.0, 200.0 - v_css_pace) * 0.5 ELSE 0 END
    + v_improvement_count * 5;
  v_spd := GREATEST(15, FLOOR(99.0 * (1.0 - EXP(-0.016 * v_spd_score))))::integer;

  -- END: totalDistKm*2.5 + distMilestones*12 + weeksWithSessions*3
  v_end_score := v_total_dist_km * 2.5 + v_dist_milestones * 12 + v_weeks_sessions * 3;
  v_end_stat := GREATEST(15, FLOOR(99.0 * (1.0 - EXP(-0.014 * v_end_score))))::integer;

  -- TEC: drillsViewed*3 + strokeVariety*8 + feedbackReceived*5 (structuredSessionsDone removed)
  v_tec_score := (v_drills_created * 2) * 3 + v_stroke_variety * 8 + v_feedback_received * 5;
  v_tec := GREATEST(10, FLOOR(99.0 * (1.0 - EXP(-0.015 * v_tec_score))))::integer;

  -- CON: currentStreak*2 + longestStreak*1.5 + weeksWithSessions*4
  v_con_score := v_current_streak * 2 + v_longest_streak * 1.5 + v_weeks_sessions * 4;
  v_con := GREATEST(20, FLOOR(99.0 * (1.0 - EXP(-0.017 * v_con_score))))::integer;

  -- CON decay: -2 pts per full inactive week beyond 14 days, floor 20
  IF v_last_swim_date IS NOT NULL THEN
    v_inactive_days := v_today - v_last_swim_date;
    IF v_inactive_days > 14 THEN
      v_con := GREATEST(20, v_con - ((v_inactive_days - 14) / 7) * 2);
    END IF;
  END IF;

  -- PRG: goalsAchieved*12 + pbCount*3 (improvementCount removed)
  v_prg_score := v_goals_achieved * 12 + v_pb_count * 3;
  v_prg := GREATEST(10, FLOOR(99.0 * (1.0 - EXP(-0.013 * v_prg_score))))::integer;

  -- COM: daysActive*1.5 + hasCoach*20 + goalsSet*4 + structuredSessionsDone*3 (messagesSent removed)
  v_com_score := v_days_active * 1.5
    + CASE WHEN v_has_coach THEN 20.0 ELSE 0 END
    + v_goals_set * 4
    + v_structured_done * 3;
  v_com := GREATEST(20, FLOOR(99.0 * (1.0 - EXP(-0.016 * v_com_score))))::integer;

  -- OVR weighted composite
  v_ovr := FLOOR(v_spd * 0.25 + v_end_stat * 0.2 + v_tec * 0.15 + v_con * 0.2 + v_prg * 0.1 + v_com * 0.1)::integer;

  v_tier := CASE
    WHEN v_ovr >= 97 THEN 'mythic'
    WHEN v_ovr >= 92 THEN 'legend'
    WHEN v_ovr >= 85 THEN 'elite'
    WHEN v_ovr >= 75 THEN 'gold'
    WHEN v_ovr >= 65 THEN 'silver'
    WHEN v_ovr >= 50 THEN 'bronze'
    ELSE 'rookie'
  END;

  -- ── prev_ovr snapshot ─────────────────────────────────────────────────────────
  SELECT ovr, last_calculated
  INTO v_existing_ovr, v_existing_last_calc
  FROM public.swimmer_stats
  WHERE user_id = target_user;

  IF snapshot_prev
     AND v_existing_ovr IS NOT NULL
     AND (now() - v_existing_last_calc) >= INTERVAL '7 days'
  THEN
    v_prev_ovr := v_existing_ovr;
  ELSE
    v_prev_ovr := COALESCE(v_existing_ovr, v_ovr);
  END IF;

  -- ── Upsert ────────────────────────────────────────────────────────────────────
  INSERT INTO public.swimmer_stats
    (user_id, ovr, prev_ovr, spd, end_stat, tec, con, prg, com, tier, last_calculated)
  VALUES
    (target_user, v_ovr, v_prev_ovr, v_spd, v_end_stat, v_tec, v_con, v_prg, v_com, v_tier, now())
  ON CONFLICT (user_id) DO UPDATE SET
    ovr             = EXCLUDED.ovr,
    prev_ovr        = EXCLUDED.prev_ovr,
    spd             = EXCLUDED.spd,
    end_stat        = EXCLUDED.end_stat,
    tec             = EXCLUDED.tec,
    con             = EXCLUDED.con,
    prg             = EXCLUDED.prg,
    com             = EXCLUDED.com,
    tier            = EXCLUDED.tier,
    last_calculated = EXCLUDED.last_calculated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_swimmer_stats(uuid, boolean) TO authenticated;

-- ─── recalc_all_swimmer_stats ─────────────────────────────────────────────────
-- Called by pg_cron; not callable by regular users.
CREATE OR REPLACE FUNCTION public.recalc_all_swimmer_stats(snapshot_prev boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid;
BEGIN
  FOR v_uid IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalc_swimmer_stats(v_uid, snapshot_prev);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_all_swimmer_stats(boolean) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.recalc_all_swimmer_stats(boolean) TO service_role;

-- ─── RLS: remove direct write access — stats are now server-side only ─────────
DROP POLICY IF EXISTS "Users update own stats" ON public.swimmer_stats;
DROP POLICY IF EXISTS "Users insert own stats" ON public.swimmer_stats;

-- ─── pg_cron: weekly recalc every Sunday 20:00 UTC ───────────────────────────
-- Requires the pg_cron extension (enable in Supabase dashboard → Database → Extensions).
DO $$
BEGIN
  PERFORM cron.schedule(
    'swimphoria-weekly-ratings',
    '0 20 * * 0',
    'SELECT public.recalc_all_swimmer_stats(true)'
  );
EXCEPTION WHEN invalid_schema_name OR undefined_function THEN
  RAISE NOTICE 'pg_cron not available — enable it in the Supabase dashboard to activate weekly ratings.';
END $$;
