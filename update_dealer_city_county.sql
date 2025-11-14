-- Update dealer data with City and County information
-- Based on the sample data provided

UPDATE public.data_dealer SET "City" = 'ดอยสะเก็ด', "County" = 'เชียงใหม่' WHERE "No." = 'CL000101';

-- You need to run this for all dealers
-- Please provide the complete dealer data with City and County for all records
-- Or run the insert_dealer_data_complete.sql if it contains the full data

-- Check if the update worked
SELECT "No.", "Name", "City", "County" 
FROM public.data_dealer 
WHERE "No." = 'CL000101';
