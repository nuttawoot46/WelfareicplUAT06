-- Add run_number column to welfare_requests table for advance payment tracking
-- This will store the unique run number format like ADV202501XXXX

-- Add run_number column if it doesn't exist
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS run_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN welfare_requests.run_number IS 'Unique run number for tracking advance payment requests (e.g., ADV202501XXXX)';

-- Create index on run_number for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_run_number 
ON welfare_requests(run_number) 
WHERE run_number IS NOT NULL;