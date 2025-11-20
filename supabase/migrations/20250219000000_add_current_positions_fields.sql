-- Add current employee and position tracking fields for employment approval

ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS current_employee_count INTEGER,
ADD COLUMN IF NOT EXISTS current_positions JSONB;

-- Add comments for documentation
COMMENT ON COLUMN welfare_requests.current_employee_count IS 'Current number of employees in the department';
COMMENT ON COLUMN welfare_requests.current_positions IS 'JSON array of current positions in department: [{positionName: string, count: number}]';
