-- Fix RLS policies for users table access by admin roles
-- This script ensures admin and superadmin roles can access user data

-- First, check if there are any existing policies on auth.users (this is managed by Supabase)
-- We need to focus on custom user tables or views

-- If you have a custom users table, enable RLS and create policies
-- Note: auth.users is managed by Supabase and typically doesn't need custom RLS

-- Check if there's a custom users table or view
-- If using a custom users table, create appropriate policies

-- For Employee table access (which seems to be your main user table)
-- Ensure admin users can read Employee data
DROP POLICY IF EXISTS "Allow admin users to read all employees" ON "Employee";

CREATE POLICY "Allow admin users to read all employees" ON "Employee"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Employee" e
      WHERE e."email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND LOWER(e."Role") IN ('admin', 'superadmin')
    )
  );

-- Allow admin users to update Employee records
DROP POLICY IF EXISTS "Allow admin users to update employees" ON "Employee";

CREATE POLICY "Allow admin users to update employees" ON "Employee"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Employee" e
      WHERE e."email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND LOWER(e."Role") IN ('admin', 'superadmin')
    )
  );

-- Allow admin users to insert new Employee records
DROP POLICY IF EXISTS "Allow admin users to insert employees" ON "Employee";

CREATE POLICY "Allow admin users to insert employees" ON "Employee"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Employee" e
      WHERE e."email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND LOWER(e."Role") IN ('admin', 'superadmin')
    )
  );

-- Allow users to read their own Employee record
DROP POLICY IF EXISTS "Allow users to read own employee record" ON "Employee";

CREATE POLICY "Allow users to read own employee record" ON "Employee"
  FOR SELECT TO authenticated
  USING (
    "email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow users to update their own Employee record (limited fields)
DROP POLICY IF EXISTS "Allow users to update own employee record" ON "Employee";

CREATE POLICY "Allow users to update own employee record" ON "Employee"
  FOR UPDATE TO authenticated
  USING (
    "email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON "Employee" TO authenticated;

-- If you need to access auth.users metadata, you might need to create a function
-- that runs with security definer privileges
CREATE OR REPLACE FUNCTION get_user_metadata(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admin users or the user themselves to access metadata
  IF EXISTS (
    SELECT 1 FROM "Employee" 
    WHERE "email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND LOWER("Role") IN ('admin', 'superadmin')
  ) OR auth.uid() = user_id THEN
    RETURN (SELECT raw_user_meta_data FROM auth.users WHERE id = user_id);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;