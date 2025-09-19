-- Fix for Expense Clearing Database Issues
-- Run this SQL in your Supabase SQL Editor

-- 1. Add expense clearing columns
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS original_advance_request_id INTEGER,
ADD COLUMN IF NOT EXISTS expense_clearing_items JSONB;

-- 2. Update request_type constraint to include expense-clearing
ALTER TABLE welfare_requests DROP CONSTRAINT IF EXISTS welfare_requests_request_type_check;

ALTER TABLE welfare_requests 
ADD CONSTRAINT welfare_requests_request_type_check 
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
    'expense-clearing'
));

-- 3. Ensure advance payment columns exist
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_district VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_activity_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_activity_other TEXT,
ADD COLUMN IF NOT EXISTS advance_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_participants INTEGER,
ADD COLUMN IF NOT EXISTS advance_dealer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_subdealer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_amphur VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_province VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_event_date DATE,
ADD COLUMN IF NOT EXISTS advance_expense_items JSONB;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_welfare_requests_expense_clearing 
ON welfare_requests(request_type) WHERE request_type = 'expense-clearing';

CREATE INDEX IF NOT EXISTS idx_welfare_requests_original_advance 
ON welfare_requests(original_advance_request_id);

-- 5. Test the setup
SELECT 'Setup completed successfully' as status;