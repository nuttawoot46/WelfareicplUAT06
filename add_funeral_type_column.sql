-- Add funeral_type column to welfare_requests table
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS funeral_type TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN welfare_requests.funeral_type IS 'Type of funeral welfare (employee_spouse, child, parent)';