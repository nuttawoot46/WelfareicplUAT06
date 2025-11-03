-- Drop existing policy
DROP POLICY IF EXISTS "Only admins can update form visibility" ON form_visibility;

-- Create separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Only admins can insert form visibility"
  ON form_visibility
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can update form visibility"
  ON form_visibility
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can delete form visibility"
  ON form_visibility
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin')
    )
  );
