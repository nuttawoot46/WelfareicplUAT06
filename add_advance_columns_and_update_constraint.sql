-- Add advance payment columns to welfare_requests table
ALTER TABLE public.welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department text,
ADD COLUMN IF NOT EXISTS advance_district text,
ADD COLUMN IF NOT EXISTS advance_activity_type text,
ADD COLUMN IF NOT EXISTS advance_activity_other text,
ADD COLUMN IF NOT EXISTS advance_shop_company text,
ADD COLUMN IF NOT EXISTS advance_amphur text,
ADD COLUMN IF NOT EXISTS advance_province text,
ADD COLUMN IF NOT EXISTS advance_event_date date,
ADD COLUMN IF NOT EXISTS advance_participants integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_daily_rate numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_accommodation_cost numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_transportation_cost numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_meal_allowance numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_other_expenses numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_project_name text,
ADD COLUMN IF NOT EXISTS advance_project_location text;

-- Update the constraint to include 'advance' type
ALTER TABLE public.welfare_requests 
DROP CONSTRAINT IF EXISTS welfare_requests_request_type_check;

ALTER TABLE public.welfare_requests 
ADD CONSTRAINT welfare_requests_request_type_check 
CHECK ((request_type = ANY (ARRAY[
    'wedding'::text,
    'training'::text,
    'childbirth'::text,
    'funeral'::text,
    'glasses'::text,
    'dental'::text,
    'fitness'::text,
    'medical'::text,
    'internal_training'::text,
    'advance'::text
])));

-- Add indexes for advance columns for better performance
CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_department 
ON public.welfare_requests USING btree (advance_department);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_event_date 
ON public.welfare_requests USING btree (advance_event_date);

-- Add PDF URL column if not exists (for storing generated PDFs)
ALTER TABLE public.welfare_requests 
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create index for PDF URL
CREATE INDEX IF NOT EXISTS idx_welfare_requests_pdf_url 
ON public.welfare_requests USING btree (pdf_url);