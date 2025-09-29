-- Ensure all required columns exist for expense clearing functionality
-- Date: 2025-01-09

-- Add expense_clearing_items column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'expense_clearing_items') THEN
        ALTER TABLE welfare_requests ADD COLUMN expense_clearing_items TEXT;
        COMMENT ON COLUMN welfare_requests.expense_clearing_items IS 'JSON array of expense clearing items with usedAmount field';
    END IF;
END $$;

-- Add original_advance_request_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'original_advance_request_id') THEN
        ALTER TABLE welfare_requests ADD COLUMN original_advance_request_id INTEGER;
        COMMENT ON COLUMN welfare_requests.original_advance_request_id IS 'Reference to original advance request for expense clearing';
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'end_date') THEN
        ALTER TABLE welfare_requests ADD COLUMN end_date DATE;
        COMMENT ON COLUMN welfare_requests.end_date IS 'วันที่สิ้นสุดกิจกรรม';
    END IF;
END $$;

-- Create foreign key constraint for original_advance_request_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_original_advance_request'
    ) THEN
        ALTER TABLE welfare_requests 
        ADD CONSTRAINT fk_original_advance_request 
        FOREIGN KEY (original_advance_request_id) 
        REFERENCES welfare_requests(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_original_advance_id 
ON welfare_requests(original_advance_request_id) 
WHERE original_advance_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_welfare_requests_end_date 
ON welfare_requests(end_date) 
WHERE end_date IS NOT NULL;

-- Update existing records to ensure proper JSON structure
-- Add usedAmount field to existing advance_expense_items if missing
UPDATE welfare_requests 
SET advance_expense_items = (
    SELECT jsonb_agg(
        CASE 
            WHEN jsonb_typeof(item) = 'object' AND NOT (item ? 'usedAmount') THEN 
                item || jsonb_build_object('usedAmount', 0)
            ELSE item
        END
    )
    FROM jsonb_array_elements(advance_expense_items::jsonb) AS item
)
WHERE advance_expense_items IS NOT NULL 
  AND advance_expense_items != 'null'
  AND advance_expense_items != '[]'
  AND jsonb_typeof(advance_expense_items::jsonb) = 'array';

-- Update existing expense_clearing_items to ensure proper structure
UPDATE welfare_requests 
SET expense_clearing_items = (
    SELECT jsonb_agg(
        CASE 
            WHEN jsonb_typeof(item) = 'object' AND NOT (item ? 'usedAmount') THEN 
                item || jsonb_build_object('usedAmount', 0)
            ELSE item
        END
    )
    FROM jsonb_array_elements(expense_clearing_items::jsonb) AS item
)
WHERE expense_clearing_items IS NOT NULL 
  AND expense_clearing_items != 'null'
  AND expense_clearing_items != '[]'
  AND jsonb_typeof(expense_clearing_items::jsonb) = 'array';

-- Verify the changes
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'welfare_requests' 
      AND column_name IN ('expense_clearing_items', 'original_advance_request_id', 'end_date');
    
    RAISE NOTICE 'Migration completed. % required columns are now present.', col_count;
END $$;