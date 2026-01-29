-- Add allowed_roles column to form_visibility table
-- This allows admins to specify which roles can see each form

ALTER TABLE form_visibility
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN form_visibility.allowed_roles IS 'Array of role names that can see this form. Empty array means all roles can see it.';

-- Ensure employment-approval form exists
INSERT INTO form_visibility (form_type, is_visible, allowed_roles)
VALUES ('employment-approval', true, ARRAY['admin', 'manager', 'accountingandmanager']::TEXT[])
ON CONFLICT (form_type) DO UPDATE SET allowed_roles = ARRAY['admin', 'manager', 'accountingandmanager']::TEXT[];
