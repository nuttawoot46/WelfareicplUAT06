-- Add attachment_selections column to welfare_requests table
-- This column will store JSON data of document selections

ALTER TABLE welfare_requests 
ADD COLUMN attachment_selections TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN welfare_requests.attachment_selections IS 'JSON data containing user selections for document attachments (receipt, idCardCopy, bankBookCopy, etc.)';
