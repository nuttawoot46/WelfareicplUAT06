-- Add revision request fields to welfare_requests table
-- Allows approvers (Manager/HR/Accounting) to request additional documents from employees

ALTER TABLE welfare_requests ADD COLUMN IF NOT EXISTS revision_requested_by TEXT;
ALTER TABLE welfare_requests ADD COLUMN IF NOT EXISTS revision_note TEXT;
ALTER TABLE welfare_requests ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ;
