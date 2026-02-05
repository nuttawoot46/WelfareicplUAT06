-- Create audit_logs table for tracking all system activities
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who performed the action
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,

  -- What happened
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'welfare_request', 'leave_request', 'authentication',
    'user_management', 'system_config', 'security'
  )),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),

  -- Context details
  details TEXT,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',

  -- Client info
  ip_address TEXT,
  user_agent TEXT,

  -- Team/department for scoping queries
  department TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_category ON public.audit_logs(category);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_department ON public.audit_logs(department);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert (non-blocking writes)
CREATE POLICY "insert_audit_logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- All authenticated users can read (filtering done in application layer)
CREATE POLICY "read_audit_logs" ON public.audit_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.audit_logs TO authenticated;
