-- Verify that all required columns exist for expense clearing functionality
-- Run this to check current database schema

-- Check if expense_clearing_items column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
  AND column_name IN (
    'expense_clearing_items',
    'original_advance_request_id', 
    'end_date',
    'advance_expense_items'
  )
ORDER BY column_name;

-- Check sample data structure in advance_expense_items
SELECT 
    id,
    request_type,
    advance_expense_items,
    expense_clearing_items
FROM welfare_requests 
WHERE (advance_expense_items IS NOT NULL AND advance_expense_items != 'null')
   OR (expense_clearing_items IS NOT NULL AND expense_clearing_items != 'null')
LIMIT 3;

-- Check if any records have usedAmount in their expense items
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN advance_expense_items::text LIKE '%usedAmount%' THEN 1 END) as records_with_used_amount,
    COUNT(CASE WHEN expense_clearing_items::text LIKE '%usedAmount%' THEN 1 END) as clearing_records_with_used_amount
FROM welfare_requests 
WHERE advance_expense_items IS NOT NULL OR expense_clearing_items IS NOT NULL;