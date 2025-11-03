-- Create data_dealer table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.data_dealer (
  "No." text NULL,
  "Name" text NULL
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.data_dealer ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read dealer data
CREATE POLICY "Allow authenticated users to read dealer data"
ON public.data_dealer
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow service role to manage dealer data
CREATE POLICY "Allow service role to manage dealer data"
ON public.data_dealer
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
