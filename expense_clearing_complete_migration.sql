-- ===================================================================
-- EXPENSE CLEARING FORM - COMPLETE DATABASE MIGRATION
-- ===================================================================
-- This file contains all SQL statements needed for the Expense Clearing system

-- 1. Add expense clearing columns to welfare_requests table
-- ===================================================================
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS original_advance_request_id INTEGER REFERENCES welfare_requests(id),
ADD COLUMN IF NOT EXISTS expense_clearing_items JSONB;

-- Add comments for documentation
COMMENT ON COLUMN welfare_requests.original_advance_request_id IS 'Reference to the original advance payment request that this expense clearing is for';
COMMENT ON COLUMN welfare_requests.expense_clearing_items IS 'JSON array of expense clearing items with actual usage amounts';

-- 2. Create indexes for better performance
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_welfare_requests_original_advance_request_id 
ON welfare_requests(original_advance_request_id);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_expense_clearing_type 
ON welfare_requests(request_type) WHERE request_type = 'expense-clearing';

-- 3. Update request_type constraint to include expense-clearing
-- ===================================================================
-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'welfare_requests_request_type_check' 
        AND table_name = 'welfare_requests'
    ) THEN
        ALTER TABLE welfare_requests DROP CONSTRAINT welfare_requests_request_type_check;
    END IF;
END $$;

-- Add the updated constraint with expense-clearing
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

-- 4. Ensure all advance payment columns exist (from previous migrations)
-- ===================================================================
-- These columns should already exist from advance payment implementation
-- Adding them with IF NOT EXISTS for safety

ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_district VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_activity_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_activity_other TEXT,
ADD COLUMN IF NOT EXISTS advance_shop_company VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_amphur VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_province VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_event_date DATE,
ADD COLUMN IF NOT EXISTS advance_participants INTEGER,
ADD COLUMN IF NOT EXISTS advance_daily_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_accommodation_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_transportation_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_meal_allowance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_other_expenses DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_project_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_project_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_dealer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_subdealer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_expense_items JSONB;

-- 5. Add comments for advance payment columns
-- ===================================================================
COMMENT ON COLUMN welfare_requests.advance_department IS 'Department for advance payment request';
COMMENT ON COLUMN welfare_requests.advance_district IS 'District for advance payment request';
COMMENT ON COLUMN welfare_requests.advance_activity_type IS 'Type of activity (จัดประชุม, ออกบูธ, ดีลเลอร์, ซับดีลเลอร์, อื่นๆ)';
COMMENT ON COLUMN welfare_requests.advance_activity_other IS 'Other activity type specification';
COMMENT ON COLUMN welfare_requests.advance_shop_company IS 'Shop or company name';
COMMENT ON COLUMN welfare_requests.advance_amphur IS 'Amphur (district)';
COMMENT ON COLUMN welfare_requests.advance_province IS 'Province';
COMMENT ON COLUMN welfare_requests.advance_event_date IS 'Event date';
COMMENT ON COLUMN welfare_requests.advance_participants IS 'Number of participants';
COMMENT ON COLUMN welfare_requests.advance_location IS 'Event location/venue';
COMMENT ON COLUMN welfare_requests.advance_dealer_name IS 'Dealer name for dealer activity type';
COMMENT ON COLUMN welfare_requests.advance_subdealer_name IS 'Sub-dealer name for sub-dealer activity type';
COMMENT ON COLUMN welfare_requests.advance_expense_items IS 'JSON array of advance payment expense items';

-- 6. Create indexes for advance payment columns
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_activity_type 
ON welfare_requests(advance_activity_type);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_department 
ON welfare_requests(advance_department);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_event_date 
ON welfare_requests(advance_event_date);

-- 7. Create a view for expense clearing with related advance requests
-- ===================================================================
CREATE OR REPLACE VIEW expense_clearing_with_advance AS
SELECT 
    ec.*,
    ar.id as original_advance_id,
    ar.amount as original_advance_amount,
    ar.created_at as original_advance_date,
    ar.advance_activity_type as original_activity_type,
    ar.advance_expense_items as original_expense_items
FROM welfare_requests ec
LEFT JOIN welfare_requests ar ON ec.original_advance_request_id = ar.id
WHERE ec.request_type = 'expense-clearing';

COMMENT ON VIEW expense_clearing_with_advance IS 'View showing expense clearing requests with their related advance payment requests';

-- 8. Create function to calculate refund amount from expense clearing items
-- ===================================================================
CREATE OR REPLACE FUNCTION calculate_expense_clearing_refund(expense_items JSONB)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    item JSONB;
    total_refund DECIMAL(10,2) := 0;
    request_amount DECIMAL(10,2);
    used_amount DECIMAL(10,2);
BEGIN
    -- Loop through each expense item
    FOR item IN SELECT * FROM jsonb_array_elements(expense_items)
    LOOP
        request_amount := COALESCE((item->>'requestAmount')::DECIMAL(10,2), 0);
        used_amount := COALESCE((item->>'usedAmount')::DECIMAL(10,2), 0);
        total_refund := total_refund + (request_amount - used_amount);
    END LOOP;
    
    RETURN total_refund;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_expense_clearing_refund IS 'Calculate total refund amount from expense clearing items JSON';

-- 9. Create trigger to auto-update amount field for expense clearing
-- ===================================================================
CREATE OR REPLACE FUNCTION update_expense_clearing_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for expense clearing requests
    IF NEW.request_type = 'expense-clearing' AND NEW.expense_clearing_items IS NOT NULL THEN
        NEW.amount := calculate_expense_clearing_refund(NEW.expense_clearing_items);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_expense_clearing_amount ON welfare_requests;
CREATE TRIGGER trigger_update_expense_clearing_amount
    BEFORE INSERT OR UPDATE ON welfare_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_clearing_amount();

-- 10. Insert sample data for testing (optional)
-- ===================================================================
-- Uncomment the following section if you want to insert sample data for testing

/*
-- Sample advance payment request
INSERT INTO welfare_requests (
    employee_id, employee_name, request_type, status, amount, 
    advance_department, advance_activity_type, advance_participants,
    advance_location, advance_amphur, advance_province,
    advance_expense_items, created_at
) VALUES (
    1, 'Test Employee', 'advance', 'approved', 50000.00,
    'Marketing', 'จัดประชุม', 100,
    'โรงแรมเซ็นทรัล', 'เมือง', 'กรุงเทพฯ',
    '[
        {"name": "ค่าอาหารและเครื่องดื่ม", "taxRate": 0, "requestAmount": 30000, "usedAmount": 0, "tax": 0, "vat": 0, "refund": 0},
        {"name": "ค่าเช่าสถานที่", "taxRate": 7, "requestAmount": 20000, "usedAmount": 0, "tax": 0, "vat": 0, "refund": 0}
    ]'::jsonb,
    NOW()
);

-- Sample expense clearing request
INSERT INTO welfare_requests (
    employee_id, employee_name, request_type, status, 
    original_advance_request_id,
    advance_department, advance_activity_type, advance_participants,
    advance_location, advance_amphur, advance_province,
    expense_clearing_items, created_at
) VALUES (
    1, 'Test Employee', 'expense-clearing', 'pending_manager',
    (SELECT id FROM welfare_requests WHERE request_type = 'advance' AND employee_id = 1 LIMIT 1),
    'Marketing', 'จัดประชุม', 100,
    'โรงแรมเซ็นทรัล', 'เมือง', 'กรุงเทพฯ',
    '[
        {"name": "ค่าอาหารและเครื่องดื่ม", "taxRate": 0, "requestAmount": 30000, "usedAmount": 28000, "tax": 0, "vat": 0, "refund": 2000},
        {"name": "ค่าเช่าสถานที่", "taxRate": 7, "requestAmount": 20000, "usedAmount": 22000, "tax": 1540, "vat": 0, "refund": -2000}
    ]'::jsonb,
    NOW()
);
*/

-- 11. Create useful queries for reporting
-- ===================================================================

-- Query to get expense clearing summary
CREATE OR REPLACE VIEW expense_clearing_summary AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN amount > 0 THEN 1 END) as refund_requests,
    COUNT(CASE WHEN amount < 0 THEN 1 END) as overspent_requests,
    COUNT(CASE WHEN amount = 0 THEN 1 END) as exact_requests,
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_refunds,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_overspent,
    AVG(amount) as average_amount
FROM welfare_requests 
WHERE request_type = 'expense-clearing'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

COMMENT ON VIEW expense_clearing_summary IS 'Monthly summary of expense clearing requests';

-- 12. Grant necessary permissions (adjust as needed for your setup)
-- ===================================================================
-- GRANT SELECT, INSERT, UPDATE ON welfare_requests TO your_app_user;
-- GRANT SELECT ON expense_clearing_with_advance TO your_app_user;
-- GRANT SELECT ON expense_clearing_summary TO your_app_user;
-- GRANT EXECUTE ON FUNCTION calculate_expense_clearing_refund TO your_app_user;

-- 13. Validation queries to check the setup
-- ===================================================================

-- Check if all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
AND column_name IN (
    'original_advance_request_id', 
    'expense_clearing_items',
    'advance_department',
    'advance_activity_type',
    'advance_expense_items'
)
ORDER BY column_name;

-- Check if indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'welfare_requests' 
AND indexname LIKE '%expense%' OR indexname LIKE '%advance%';

-- Check if constraint exists
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'welfare_requests_request_type_check';

-- Check if views exist
SELECT viewname, definition 
FROM pg_views 
WHERE viewname IN ('expense_clearing_with_advance', 'expense_clearing_summary');

-- Check if functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('calculate_expense_clearing_refund', 'update_expense_clearing_amount');

-- ===================================================================
-- END OF MIGRATION
-- ===================================================================

-- Summary of what this migration adds:
-- 1. expense_clearing_items JSONB column for storing expense details
-- 2. original_advance_request_id for linking to original advance requests
-- 3. All necessary advance payment columns (if not already exist)
-- 4. Proper indexes for performance
-- 5. Updated constraints to allow 'expense-clearing' request type
-- 6. Useful views for reporting and analysis
-- 7. Functions for automatic calculation
-- 8. Triggers for auto-updating amounts
-- 9. Sample data (commented out)
-- 10. Validation queries to verify setup

COMMIT;