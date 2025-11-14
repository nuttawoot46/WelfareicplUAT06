-- Add bank account fields to welfare_requests table
-- Migration: Add bank account information fields for general advance requests
-- Date: 2025-02-11

-- Add bank account columns to welfare_requests table
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN welfare_requests.bank_account_name IS 'ชื่อบัญชีธนาคารสำหรับโอนเงิน';
COMMENT ON COLUMN welfare_requests.bank_name IS 'ชื่อธนาคาร';
COMMENT ON COLUMN welfare_requests.bank_account_number IS 'เลขที่บัญชีธนาคาร';

-- Create index for faster queries on bank account number (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_welfare_requests_bank_account_number 
ON welfare_requests(bank_account_number);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'welfare_requests'
AND column_name IN ('bank_account_name', 'bank_name', 'bank_account_number')
ORDER BY column_name;
