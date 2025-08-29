-- Fix approval timestamp columns to store both date and time
-- Current columns are 'date' type but code is sending full timestamps

-- Update manager_approved_at to timestamp with time zone
ALTER TABLE public.welfare_requests 
ALTER COLUMN manager_approved_at TYPE timestamp with time zone;

-- Update hr_approved_at to timestamp with time zone  
ALTER TABLE public.welfare_requests 
ALTER COLUMN hr_approved_at TYPE timestamp with time zone;

-- Also fix accounting_approved_at to be consistent (currently timestamp without time zone)
ALTER TABLE public.welfare_requests 
ALTER COLUMN accounting_approved_at TYPE timestamp with time zone;

-- Add indexes for better performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_welfare_requests_manager_approved_at 
ON public.welfare_requests USING btree (manager_approved_at);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_hr_approved_at 
ON public.welfare_requests USING btree (hr_approved_at);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_accounting_approved_at 
ON public.welfare_requests USING btree (accounting_approved_at);

-- Optional: Add comments to document the columns
COMMENT ON COLUMN public.welfare_requests.manager_approved_at IS 'Timestamp when manager approved the request';
COMMENT ON COLUMN public.welfare_requests.hr_approved_at IS 'Timestamp when HR approved the request';
COMMENT ON COLUMN public.welfare_requests.accounting_approved_at IS 'Timestamp when accounting approved the request';