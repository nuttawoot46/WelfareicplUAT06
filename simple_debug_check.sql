-- Simple debug check for expense clearing

-- 1. Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
AND column_name IN ('original_advance_request_id', 'expense_clearing_items')
ORDER BY column_name;

-- 2. Check request_type constraint
SELECT check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%request_type%';

-- 3. Get a real employee name first
SELECT id, Name FROM "Employee" WHERE id = 79 LIMIT 1;

-- 4. Test simple insert with real employee name
INSERT INTO welfare_requests (
    employee_id,
    employee_name,
    request_type,
    status,
    amount,
    created_at
) VALUES (
    79,
    'ณัฐวุฒิ สุมานิก',  -- Use your actual name
    'expense-clearing',
    'pending_manager',
    0.00,
    NOW()
) RETURNING id, request_type, status;

-- 5. Clean up test data
DELETE FROM welfare_requests 
WHERE employee_name = 'ณัฐวุฒิ สุมานิก' 
AND request_type = 'expense-clearing' 
AND amount = 0.00;