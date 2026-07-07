-- ─── Phase 3.1: identity fields on swimmer_stats ─────────────────────────────
ALTER TABLE public.swimmer_stats
  ADD COLUMN IF NOT EXISTS main_stroke           text,
  ADD COLUMN IF NOT EXISTS signature_event       text,
  ADD COLUMN IF NOT EXISTS signature_time_seconds integer;

-- ─── club_name on profiles ────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS club_name text;

-- ─── RLS: coaches can read their swimmers' stats ──────────────────────────────
DROP POLICY IF EXISTS "Coaches read squad stats" ON public.swimmer_stats;
CREATE POLICY "Coaches read squad stats" ON public.swimmer_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_id AND coach_id = auth.uid()
    )
  );

-- ─── Update recalc_swimmer_stats to auto-populate identity fields ─────────────
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

  -- identity fields
  v_main_stroke           text;
  v_sig_distance          integer;
  v_sig_stroke            text;
  v_signature_event       text;
  v_signature_time_seconds integer;

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
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> target_user
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT coach_id INTO v_coach_id FROM public.profiles WHERE id = target_user;
  v_has_coach := v_coach_id IS NOT NULL;

  SELECT id INTO v_swimmer_id FROM public.swimmers WHERE profile_id = target_user LIMIT 1;

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

    SELECT ARRAY_AGG(dt ORDER BY dt)
    INTO v_dates
    FROM (
      SELECT DISTINCT recorded_at::date AS dt
      FROM public.times
      WHERE swimmer_id = v_swimmer_id
    ) sub;

    IF v_dates IS NOT NULL AND array_length(v_dates, 1) > 0 THEN
      v_last_swim_date := v_dates[array_length(v_dates, 1)];

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

      v_check_date := v_today;
      WHILE v_check_date = ANY(v_dates) LOOP
        v_current_streak := v_current_streak + 1;
        v_check_date := v_check_date - 1;
      END LOOP;
    END IF;

    SELECT COUNT(DISTINCT TO_CHAR(recorded_at, 'IYYY-IW'))
    INTO v_weeks_sessions
    FROM public.times
    WHERE swimmer_id = v_swimmer_id;

    SELECT pace_per_100 INTO v_css_pace
    FROM public.css_results
    WHERE swimmer_id = v_swimmer_id
    ORDER BY recorded_at DESC LIMIT 1;

    SELECT
      COUNT(*) FILTER (WHERE achieved),
      COUNT(*)
    INTO v_goals_achieved, v_goals_set
    FROM public.goals
    WHERE swimmer_id = v_swimmer_id;

    SELECT COUNT(*) INTO v_structured_done
    FROM public.session_assignments
    WHERE swimmer_id = v_swimmer_id AND attended = true;

    SELECT COUNT(*) INTO v_feedback_received
    FROM public.feedback
    WHERE swimmer_id = v_swimmer_id;

    -- ── Identity: main_stroke ─────────────────────────────────────────────────
    SELECT stroke INTO v_main_stroke
    FROM (
      SELECT stroke,
             COUNT(*) FILTER (WHERE is_pb) AS pb_cnt,
             COUNT(*)                        AS total
      FROM public.times WHERE swimmer_id = v_swimmer_id
      GROUP BY stroke
      ORDER BY pb_cnt DESC, total DESC
      LIMIT 1
    ) sub;

    -- ── Identity: signature_event + signature_time_seconds ────────────────────
    SELECT distance, stroke INTO v_sig_distance, v_sig_stroke
    FROM (
      SELECT distance, stroke, COUNT(*) AS cnt
      FROM public.times
      WHERE swimmer_id = v_swimmer_id AND is_pb = true
      GROUP BY distance, stroke
      ORDER BY cnt DESC
      LIMIT 1
    ) sub;

    IF v_sig_stroke IS NULL THEN
      SELECT distance, stroke INTO v_sig_distance, v_sig_stroke
      FROM (
        SELECT distance, stroke, COUNT(*) AS cnt
        FROM public.times WHERE swimmer_id = v_swimmer_id
        GROUP BY distance, stroke
        ORDER BY cnt DESC
        LIMIT 1
      ) sub;
    END IF;

    IF v_sig_stroke IS NOT NULL THEN
      SELECT MIN(time_seconds) INTO v_signature_time_seconds
      FROM public.times
      WHERE swimmer_id = v_swimmer_id
        AND distance = v_sig_distance
        AND stroke = v_sig_stroke;
      v_signature_event := v_sig_distance::text || 'm ' || v_sig_stroke;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_dist_milestones
  FROM public.milestones
  WHERE profile_id = target_user AND achieved = true;

  SELECT COUNT(*) INTO v_drills_created
  FROM public.drills
  WHERE coach_id = target_user;

  -- Phase 2 formulas
  v_spd_score := v_pb_count * 4
    + CASE WHEN v_css_pace IS NOT NULL THEN GREATEST(0.0, 200.0 - v_css_pace) * 0.5 ELSE 0 END
    + v_improvement_count * 5;
  v_spd := GREATEST(15, FLOOR(99.0 * (1.0 - EXP(-0.016 * v_spd_score))))::integer;

  v_end_score := v_total_dist_km * 2.5 + v_dist_milestones * 12 + v_weeks_sessions * 3;
  v_end_stat := GREATEST(15, FLOOR(99.0 * (1.0 - EXP(-0.014 * v_end_score))))::integer;

  v_tec_score := (v_drills_created * 2) * 3 + v_stroke_variety * 8 + v_feedback_received * 5;
  v_tec := GREATEST(10, FLOOR(99.0 * (1.0 - EXP(-0.015 * v_tec_score))))::integer;

  v_con_score := v_current_streak * 2 + v_longest_streak * 1.5 + v_weeks_sessions * 4;
  v_con := GREATEST(20, FLOOR(99.0 * (1.0 - EXP(-0.017 * v_con_score))))::integer;

  IF v_last_swim_date IS NOT NULL THEN
    v_inactive_days := v_today - v_last_swim_date;
    IF v_inactive_days > 14 THEN
      v_con := GREATEST(20, v_con - ((v_inactive_days - 14) / 7) * 2);
    END IF;
  END IF;

  v_prg_score := v_goals_achieved * 12 + v_pb_count * 3;
  v_prg := GREATEST(10, FLOOR(99.0 * (1.0 - EXP(-0.013 * v_prg_score))))::integer;

  v_com_score := v_days_active * 1.5
    + CASE WHEN v_has_coach THEN 20.0 ELSE 0 END
    + v_goals_set * 4
    + v_structured_done * 3;
  v_com := GREATEST(20, FLOOR(99.0 * (1.0 - EXP(-0.016 * v_com_score))))::integer;

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

  INSERT INTO public.swimmer_stats (
    user_id, ovr, prev_ovr, spd, end_stat, tec, con, prg, com, tier,
    main_stroke, signature_event, signature_time_seconds, last_calculated
  ) VALUES (
    target_user, v_ovr, v_prev_ovr, v_spd, v_end_stat, v_tec, v_con, v_prg, v_com, v_tier,
    v_main_stroke, v_signature_event, v_signature_time_seconds, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    ovr                     = EXCLUDED.ovr,
    prev_ovr                = EXCLUDED.prev_ovr,
    spd                     = EXCLUDED.spd,
    end_stat                = EXCLUDED.end_stat,
    tec                     = EXCLUDED.tec,
    con                     = EXCLUDED.con,
    prg                     = EXCLUDED.prg,
    com                     = EXCLUDED.com,
    tier                    = EXCLUDED.tier,
    main_stroke             = EXCLUDED.main_stroke,
    signature_event         = EXCLUDED.signature_event,
    signature_time_seconds  = EXCLUDED.signature_time_seconds,
    last_calculated         = EXCLUDED.last_calculated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_swimmer_stats(uuid, boolean) TO authenticated;
