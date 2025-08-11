-- Add PDF and signature columns to welfare_requests table
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_base64 TEXT,
ADD COLUMN IF NOT EXISTS user_signature TEXT,
ADD COLUMN IF NOT EXISTS manager_signature TEXT,
ADD COLUMN IF NOT EXISTS hr_signature TEXT,
ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS manager_approver_name TEXT,
ADD COLUMN IF NOT EXISTS hr_approver_name TEXT,
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_department TEXT,
ADD COLUMN IF NOT EXISTS welfare_type TEXT,
ADD COLUMN IF NOT EXISTS birth_type TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN welfare_requests.pdf_url IS 'URL of the PDF file stored in Supabase bucket';
COMMENT ON COLUMN welfare_requests.pdf_base64 IS 'Base64 encoded PDF data (backup storage)';
COMMENT ON COLUMN welfare_requests.user_signature IS 'Base64 encoded user signature image';
COMMENT ON COLUMN welfare_requests.manager_signature IS 'Base64 encoded manager signature image';
COMMENT ON COLUMN welfare_requests.hr_signature IS 'Base64 encoded HR signature image';
COMMENT ON COLUMN welfare_requests.manager_approved_at IS 'Timestamp when manager approved the request';
COMMENT ON COLUMN welfare_requests.hr_approved_at IS 'Timestamp when HR approved the request';
COMMENT ON COLUMN welfare_requests.manager_approver_name IS 'Name of the manager who approved';
COMMENT ON COLUMN welfare_requests.hr_approver_name IS 'Name of the HR who approved';
COMMENT ON COLUMN welfare_requests.user_id IS 'User ID (email) who submitted the request';
COMMENT ON COLUMN welfare_requests.user_name IS 'Name of the user who submitted the request';
COMMENT ON COLUMN welfare_requests.user_department IS 'Department of the user who submitted the request';
COMMENT ON COLUMN welfare_requests.welfare_type IS 'Type of welfare request (wedding, childbirth, etc.)';
COMMENT ON COLUMN welfare_requests.birth_type IS 'Type of birth (normal, cesarean) for childbirth welfare';