-- ตรวจสอบข้อมูล City และ County ในตาราง data_dealer
SELECT 
  "No.", 
  "Name", 
  "City", 
  "County",
  "Phone No."
FROM public.data_dealer 
WHERE "Name" = 'บริษัท ธีรนันการเกษตร จำกัด'
LIMIT 1;

-- ตรวจสอบข้อมูลทั้งหมดว่ามี City และ County หรือไม่
SELECT 
  COUNT(*) as total_dealers,
  COUNT("City") as has_city,
  COUNT("County") as has_county,
  COUNT(CASE WHEN "City" IS NOT NULL AND "City" != '' THEN 1 END) as has_city_value,
  COUNT(CASE WHEN "County" IS NOT NULL AND "County" != '' THEN 1 END) as has_county_value
FROM public.data_dealer;

-- แสดงตัวอย่างข้อมูล 5 รายการแรก
SELECT 
  "No.", 
  "Name", 
  "City", 
  "County"
FROM public.data_dealer 
ORDER BY "Name"
LIMIT 5;
