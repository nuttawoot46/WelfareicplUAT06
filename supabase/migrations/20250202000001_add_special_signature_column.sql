-- Add special approver signature column for external training special approval
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS special_approver_signature TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN welfare_requests.special_approver_signature IS 'Digital signature of special approver (Deputy Managing Director) for external training > 10,000 THB';

-- Add pdf_request_special column for storing special approval PDF
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS pdf_request_special TEXT;

-- Add comment for the PDF column
COMMENT ON COLUMN welfare_requests.pdf_request_special IS 'URL to PDF with special approval signature for external training > 10,000 THB';