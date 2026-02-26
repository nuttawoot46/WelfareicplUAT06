-- Add accounting_checklist_done column to welfare_requests table
-- Used by accounting staff to track if approved requests have been keyed into the external accounting system
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS accounting_checklist_done BOOLEAN DEFAULT FALSE;
