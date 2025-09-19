-- Check welfare_requests table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'welfare_requests';

-- Check if expense-clearing is allowed in request_type
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%request_type%';

-- Test insert with minimal data
INSERT INTO welfare_requests (
    employee_id,
    employee_name,
    request_type,
    status,
    amount,
    created_at
) VALUES (
    1,
    'Test User',
    'expense-clearing',
    'pending_manager',
    0.00,
    NOW()
) RETURNING id, request_type, status;