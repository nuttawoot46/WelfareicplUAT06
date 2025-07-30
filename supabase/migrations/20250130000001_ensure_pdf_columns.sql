-- Ensure all necessary PDF and signature columns exist in welfare_requests table
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
ADD COLUMN IF NOT EXISTS manager_approver_id TEXT,
ADD COLUMN IF NOT EXISTS hr_approver_id TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN welfare_requests.pdf_url IS 'URL of the PDF file stored in Supabase Storage bucket';
COMMENT ON COLUMN welfare_requests.pdf_base64 IS 'Base64 encoded PDF data with all signatures';
COMMENT ON COLUMN welfare_requests.user_signature IS 'Base64 encoded user signature image';
COMMENT ON COLUMN welfare_requests.manager_signature IS 'Base64 encoded manager signature image';
COMMENT ON COLUMN welfare_requests.hr_signature IS 'Base64 encoded HR signature image';
COMMENT ON COLUMN welfare_requests.manager_approved_at IS 'Timestamp when manager approved the request';
COMMENT ON COLUMN welfare_requests.hr_approved_at IS 'Timestamp when HR approved the request';
COMMENT ON COLUMN welfare_requests.manager_approver_name IS 'Name of the manager who approved';
COMMENT ON COLUMN welfare_requests.hr_approver_name IS 'Name of the HR who approved';
COMMENT ON COLUMN welfare_requests.manager_approver_id IS 'ID of the manager who approved';
COMMENT ON COLUMN welfare_requests.hr_approver_id IS 'ID of the HR who approved';