-- Fix RLS policy for special approval with correct column references
-- This migration fixes the user_id column reference issue

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Users can view their own requests and managers can view their team's requests" ON welfare_requests;

-- Create a corrected policy that properly references the employee_id column
CREATE POLICY "Users can view their own requests and managers can view their team's requests" ON welfare_requests
FOR SELECT USING (
  -- Users can see their own requests (match by employee_id to Employee table)
  employee_id IN (
    SELECT id FROM "Employee" WHERE "email_user" = auth.email()
  ) OR
  -- Managers can see their team's requests
  auth.email() IN (
    SELECT "Email.Manager" FROM "Employee" 
    WHERE id = employee_id
  ) OR
  -- Special approver (kanin.s) can view all requests
  auth.email() = 'kanin.s@icpladda.com' OR
  -- Admin role can view all requests
  EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" = 2 -- Admin role
  ) OR
  -- HR, Admin, SuperAdmin roles can view all requests
  EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" IN (2, 3, 4) -- HR=3, Admin=2, SuperAdmin=4
  )
);

-- Also create policies for INSERT, UPDATE, DELETE operations
CREATE POLICY "Users can insert their own requests" ON welfare_requests
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT id FROM "Employee" WHERE "email_user" = auth.email()
  )
);

CREATE POLICY "Users and approvers can update requests" ON welfare_requests
FOR UPDATE USING (
  -- Users can update their own pending requests
  (employee_id IN (
    SELECT id FROM "Employee" WHERE "email_user" = auth.email()
  ) AND status IN ('pending_manager', 'rejected_manager', 'rejected_hr', 'rejected_accounting', 'rejected_special_approval')) OR
  -- Managers can update requests they need to approve
  (auth.email() IN (
    SELECT "Email.Manager" FROM "Employee" WHERE id = employee_id
  ) AND status = 'pending_manager') OR
  -- HR can update requests in HR approval stage
  (EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" IN (2, 3) -- Admin or HR
  ) AND status = 'pending_hr') OR
  -- Special approver can update special approval requests
  ((auth.email() = 'kanin.s@icpladda.com' OR EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" = 2 -- Admin
  )) AND status = 'pending_special_approval') OR
  -- Accounting can update requests in accounting stage
  (EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = auth.email() 
    AND "Role" IN (2, 4) -- Admin or SuperAdmin (accounting roles)
  ) AND status = 'pending_accounting')
);

-- Add comment for documentation
COMMENT ON POLICY "Users can view their own requests and managers can view their team's requests" ON welfare_requests 
IS 'Updated RLS policy that correctly handles employee_id references and includes special approval access for kanin.s@icpladda.com and Admin role';