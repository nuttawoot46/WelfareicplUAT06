-- Update dealer data with City and County information
-- Based on the correct data provided

UPDATE public.data_dealer SET "City" = 'เมืองประจวบคีรีขันธ์', "County" = 'ประจวบคีรีขันธ์' WHERE "No." = 'CL000116';
UPDATE public.data_dealer SET "City" = 'ดอกคำใต้', "County" = 'พะเยา' WHERE "No." = 'CL000237';
UPDATE public.data_dealer SET "City" = 'ไชยปราการ', "County" = 'เชียงใหม่' WHERE "No." = 'CL000246-1';
UPDATE public.data_dealer SET "City" = 'เมืองตรัง', "County" = 'ตรัง' WHERE "No." = 'CL000536';
UPDATE public.data_dealer SET "City" = 'เมืองเชียงราย', "County" = 'เชียงราย' WHERE "No." = 'CL000670';
UPDATE public.data_dealer SET "City" = 'ร่อนพิบูลย์', "County" = 'นครศรีธรรมราช' WHERE "No." = 'CL000102-1';
UPDATE public.data_dealer SET "City" = 'สามร้อยยอด', "County" = 'ประจวบคีรีขันธ์' WHERE "No." = 'CL000157';
UPDATE public.data_dealer SET "City" = 'เมืองสุราษฎร์ธานี', "County" = 'สุราษฎร์ธานี' WHERE "No." = 'CL000166';
UPDATE public.data_dealer SET "City" = 'ฮอด', "County" = 'เชียงใหม่' WHERE "No." = 'CL000265';
UPDATE public.data_dealer SET "City" = 'บางกล่ำ', "County" = 'สงขลา' WHERE "No." = 'CL000162';

-- Verify the updates
SELECT "No.", "Name", "City", "County" 
FROM public.data_dealer 
WHERE "No." IN ('CL000116', 'CL000237', 'CL000246-1', 'CL000536', 'CL000670', 
                'CL000102-1', 'CL000157', 'CL000166', 'CL000265', 'CL000162')
ORDER BY "Name";
