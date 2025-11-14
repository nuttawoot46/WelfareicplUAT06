-- Add bank account fields to welfare_requests table
-- Migration: Add bank account information fields for general advance requests
-- Date: 2025-02-11
-- Purpose: Store bank account details for money transfer in general advance requests

-- Add bank account columns to welfare_requests table
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN welfare_requests.bank_account_name IS 'ชื่อบัญชีธนาคารสำหรับโอนเงิน (Bank Account Name for Transfer)';
COMMENT ON COLUMN welfare_requests.bank_name IS 'ชื่อธนาคาร (Bank Name)';
COMMENT ON COLUMN welfare_requests.bank_account_number IS 'เลขที่บัญชีธนาคาร (Bank Account Number)';

-- Create index for faster queries on bank account number (optional but recommended for search/filter)
CREATE INDEX IF NOT EXISTS idx_welfare_requests_bank_account_number 
ON welfare_requests(bank_account_number);

-- Verify the columns were added successfully
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'welfare_requests'
    AND column_name IN ('bank_account_name', 'bank_name', 'bank_account_number');
    
    IF column_count = 3 THEN
        RAISE NOTICE 'Successfully added 3 bank account columns to welfare_requests table';
    ELSE
        RAISE WARNING 'Expected 3 columns but found %', column_count;
    END IF;
END $$;
