-- Fix foreign key constraint issue for welfare_requests

-- 1. Check existing foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='welfare_requests';

-- 2. Drop the problematic foreign key constraint on employee_name
ALTER TABLE welfare_requests 
DROP CONSTRAINT IF EXISTS welfare_requests_employee_name_fkey;

-- 3. Test insert again with a real employee name
-- First, get a real employee name from your Employee table
SELECT Name FROM "Employee" LIMIT 1;

-- 4. Test insert with real employee data
INSERT INTO welfare_requests (
    employee_id,
    employee_name,
    request_type,
    status,
    amount,
    created_at
) VALUES (
    79,
    'ณัฐวุฒิ สุมานิก',  -- Use your actual name from Employee table
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