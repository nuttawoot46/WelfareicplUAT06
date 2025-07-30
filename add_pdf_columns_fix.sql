-- Add missing columns to welfare_requests table (only if they don't exist)
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS pdf_request_hr TEXT,
ADD COLUMN IF NOT EXISTS user_signature TEXT,
ADD COLUMN IF NOT EXISTS manager_signature TEXT,
ADD COLUMN IF NOT EXISTS hr_signature TEXT,
ADD COLUMN IF NOT EXISTS manager_approver_name TEXT,
ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS hr_approver_name TEXT,
ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS birth_type TEXT,
ADD COLUMN IF NOT EXISTS department_user TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Clear large base64 data from pdf_request_manager column to prevent database hanging
UPDATE welfare_requests 
SET pdf_request_manager = NULL 
WHERE LENGTH(pdf_request_manager) > 10000;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_pdf_request_manager ON welfare_requests(pdf_request_manager);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_pdf_request_hr ON welfare_requests(pdf_request_hr);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_status ON welfare_requests(status);

-- Update existing records to have updated_at if null
UPDATE welfare_requests SET updated_at = created_at WHERE updated_at IS NULL;