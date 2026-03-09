-- Add revision_completed fields to welfare_requests table
-- Tracks whether an employee has submitted additional documents after a revision request
-- revision_completed = true means the employee has re-uploaded documents

ALTER TABLE welfare_requests ADD COLUMN IF NOT EXISTS revision_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE welfare_requests ADD COLUMN IF NOT EXISTS revision_completed_at TIMESTAMPTZ;
