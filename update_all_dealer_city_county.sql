-- Update ALL dealer data with City and County information
-- This will update existing records with the correct City and County values

UPDATE public.data_dealer SET "City" = 'ดอยสะเก็ด', "County" = 'เชียงใหม่' WHERE "No." = 'CL000101';
UPDATE public.data_dealer SET "City" = 'ร่อนพิบูลย์', "County" = 'นครศรีธรรมราช' WHERE "No." = 'CL000102-1';
UPDATE public.data_dealer SET "City" = 'เชียงคำ', "County" = 'พะเยา' WHERE "No." = 'CL000107';
UPDATE public.data_dealer SET "City" = 'เหนือคลอง', "County" = 'กระบี่' WHERE "No." = 'CL000111';
UPDATE public.data_dealer SET "City" = 'เมืองสุราษฎร์ธานี', "County" = 'สุราษฎร์ธานี' WHERE "No." = 'CL000112';
UPDATE public.data_dealer SET "City" = 'เมืองประจวบคีรีขันธ์', "County" = 'ประจวบคีรีขันธ์' WHERE "No." = 'CL000116';
UPDATE public.data_dealer SET "City" = 'เมืองลำพูน', "County" = 'ลำพูน' WHERE "No." = 'CL000154-1';
UPDATE public.data_dealer SET "City" = 'สามร้อยยอด', "County" = 'ประจวบคีรีขันธ์' WHERE "No." = 'CL000157';
UPDATE public.data_dealer SET "City" = 'บางกล่ำ', "County" = 'สงขลา' WHERE "No." = 'CL000162';
UPDATE public.data_dealer SET "City" = 'เมืองสุราษฎร์ธานี', "County" = 'สุราษฎร์ธานี' WHERE "No." = 'CL000166';
UPDATE public.data_dealer SET "City" = 'หลังสวน', "County" = 'ชุมพร' WHERE "No." = 'CL000179';
UPDATE public.data_dealer SET "City" = 'ดอกคำใต้', "County" = 'พะเยา' WHERE "No." = 'CL000237';
UPDATE public.data_dealer SET "City" = 'ท่าศาลา', "County" = 'นครศรีธรรมราช' WHERE "No." = 'CL000242-3';
UPDATE public.data_dealer SET "City" = 'เกาะสมุย', "County" = 'สุราษฎร์ธานี' WHERE "No." = 'CL000245';
UPDATE public.data_dealer SET "City" = 'ไชยปราการ', "County" = 'เชียงใหม่' WHERE "No." = 'CL000246-1';
UPDATE public.data_dealer SET "City" = 'ฮอด', "County" = 'เชียงใหม่' WHERE "No." = 'CL000265';
UPDATE public.data_dealer SET "City" = 'สันทราย', "County" = 'เชียงใหม่' WHERE "No." = 'CL000385';
UPDATE public.data_dealer SET "City" = 'แม่สาย', "County" = 'เชียงราย' WHERE "No." = 'CL000438';
UPDATE public.data_dealer SET "City" = 'วังเจ้า', "County" = 'ตาก' WHERE "No." = 'CL000452';
UPDATE public.data_dealer SET "City" = 'ป่าแดด', "County" = 'เชียงราย' WHERE "No." = 'CL000521';
UPDATE public.data_dealer SET "City" = 'งาว', "County" = 'ลำปาง' WHERE "No." = 'CL000526';
UPDATE public.data_dealer SET "City" = 'บ้านโฮ่ง', "County" = 'ลำพูน' WHERE "No." = 'CL000535';
UPDATE public.data_dealer SET "City" = 'เมืองตรัง', "County" = 'ตรัง' WHERE "No." = 'CL000536';
UPDATE public.data_dealer SET "City" = 'พาน', "County" = 'เชียงราย' WHERE "No." = 'CL000537';
UPDATE public.data_dealer SET "City" = 'เวียงสระ', "County" = 'สุราษฎร์ธานี' WHERE "No." = 'CL000540';
UPDATE public.data_dealer SET "City" = 'แจ้ห่ม', "County" = 'ลำปาง' WHERE "No." = 'CL000560';
UPDATE public.data_dealer SET "City" = 'เทิง', "County" = 'เชียงราย' WHERE "No." = 'CL000570';
UPDATE public.data_dealer SET "City" = 'บางสะพาน', "County" = 'ประจวบคีรีขันธ์' WHERE "No." = 'CL000586';
UPDATE public.data_dealer SET "City" = 'เมืองพะเยา', "County" = 'พะเยา' WHERE "No." = 'CL000598';
UPDATE public.data_dealer SET "City" = 'บ้านตาก', "County" = 'ตาก' WHERE "No." = 'CL000604';
UPDATE public.data_dealer SET "City" = 'เบตง', "County" = 'ยะลา' WHERE "No." = 'CL000608';
UPDATE public.data_dealer SET "City" = 'สิชล', "County" = 'นครศรีธรรมราช' WHERE "No." = 'CL000610';
UPDATE public.data_dealer SET "City" = 'เวียงป่าเป้า', "County" = 'เชียงราย' WHERE "No." = 'CL000617';
UPDATE public.data_dealer SET "City" = 'เชียรใหญ่', "County" = 'นครศรีธรรมราช' WHERE "No." = 'CL000626';
UPDATE public.data_dealer SET "City" = 'ทับปุด', "County" = 'พังงา' WHERE "No." = 'CL000631';
UPDATE public.data_dealer SET "City" = 'แม่สาย', "County" = 'เชียงราย' WHERE "No." = 'CL000633-1';
UPDATE public.data_dealer SET "City" = 'จอมทอง', "County" = 'เชียงใหม่' WHERE "No." = 'CL000639';
UPDATE public.data_dealer SET "City" = 'นังตา บันนังสตา', "County" = 'ยะลา' WHERE "No." = 'CL000655';
UPDATE public.data_dealer SET "City" = 'เมืองเชียงราย', "County" = 'เชียงราย' WHERE "No." = 'CL000670';
UPDATE public.data_dealer SET "City" = 'ท่าชนะ', "County" = 'สุราษฎร์ธานี' WHERE "No." = 'CL000672';

-- Verify the updates - show all dealers with their City and County
SELECT "No.", "Name", "City", "County" 
FROM public.data_dealer 
ORDER BY "Name";

-- Count how many dealers have City and County values
SELECT 
  COUNT(*) as total_dealers,
  COUNT(CASE WHEN "City" IS NOT NULL AND "City" != '' THEN 1 END) as has_city,
  COUNT(CASE WHEN "County" IS NOT NULL AND "County" != '' THEN 1 END) as has_county
FROM public.data_dealer;
