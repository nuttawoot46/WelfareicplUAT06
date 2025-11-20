-- Add employment approval specific fields to welfare_requests table

-- Add hiring reason and related fields
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS hiring_reason TEXT,
ADD COLUMN IF NOT EXISTS new_position_reason TEXT,
ADD COLUMN IF NOT EXISTS replacement_departure_date DATE,
ADD COLUMN IF NOT EXISTS temporary_duration_years INTEGER,
ADD COLUMN IF NOT EXISTS temporary_duration_months INTEGER;

-- Add employment approval base fields (if they don't exist)
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS employment_type TEXT,
ADD COLUMN IF NOT EXISTS position_title TEXT,
ADD COLUMN IF NOT EXISTS department_requesting TEXT,
ADD COLUMN IF NOT EXISTS reporting_to TEXT,
ADD COLUMN IF NOT EXISTS employment_start_date DATE,
ADD COLUMN IF NOT EXISTS employment_end_date DATE,
ADD COLUMN IF NOT EXISTS replacement_for TEXT,
ADD COLUMN IF NOT EXISTS contract_type TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT,
ADD COLUMN IF NOT EXISTS number_of_positions INTEGER;

-- Add other employment-related fields from the interface
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS minimum_education TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS experience_field TEXT,
ADD COLUMN IF NOT EXISTS minimum_experience TEXT,
ADD COLUMN IF NOT EXISTS other_skills TEXT;

-- Update request_type constraint to include 'employment-approval'
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
    'advance',
    'general-advance',
    'expense-clearing',
    'general-expense-clearing',
    'employment-approval'
));

-- Add comments for documentation
COMMENT ON COLUMN welfare_requests.hiring_reason IS 'Type of hiring: replacement, new-position, or temporary';
COMMENT ON COLUMN welfare_requests.new_position_reason IS 'Reason for requesting new position (for new-position type)';
COMMENT ON COLUMN welfare_requests.replacement_departure_date IS 'Departure date of employee being replaced';
COMMENT ON COLUMN welfare_requests.temporary_duration_years IS 'Duration in years for temporary position';
COMMENT ON COLUMN welfare_requests.temporary_duration_months IS 'Duration in months for temporary position';
COMMENT ON COLUMN welfare_requests.employment_type IS 'Employment type: new-hire, replacement, temporary, contract-extension';
COMMENT ON COLUMN welfare_requests.position_title IS 'Job position title being requested';
COMMENT ON COLUMN welfare_requests.department_requesting IS 'Department requesting the employment';
COMMENT ON COLUMN welfare_requests.reporting_to IS 'Direct supervisor for the position';
COMMENT ON COLUMN welfare_requests.employment_start_date IS 'Desired start date for employment';
COMMENT ON COLUMN welfare_requests.employment_end_date IS 'End date for temporary/contract employment';
COMMENT ON COLUMN welfare_requests.replacement_for IS 'Name of person being replaced';
COMMENT ON COLUMN welfare_requests.contract_type IS 'Contract type: permanent, temporary, contract, probation';
COMMENT ON COLUMN welfare_requests.work_location IS 'Work location for the position';
COMMENT ON COLUMN welfare_requests.number_of_positions IS 'Number of positions being requested';
COMMENT ON COLUMN welfare_requests.gender IS 'Gender requirement for position';
COMMENT ON COLUMN welfare_requests.minimum_education IS 'Minimum education requirement';
COMMENT ON COLUMN welfare_requests.major IS 'Field of study/major';
COMMENT ON COLUMN welfare_requests.experience_field IS 'Field of experience required';
COMMENT ON COLUMN welfare_requests.minimum_experience IS 'Minimum years of experience required';
COMMENT ON COLUMN welfare_requests.other_skills IS 'Other skills and competencies required';
