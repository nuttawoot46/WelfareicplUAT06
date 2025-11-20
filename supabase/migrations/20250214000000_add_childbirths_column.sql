-- Add childbirths column to welfare_requests table
-- This column stores JSON array of children for childbirth welfare type
-- Each child has: childName (optional) and birthType ('natural' or 'caesarean')

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'welfare_requests'
    AND column_name = 'childbirths'
  ) THEN
    ALTER TABLE welfare_requests
    ADD COLUMN childbirths jsonb;

    COMMENT ON COLUMN welfare_requests.childbirths IS 'JSON array of children for childbirth welfare type. Format: [{"childName": "string", "birthType": "natural|caesarean"}]';
  END IF;
END $$;
