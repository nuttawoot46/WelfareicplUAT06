-- Migration: Add usedAmount support and end_date column for expense clearing
-- Date: 2025-01-09
-- Description: Add support for usedAmount in expense items and end_date for activities

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'end_date') THEN
        ALTER TABLE welfare_requests ADD COLUMN end_date DATE;
        COMMENT ON COLUMN welfare_requests.end_date IS 'วันที่สิ้นสุดกิจกรรม';
    END IF;
END $$;

-- Update existing expense clearing records to include usedAmount field
-- This will add usedAmount: 0 to existing expense items JSON
UPDATE welfare_requests 
SET advance_expense_items = (
    SELECT jsonb_agg(
        CASE 
            WHEN jsonb_typeof(item) = 'object' THEN 
                item || jsonb_build_object('usedAmount', 0)
            ELSE item
        END
    )
    FROM jsonb_array_elements(advance_expense_items::jsonb) AS item
)
WHERE request_type = 'expense-clearing' 
  AND advance_expense_items IS NOT NULL 
  AND advance_expense_items != 'null'
  AND advance_expense_items != '[]'
  AND jsonb_typeof(advance_expense_items::jsonb) = 'array'
  AND NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(advance_expense_items::jsonb) AS item
      WHERE item ? 'usedAmount'
  );

-- Update existing advance records to include usedAmount field (for consistency)
UPDATE welfare_requests 
SET advance_expense_items = (
    SELECT jsonb_agg(
        CASE 
            WHEN jsonb_typeof(item) = 'object' THEN 
                item || jsonb_build_object('usedAmount', 0)
            ELSE item
        END
    )
    FROM jsonb_array_elements(advance_expense_items::jsonb) AS item
)
WHERE request_type = 'advance' 
  AND advance_expense_items IS NOT NULL 
  AND advance_expense_items != 'null'
  AND advance_expense_items != '[]'
  AND jsonb_typeof(advance_expense_items::jsonb) = 'array'
  AND NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(advance_expense_items::jsonb) AS item
      WHERE item ? 'usedAmount'
  );

-- Create index on end_date for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_end_date 
ON welfare_requests(end_date) 
WHERE end_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN welfare_requests.advance_expense_items IS 'JSON array containing expense items with fields: name, taxRate, requestAmount, usedAmount, taxAmount, netAmount, refund';

-- Verify the migration
DO $$
DECLARE
    record_count INTEGER;
    sample_record RECORD;
BEGIN
    -- Count records with usedAmount
    SELECT COUNT(*) INTO record_count
    FROM welfare_requests 
    WHERE advance_expense_items IS NOT NULL 
      AND advance_expense_items != 'null'
      AND advance_expense_items != '[]'
      AND EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(advance_expense_items::jsonb) AS item
          WHERE item ? 'usedAmount'
      );
    
    RAISE NOTICE 'Migration completed. % records now have usedAmount field in expense items.', record_count;
    
    -- Show sample record structure
    SELECT id, advance_expense_items INTO sample_record
    FROM welfare_requests 
    WHERE advance_expense_items IS NOT NULL 
      AND advance_expense_items != 'null'
      AND advance_expense_items != '[]'
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Sample expense items structure: %', sample_record.advance_expense_items;
    END IF;
END $$;