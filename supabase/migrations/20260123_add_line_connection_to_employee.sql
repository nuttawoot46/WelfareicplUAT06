-- Add LINE connection fields to Employee table
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS line_user_id TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS line_display_name TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS line_connected_at TIMESTAMPTZ;

-- Create index for quick lookup by line_user_id
CREATE INDEX IF NOT EXISTS idx_employee_line_user_id ON "Employee" (line_user_id) WHERE line_user_id IS NOT NULL;
