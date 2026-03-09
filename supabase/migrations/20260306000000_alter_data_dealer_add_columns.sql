-- Add new columns to data_dealer table for SQL Server sync
-- Source: BackOfficeICPLadda.dbo.Customer table

-- Add geographic columns (used by AdvanceForm/ExpenseClearingForm for auto-fill)
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "City" text NULL;      -- อำเภอ (auto-fill advanceAmphur)
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "County" text NULL;    -- จังหวัด (auto-fill advanceProvince)

-- Add SQL Server Customer table columns
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "Company" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "ZoneCode" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "ZoneName" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "DepartmentCode" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "DepartmentName" text NULL;

-- Add contact columns (from Excel/Customer data)
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "Phone No." text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "SellCoda Phone" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "Email" text NULL;

-- Add unique constraint on "No." for N8n upsert operations
-- First handle possible duplicates by keeping the first occurrence
DO $$
BEGIN
  -- Only add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_dealer_no_unique'
  ) THEN
    ALTER TABLE public.data_dealer ADD CONSTRAINT data_dealer_no_unique UNIQUE ("No.");
  END IF;
END $$;

-- Drop existing functions first (cannot change return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.get_dealer_list();
DROP FUNCTION IF EXISTS public.get_dealer_list(text);

-- Recreate with zone_code filter parameter
-- When zone_code is NULL or empty, returns all dealers
-- When zone_code is provided, filters by ZoneCode matching employee's sales_zone
CREATE FUNCTION public.get_dealer_list(p_zone_code text DEFAULT NULL)
RETURNS TABLE("No." text, "Name" text, "City" text, "County" text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "No.", "Name", "City", "County"
  FROM public.data_dealer
  WHERE (p_zone_code IS NULL OR p_zone_code = '' OR "ZoneCode" = p_zone_code)
  ORDER BY "Name" ASC NULLS LAST;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dealer_list(text) TO authenticated;
