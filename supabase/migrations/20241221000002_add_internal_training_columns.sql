-- Add columns for internal training to existing welfare_requests table
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS participants JSONB,
ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructor_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS room_food_beverage DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_expenses DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS withholding_tax DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_cost_per_person DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_certificate_name TEXT,
ADD COLUMN IF NOT EXISTS withholding_tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS is_vat_included BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS funeral_type TEXT;

-- Add check constraint for request_type to include internal_training
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
    'internal_training'
));

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_welfare_requests_request_type ON welfare_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_branch ON welfare_requests(branch);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_venue ON welfare_requests(venue);

-- Add comments to document the new columns
COMMENT ON COLUMN welfare_requests.branch IS 'Branch location for internal training';
COMMENT ON COLUMN welfare_requests.start_time IS 'Training start time';
COMMENT ON COLUMN welfare_requests.end_time IS 'Training end time';
COMMENT ON COLUMN welfare_requests.total_hours IS 'Total training hours';
COMMENT ON COLUMN welfare_requests.venue IS 'Training venue location';
COMMENT ON COLUMN welfare_requests.participants IS 'JSON array of participant groups with team and count';
COMMENT ON COLUMN welfare_requests.total_participants IS 'Total number of training participants';
COMMENT ON COLUMN welfare_requests.instructor_fee IS 'Instructor fee amount';
COMMENT ON COLUMN welfare_requests.room_food_beverage IS 'Room, food and beverage costs';
COMMENT ON COLUMN welfare_requests.other_expenses IS 'Other miscellaneous expenses';
COMMENT ON COLUMN welfare_requests.withholding_tax IS 'Withholding tax amount (3%)';
COMMENT ON COLUMN welfare_requests.vat IS 'VAT amount (7%)';
COMMENT ON COLUMN welfare_requests.average_cost_per_person IS 'Average cost per participant';
COMMENT ON COLUMN welfare_requests.tax_certificate_name IS 'Name for tax certificate issuance';
COMMENT ON COLUMN welfare_requests.withholding_tax_amount IS 'Amount subject to withholding tax';
COMMENT ON COLUMN welfare_requests.additional_notes IS 'Additional notes for the request';
COMMENT ON COLUMN welfare_requests.is_vat_included IS 'Whether VAT and withholding tax are already included in the amount';
COMMENT ON COLUMN welfare_requests.funeral_type IS 'Type of funeral welfare (employee_spouse, child, parent)';