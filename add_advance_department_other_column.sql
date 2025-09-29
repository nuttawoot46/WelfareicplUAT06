-- Add separate column for advance department other specification
-- This separates department "other" specification from activity "other" specification

ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department_other TEXT;

-- Add comment to clarify the purpose
COMMENT ON COLUMN welfare_requests.advance_department_other IS 'Specification when advance_department is "อื่นๆ"';
COMMENT ON COLUMN welfare_requests.advance_activity_other IS 'Specification when advance_activity_type is "อื่นๆ"';

-- Update existing records where advance_activity_other might contain department info
-- This is a manual step that should be reviewed based on existing data