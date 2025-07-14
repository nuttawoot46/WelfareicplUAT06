-- Create welfare_settings table
CREATE TABLE IF NOT EXISTS public.welfare_settings (
  id SERIAL PRIMARY KEY,
  welfare_type TEXT NOT NULL UNIQUE,
  max_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values for each welfare type (except training)
INSERT INTO public.welfare_settings (welfare_type, max_amount)
VALUES 
  ('wedding', 3000.00),
  ('childbirth', 6000.00),
  ('funeral', 10000.00),
  ('glasses', 2000.00),
  ('dental', 2000.00),
  ('fitness', 300.00),
  ('medical', 1000.00)
ON CONFLICT (welfare_type) DO NOTHING;
