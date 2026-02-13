-- Add executive approval fields to welfare_requests table
-- Supports the MR → ME → Manager approval chain for sales advance/expense clearing
ALTER TABLE welfare_requests
  ADD COLUMN IF NOT EXISTS executive_id INTEGER REFERENCES "Employee"(id),
  ADD COLUMN IF NOT EXISTS executive_approver_id INTEGER,
  ADD COLUMN IF NOT EXISTS executive_approver_name TEXT,
  ADD COLUMN IF NOT EXISTS executive_approver_position TEXT,
  ADD COLUMN IF NOT EXISTS executive_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS executive_signature TEXT;
