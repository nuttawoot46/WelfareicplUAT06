-- Add all advance payment columns to welfare_requests table
-- This includes all fields used in AdvancePDFGenerator and advancePdfManager

ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department TEXT,
ADD COLUMN IF NOT EXISTS advance_district TEXT,
ADD COLUMN IF NOT EXISTS advance_activity_type TEXT CHECK (advance_activity_type IN ('project', 'meeting', 'training', 'other')),
ADD COLUMN IF NOT EXISTS advance_activity_other TEXT,
ADD COLUMN IF NOT EXISTS advance_shop_company TEXT,
ADD COLUMN IF NOT EXISTS advance_amphur TEXT,
ADD COLUMN IF NOT EXISTS advance_province TEXT,
ADD COLUMN IF NOT EXISTS advance_travel_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_work_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_total_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS advance_daily_rate DECIMAL(10,2) DEFAULT 80.00,
ADD COLUMN IF NOT EXISTS advance_accommodation_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS advance_transportation_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS advance_meal_allowance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS advance_other_expenses DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS advance_project_name TEXT,
ADD COLUMN IF NOT EXISTS advance_project_location TEXT,
ADD COLUMN IF NOT EXISTS advance_expected_return_date DATE,
ADD COLUMN IF NOT EXISTS advance_urgency_level TEXT CHECK (advance_urgency_level IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS advance_approval_deadline DATE,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;

-- Add signature and approval tracking columns
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS user_signature TEXT,
ADD COLUMN IF NOT EXISTS manager_signature TEXT,
ADD COLUMN IF NOT EXISTS hr_signature TEXT,
ADD COLUMN IF NOT EXISTS accounting_signature TEXT,
ADD COLUMN IF NOT EXISTS manager_approver_name TEXT,
ADD COLUMN IF NOT EXISTS hr_approver_name TEXT,
ADD COLUMN IF NOT EXISTS accounting_approver_name TEXT,
ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accounting_approved_at TIMESTAMP WITH TIME ZONE;

-- Add PDF storage columns for different approval stages
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS pdf_base64 TEXT,
ADD COLUMN IF NOT EXISTS pdf_request_manager TEXT,
ADD COLUMN IF NOT EXISTS pdf_request_hr TEXT,
ADD COLUMN IF NOT EXISTS pdf_request_accounting TEXT;

-- Add employee tracking columns
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS employee_id INTEGER,
ADD COLUMN IF NOT EXISTS employee_name TEXT,
ADD COLUMN IF NOT EXISTS department_user TEXT,
ADD COLUMN IF NOT EXISTS department_request TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_activity_type ON welfare_requests(advance_activity_type);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_urgency ON welfare_requests(advance_urgency_level);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_employee_id ON welfare_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_manager_approved ON welfare_requests(manager_approved_at);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_hr_approved ON welfare_requests(hr_approved_at);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_accounting_approved ON welfare_requests(accounting_approved_at);

-- Add foreign key constraint for employee_id if Employee table exists
-- ALTER TABLE welfare_requests 
-- ADD CONSTRAINT fk_welfare_requests_employee 
-- FOREIGN KEY (employee_id) REFERENCES "Employee"(id);

-- Add comments for documentation
COMMENT ON COLUMN welfare_requests.advance_department IS 'Department for advance payment request';
COMMENT ON COLUMN welfare_requests.advance_district IS 'District where activity will take place';
COMMENT ON COLUMN welfare_requests.advance_activity_type IS 'Type of activity: project, meeting, training, other';
COMMENT ON COLUMN welfare_requests.advance_activity_other IS 'Description when activity type is other';
COMMENT ON COLUMN welfare_requests.advance_daily_rate IS 'Daily allowance rate in THB';
COMMENT ON COLUMN welfare_requests.advance_total_days IS 'Total number of days for the activity';
COMMENT ON COLUMN welfare_requests.advance_accommodation_cost IS 'Accommodation cost in THB';
COMMENT ON COLUMN welfare_requests.advance_transportation_cost IS 'Transportation cost in THB';
COMMENT ON COLUMN welfare_requests.advance_meal_allowance IS 'Meal allowance in THB';
COMMENT ON COLUMN welfare_requests.advance_other_expenses IS 'Other expenses in THB';
COMMENT ON COLUMN welfare_requests.advance_expected_return_date IS 'Expected date to return the advance payment';
COMMENT ON COLUMN welfare_requests.advance_urgency_level IS 'Urgency level: low, medium, high, urgent';
COMMENT ON COLUMN welfare_requests.pdf_base64 IS 'Base64 encoded PDF for initial request';
COMMENT ON COLUMN welfare_requests.pdf_request_manager IS 'PDF URL after manager approval';
COMMENT ON COLUMN welfare_requests.pdf_request_hr IS 'PDF URL after HR approval';
COMMENT ON COLUMN welfare_requests.pdf_request_accounting IS 'PDF URL after accounting approval';