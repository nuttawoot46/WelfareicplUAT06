-- Create pdf_templates table for storing pdfme template definitions
CREATE TABLE IF NOT EXISTS pdf_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  form_type TEXT NOT NULL DEFAULT 'custom',
  template_json JSONB NOT NULL,
  sample_input JSONB,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pdf_templates_form_type ON pdf_templates(form_type);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_active ON pdf_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_created_at ON pdf_templates(created_at);

-- Enable RLS
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

-- Allow admin users to manage templates (full CRUD)
CREATE POLICY "Allow admin users to manage pdf_templates" ON pdf_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Employee"
      WHERE "Employee"."email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND LOWER("Employee"."Role") IN ('admin', 'superadmin')
    )
  );

-- Allow all authenticated users to read active templates
CREATE POLICY "Allow authenticated users to read active pdf_templates" ON pdf_templates
  FOR SELECT TO authenticated
  USING (is_active = true);
