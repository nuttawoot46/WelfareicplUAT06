-- Add additional columns to existing data_dealer table
-- Run this if you already created the table with only No. and Name columns

-- Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_dealer' AND column_name = 'City') THEN
        ALTER TABLE public.data_dealer ADD COLUMN "City" text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_dealer' AND column_name = 'County') THEN
        ALTER TABLE public.data_dealer ADD COLUMN "County" text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_dealer' AND column_name = 'Phone No.') THEN
        ALTER TABLE public.data_dealer ADD COLUMN "Phone No." text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_dealer' AND column_name = 'SellCoda Phone') THEN
        ALTER TABLE public.data_dealer ADD COLUMN "SellCoda Phone" text NULL;
    END IF;
END $$;

-- Update the RPC function to return all columns
CREATE OR REPLACE FUNCTION public.get_dealer_list()
RETURNS TABLE("No." text, "Name" text, "City" text, "County" text, "Phone No." text, "SellCoda Phone" text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "No.", "Name", "City", "County", "Phone No.", "SellCoda Phone"
  FROM public.data_dealer
  ORDER BY "Name" ASC NULLS LAST;
$$;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'data_dealer'
ORDER BY ordinal_position;
