-- Migration 003: RLS fixes + improved join_coach with email matching

-- Allow swimmers to delete their own self-logged times
DROP POLICY IF EXISTS "swimmer deletes own times" ON times;
CREATE POLICY "swimmer deletes own times"
  ON times FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM swimmers s
      WHERE s.id = swimmer_id AND s.profile_id = auth.uid()
    )
  );

-- Updated join_coach: handles email-matched placeholder rows so manually-added
-- swimmers don't get a duplicate row when they redeem a join code.
CREATE OR REPLACE FUNCTION join_coach(p_join_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_coach_id       uuid;
  v_swimmer_name   text;
  v_swimmer_level  swim_level;
  v_swimmer_row_id uuid;
  v_user_email     text;
BEGIN
  SELECT id INTO v_coach_id
  FROM profiles
  WHERE join_code = upper(trim(p_join_code)) AND role = 'coach';

  IF v_coach_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid join code — check with your coach and try again');
  END IF;

  IF v_coach_id = auth.uid() THEN
    RETURN json_build_object('error', 'You cannot join yourself');
  END IF;

  IF EXISTS (
    SELECT 1 FROM swimmers
    WHERE coach_id = v_coach_id AND profile_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Already connected to this coach');
  END IF;

  SELECT full_name, COALESCE(level, 'beginner')
  INTO v_swimmer_name, v_swimmer_level
  FROM profiles WHERE id = auth.uid();

  -- Grab the user's auth email so we can match against invite_email
  SELECT email INTO v_user_email
  FROM auth.users WHERE id = auth.uid();

  -- 1. Check if coach already has a placeholder row whose invite_email matches
  SELECT id INTO v_swimmer_row_id
  FROM swimmers
  WHERE coach_id = v_coach_id
    AND profile_id IS NULL
    AND invite_email IS NOT NULL
    AND lower(invite_email) = lower(v_user_email)
  LIMIT 1;

  IF v_swimmer_row_id IS NOT NULL THEN
    -- Link the email-matched placeholder to this user
    UPDATE swimmers SET profile_id = auth.uid() WHERE id = v_swimmer_row_id;
    -- Remove any self-managed row to avoid duplicates
    DELETE FROM swimmers WHERE coach_id = auth.uid() AND profile_id = auth.uid();
  ELSE
    -- 2. Try to repurpose the self-managed swimmer row created during onboarding
    UPDATE swimmers
    SET coach_id = v_coach_id
    WHERE profile_id = auth.uid() AND coach_id = auth.uid()
    RETURNING id INTO v_swimmer_row_id;

    IF v_swimmer_row_id IS NULL THEN
      -- 3. No self-managed row exists; create a fresh one
      INSERT INTO swimmers (coach_id, profile_id, display_name, level)
      VALUES (v_coach_id, auth.uid(), COALESCE(v_swimmer_name, 'Swimmer'), v_swimmer_level)
      RETURNING id INTO v_swimmer_row_id;
    END IF;
  END IF;

  UPDATE profiles SET coach_id = v_coach_id WHERE id = auth.uid();
  RETURN json_build_object('success', true, 'swimmer_id', v_swimmer_row_id);
END;
$$;

-- Allow swimmers to read and create their own booking requests
DROP POLICY IF EXISTS "swimmer reads own bookings" ON bookings;
CREATE POLICY "swimmer reads own bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM swimmers s
      WHERE s.id = swimmer_id AND s.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "swimmer requests booking" ON bookings;
CREATE POLICY "swimmer requests booking"
  ON bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM swimmers s
      WHERE s.id = swimmer_id AND s.profile_id = auth.uid()
    )
  );
