-- Add optional drill reference to logged times so coaches/swimmers can tag
-- which drill a timed effort belongs to.
ALTER TABLE times
  ADD COLUMN IF NOT EXISTS drill_id uuid
    REFERENCES drills (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS times_drill_idx ON times (drill_id)
  WHERE drill_id IS NOT NULL;
