-- Add special approval fields for Internal Training > 10,000 บาท
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS special_approver_id TEXT,
ADD COLUMN IF NOT EXISTS special_approver_name TEXT,
ADD COLUMN IF NOT EXISTS special_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_special_approval BOOLEAN DEFAULT FALSE;

-- Create index for special approval queries
CREATE INDEX IF NOT EXISTS idx_welfare_requests_special_approval 
ON welfare_requests(requires_special_approval, special_approver_id);

-- Update RLS policies to include special approval
DROP POLICY IF EXISTS "Users can view their own requests and managers can view their team's requests" ON welfare_requests;

CREATE POLICY "Users can view their own requests and managers can view their team's requests" ON welfare_requests
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM "Employee" WHERE "email_user" = auth.email()
  ) OR
  auth.email() IN (
    SELECT "Email.Manager" FROM "Employee" 
    WHERE "email_user" = (
      SELECT "email_user" FROM "Employee" WHERE id = employee_id
    )
  ) OR
  auth.email() IN ('kanin.s@icpladda.com') OR -- Special approver can view all
  EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" = 2 -- Admin role can also view special approval requests
  ) OR
  EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" IN (2, 3, 4) -- HR, Admin, SuperAdmin roles
  )
);

-- Add comment for documentation
COMMENT ON COLUMN welfare_requests.requires_special_approval IS 'Flag to indicate if request requires special approval (for Internal Training > 10,000 บาท)';
COMMENT ON COLUMN welfare_requests.special_approver_id IS 'ID of special approver (kanin.s@icpladda.com)';
COMMENT ON COLUMN welfare_requests.special_approver_name IS 'Name of special approver';
COMMENT ON COLUMN welfare_requests.special_approved_at IS 'Timestamp when special approval was granted';