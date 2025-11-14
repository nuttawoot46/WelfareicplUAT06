-- Drop the old RPC function if exists
DROP FUNCTION IF EXISTS public.get_dealer_list();

-- Create new RPC function that includes City and County
CREATE OR REPLACE FUNCTION public.get_dealer_list()
RETURNS TABLE (
  "No." text,
  "Name" text,
  "City" text,
  "County" text,
  "Phone No." text,
  "SellCoda Phone" text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    "No.", 
    "Name", 
    "City", 
    "County",
    "Phone No.",
    "SellCoda Phone"
  FROM public.data_dealer
  ORDER BY "Name" ASC;
$$;

-- Test the function
SELECT * FROM public.get_dealer_list() LIMIT 5;
