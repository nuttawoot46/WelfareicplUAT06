-- Add advance payment specific fields to welfare_requests table
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department TEXT,
ADD COLUMN IF NOT EXISTS advance_district TEXT,
ADD COLUMN IF NOT EXISTS advance_activity_type TEXT,
ADD COLUMN IF NOT EXISTS advance_activity_other TEXT,
ADD COLUMN IF NOT EXISTS advance_shop_company TEXT,
ADD COLUMN IF NOT EXISTS advance_amphur TEXT,
ADD COLUMN IF NOT EXISTS advance_province TEXT,
ADD COLUMN IF NOT EXISTS advance_travel_days INTEGER,
ADD COLUMN IF NOT EXISTS advance_work_days INTEGER,
ADD COLUMN IF NOT EXISTS advance_total_days INTEGER,
ADD COLUMN IF NOT EXISTS advance_daily_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_accommodation_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_transportation_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_meal_allowance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_other_expenses DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_project_name TEXT,
ADD COLUMN IF NOT EXISTS advance_project_location TEXT,
ADD COLUMN IF NOT EXISTS advance_expected_return_date DATE,
ADD COLUMN IF NOT EXISTS advance_urgency_level TEXT,
ADD COLUMN IF NOT EXISTS advance_approval_deadline DATE;

-- Add accounting approval fields for the new flow (User > Manager > Accounting)
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS accounting_approver_id TEXT,
ADD COLUMN IF NOT EXISTS accounting_approver_name TEXT,
ADD COLUMN IF NOT EXISTS accounting_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accounting_notes TEXT;

-- Add status column if it doesn't exist (as TEXT for now)
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_manager';

-- Update request_type constraint to include 'advance'
ALTER TABLE welfare_requests 
DROP CONSTRAINT IF EXISTS welfare_requests_request_type_check;

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
    'advance'
));

-- Add comments for documentation
COMMENT ON COLUMN welfare_requests.advance_department IS 'Department for advance payment request';
COMMENT ON COLUMN welfare_requests.advance_district IS 'District for advance payment request';
COMMENT ON COLUMN welfare_requests.advance_activity_type IS 'Type of activity (project, meeting, training, other)';
COMMENT ON COLUMN welfare_requests.advance_activity_other IS 'Other activity description';
COMMENT ON COLUMN welfare_requests.advance_daily_rate IS 'Daily allowance rate';
COMMENT ON COLUMN welfare_requests.advance_total_days IS 'Total number of days for advance payment';
COMMENT ON COLUMN welfare_requests.accounting_approver_id IS 'ID of accounting staff who approved/rejected';
COMMENT ON COLUMN welfare_requests.accounting_approver_name IS 'Name of accounting staff who approved/rejected';
COMMENT ON COLUMN welfare_requests.accounting_approved_at IS 'Timestamp when accounting approved/rejected';
COMMENT ON COLUMN welfare_requests.accounting_notes IS 'Notes from accounting staff';