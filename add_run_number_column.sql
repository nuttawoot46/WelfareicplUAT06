-- Add run_number column to welfare_requests table for advance payment tracking
-- This will store the unique run number format like ADV202501XXXX

BEGIN;

-- Add run_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'run_number') THEN
        ALTER TABLE welfare_requests ADD COLUMN run_number TEXT;
        COMMENT ON COLUMN welfare_requests.run_number IS 'Unique run number for tracking requests (e.g., ADV202501XXXX)';
        RAISE NOTICE 'Added run_number column successfully';
    ELSE
        RAISE NOTICE 'run_number column already exists';
    END IF;
END $$;

-- Create index on run_number for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_run_number 
ON welfare_requests(run_number) 
WHERE run_number IS NOT NULL;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
  AND column_name = 'run_number';

COMMIT;