-- Migration: Add VAT amount field to expense clearing items
-- Date: 2025-02-11
-- Description: Adds vatAmount field to expense_clearing_items JSONB structure

-- Note: Since expense_clearing_items is stored as JSONB, we don't need to alter the column
-- We just need to ensure that new records include the vatAmount field
-- This migration updates existing records to include vatAmount = 0

-- Update existing expense clearing records to add vatAmount field
UPDATE welfare_requests 
SET expense_clearing_items = (
    SELECT jsonb_agg(
        item || jsonb_build_object('vatAmount', 0)
    )
    FROM jsonb_array_elements(expense_clearing_items::jsonb) AS item
)
WHERE request_type = 'expense-clearing'
  AND expense_clearing_items IS NOT NULL 
  AND expense_clearing_items != 'null'
  AND expense_clearing_items != '[]'
  AND jsonb_typeof(expense_clearing_items::jsonb) = 'array'
  AND NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(expense_clearing_items::jsonb) AS item
    WHERE item ? 'vatAmount'
  );

-- Add comment for documentation
COMMENT ON COLUMN welfare_requests.expense_clearing_items IS 'JSON array of expense clearing items with fields: name, taxRate, requestAmount, usedAmount, vatAmount, taxAmount, netAmount, refund, otherDescription';

-- Verify the update
DO $$ 
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM welfare_requests 
    WHERE request_type = 'expense-clearing'
      AND expense_clearing_items IS NOT NULL
      AND jsonb_typeof(expense_clearing_items::jsonb) = 'array';
    
    RAISE NOTICE 'Updated % expense clearing records with vatAmount field', updated_count;
END $$;

-- Show sample of updated records
SELECT 
    id,
    run_number,
    request_type,
    expense_clearing_items
FROM welfare_requests 
WHERE request_type = 'expense-clearing'
  AND expense_clearing_items IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;
