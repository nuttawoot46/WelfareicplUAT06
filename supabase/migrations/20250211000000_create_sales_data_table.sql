-- Create sales_data table
CREATE TABLE IF NOT EXISTS public.sales_data (
  id SERIAL PRIMARY KEY,
  department VARCHAR(10) NOT NULL,
  code VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  position VARCHAR(10) NOT NULL,
  manager_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_data_department ON public.sales_data(department);
CREATE INDEX IF NOT EXISTS idx_sales_data_code ON public.sales_data(code);
CREATE INDEX IF NOT EXISTS idx_sales_data_name ON public.sales_data(name);
CREATE INDEX IF NOT EXISTS idx_sales_data_manager ON public.sales_data(manager_name);

-- Enable RLS
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read sales_data
CREATE POLICY "Allow authenticated users to read sales_data"
  ON public.sales_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow service role to manage sales_data
CREATE POLICY "Allow service role to manage sales_data"
  ON public.sales_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.sales_data IS 'Sales team data including department codes and employee assignments';
