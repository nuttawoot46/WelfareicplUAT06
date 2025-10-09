-- Add 'general-advance' to the request_type check constraint
-- This allows the new general advance form type to be stored in the database

-- First, drop the existing constraint
ALTER TABLE welfare_requests DROP CONSTRAINT IF EXISTS welfare_requests_request_type_check;

-- Recreate the constraint with the new 'general-advance' type included
ALTER TABLE welfare_requests ADD CONSTRAINT welfare_requests_request_type_check 
CHECK (request_type IN (
    'wedding',
    'training', 
    'childbirth',
    'funeral',
    'glasses',
    'dental',
    'fitness',
    'medical',
    'internal_training',
    'advance',
    'general-advance',
    'expense-clearing'
));

-- Add comment for documentation
COMMENT ON CONSTRAINT welfare_requests_request_type_check ON welfare_requests IS 'Ensures request_type is one of the valid welfare/accounting types including general-advance';

-- Verify the constraint was created successfully
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'welfare_requests_request_type_check';