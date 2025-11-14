-- Update additional dealer data with City and County information
-- Part 2: Additional 10 dealers

UPDATE public.data_dealer SET "City" = 'พิมาย', "County" = 'นครราชสีมา' WHERE "No." = 'CL000665';
UPDATE public.data_dealer SET "City" = 'ชุมพลบุรี', "County" = 'สุรินทร์' WHERE "No." = 'CL000664';
UPDATE public.data_dealer SET "City" = 'ปราสาท', "County" = 'สุรินทร์' WHERE "No." = 'CL000657';
UPDATE public.data_dealer SET "City" = 'คง', "County" = 'นครราชสีมา' WHERE "No." = 'CL000648';
UPDATE public.data_dealer SET "City" = 'ด่านซ้าย', "County" = 'เลย' WHERE "No." = 'CL000640';
UPDATE public.data_dealer SET "City" = 'สว่างแดนดิน', "County" = 'สกลนคร' WHERE "No." = 'CL000636';
UPDATE public.data_dealer SET "City" = 'มัญจาคีรี', "County" = 'ขอนแก่น' WHERE "No." = 'CL000619';
UPDATE public.data_dealer SET "City" = 'เทพสถิต', "County" = 'ชัยภูมิ' WHERE "No." = 'CL000618';
UPDATE public.data_dealer SET "City" = 'น้ำยืน', "County" = 'อุบลราชธานี' WHERE "No." = 'CL000602';
UPDATE public.data_dealer SET "City" = 'กุมภวาปี', "County" = 'อุดรธานี' WHERE "No." = 'CL000575';

-- Verify the updates
SELECT "No.", "Name", "City", "County" 
FROM public.data_dealer 
WHERE "No." IN ('CL000665', 'CL000664', 'CL000657', 'CL000648', 'CL000640', 
                'CL000636', 'CL000619', 'CL000618', 'CL000602', 'CL000575')
ORDER BY "Name";
