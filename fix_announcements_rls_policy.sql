-- Fix RLS policy for announcements table
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow admin users to manage announcements" ON announcements;

-- Create corrected policy
CREATE POLICY "Allow admin users to manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Employee" 
      WHERE "Employee"."email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND LOWER("Employee"."Role") IN ('admin', 'superadmin')
    )
  );