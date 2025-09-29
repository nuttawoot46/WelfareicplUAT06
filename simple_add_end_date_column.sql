-- Simple migration to add end_date column only
-- Date: 2025-01-09
-- Description: Add end_date column without touching existing JSON data

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'end_date') THEN
        ALTER TABLE welfare_requests ADD COLUMN end_date DATE;
        COMMENT ON COLUMN welfare_requests.end_date IS 'วันที่สิ้นสุดกิจกรรม';
        RAISE NOTICE 'Added end_date column successfully';
    ELSE
        RAISE NOTICE 'end_date column already exists';
    END IF;
END $$;

-- Create index on end_date for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_end_date 
ON welfare_requests(end_date) 
WHERE end_date IS NOT NULL;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
  AND column_name = 'end_date';

RAISE NOTICE 'Migration completed. The end_date column is now available for use.';