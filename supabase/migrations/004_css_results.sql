-- Store swimmer CSS test results so coaches can see them and the
-- pace calculator is pre-populated across devices.
CREATE TABLE css_results (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id  uuid        NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  t400        numeric     NOT NULL,
  t200        numeric     NOT NULL,
  pace_per_100 numeric    NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE css_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swimmer manages own css"
  ON css_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM swimmers s WHERE s.id = swimmer_id AND s.profile_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM swimmers s WHERE s.id = swimmer_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "coach reads css results"
  ON css_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM swimmers s WHERE s.id = swimmer_id AND s.coach_id = auth.uid())
  );
