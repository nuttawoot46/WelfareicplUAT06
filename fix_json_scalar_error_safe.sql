-- Safe migration to fix JSON scalar error and add usedAmount field
-- Date: 2025-01-09
-- Description: Safely handle different JSON structures and add usedAmount field

-- First, let's check what we're dealing with
DO $$
DECLARE
    rec RECORD;
    total_count INTEGER := 0;
    array_count INTEGER := 0;
    scalar_count INTEGER := 0;
    null_count INTEGER := 0;
BEGIN
    -- Count different types of JSON structures
    FOR rec IN 
        SELECT 
            id,
            advance_expense_items,
            CASE 
                WHEN advance_expense_items IS NULL OR advance_expense_items = 'null' THEN 'null'
                WHEN advance_expense_items = '[]' THEN 'empty_array'
                WHEN jsonb_typeof(advance_expense_items::jsonb) = 'array' THEN 'array'
                ELSE 'scalar'
            END as json_type
        FROM welfare_requests 
        WHERE advance_expense_items IS NOT NULL
    LOOP
        total_count := total_count + 1;
        
        CASE rec.json_type
            WHEN 'array' THEN array_count := array_count + 1;
            WHEN 'scalar' THEN scalar_count := scalar_count + 1;
            WHEN 'null' THEN null_count := null_count + 1;
        END CASE;
    END LOOP;
    
    RAISE NOTICE 'JSON Structure Analysis:';
    RAISE NOTICE 'Total records: %', total_count;
    RAISE NOTICE 'Array structures: %', array_count;
    RAISE NOTICE 'Scalar structures: %', scalar_count;
    RAISE NOTICE 'Null/empty: %', null_count;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'welfare_requests' AND column_name = 'end_date') THEN
        ALTER TABLE welfare_requests ADD COLUMN end_date DATE;
        COMMENT ON COLUMN welfare_requests.end_date IS 'วันที่สิ้นสุดกิจกรรม';
        RAISE NOTICE 'Added end_date column';
    ELSE
        RAISE NOTICE 'end_date column already exists';
    END IF;
END $$;

-- Safely update records with array JSON structures
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

-- Handle scalar JSON structures (convert to array if needed)
UPDATE welfare_requests 
SET advance_expense_items = jsonb_build_array(
    CASE 
        WHEN jsonb_typeof(advance_expense_items::jsonb) = 'object' AND NOT (advance_expense_items::jsonb ? 'usedAmount') THEN 
            advance_expense_items::jsonb || jsonb_build_object('usedAmount', 0)
        ELSE advance_expense_items::jsonb
    END
)
WHERE advance_expense_items IS NOT NULL 
  AND advance_expense_items != 'null'
  AND advance_expense_items != '[]'
  AND jsonb_typeof(advance_expense_items::jsonb) = 'object';

-- Create index on end_date for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_end_date 
ON welfare_requests(end_date) 
WHERE end_date IS NOT NULL;

-- Update comment for documentation
COMMENT ON COLUMN welfare_requests.advance_expense_items IS 'JSON array containing expense items with fields: name, taxRate, requestAmount, usedAmount, taxAmount, netAmount, refund';

-- Final verification
DO $$
DECLARE
    updated_count INTEGER;
    sample_record RECORD;
BEGIN
    -- Count records with usedAmount
    SELECT COUNT(*) INTO updated_count
    FROM welfare_requests 
    WHERE advance_expense_items IS NOT NULL 
      AND advance_expense_items != 'null'
      AND advance_expense_items != '[]'
      AND (
          (jsonb_typeof(advance_expense_items::jsonb) = 'array' AND 
           EXISTS (SELECT 1 FROM jsonb_array_elements(advance_expense_items::jsonb) AS item WHERE item ? 'usedAmount'))
          OR
          (jsonb_typeof(advance_expense_items::jsonb) = 'object' AND advance_expense_items::jsonb ? 'usedAmount')
      );
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '% records now have usedAmount field in expense items.', updated_count;
    
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