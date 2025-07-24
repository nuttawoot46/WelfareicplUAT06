-- Add pdf_request column to welfare_requests table
ALTER TABLE welfare_requests 
ADD COLUMN pdf_request TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN welfare_requests.pdf_request IS 'Base64 encoded PDF file that gets updated with signatures throughout the approval process';