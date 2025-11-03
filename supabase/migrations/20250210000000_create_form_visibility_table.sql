-- Create form_visibility table
CREATE TABLE IF NOT EXISTS form_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type TEXT NOT NULL UNIQUE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE form_visibility ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read form visibility
CREATE POLICY "Anyone can read form visibility"
  ON form_visibility
  FOR SELECT
  USING (true);

-- Policy: Only admins can update form visibility
CREATE POLICY "Only admins can update form visibility"
  ON form_visibility
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin')
    )
  );

-- Insert default form visibility settings
INSERT INTO form_visibility (form_type, is_visible) VALUES
  -- Welfare forms
  ('training', true),
  ('glasses', true),
  ('dental', true),
  ('fitness', true),
  ('medical', true),
  ('wedding', true),
  ('childbirth', true),
  ('funeral', true),
  ('internal_training', true),
  ('employment-approval', true),
  -- Accounting forms
  ('advance', true),
  ('general-advance', true),
  ('expense-clearing', true),
  ('general-expense-clearing', true)
ON CONFLICT (form_type) DO NOTHING;
