-- Create function to get dealer list
CREATE OR REPLACE FUNCTION public.get_dealer_list()
RETURNS TABLE("No." text, "Name" text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "No.", "Name"
  FROM public.data_dealer
  ORDER BY "Name" ASC NULLS LAST;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dealer_list() TO authenticated;
