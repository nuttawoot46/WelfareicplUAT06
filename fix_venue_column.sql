-- เพิ่ม column advance_location สำหรับเก็บข้อมูลสถานที่
-- และตรวจสอบ column ที่เกี่ยวข้อง

-- ตรวจสอบ column ที่มีอยู่
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
AND column_name IN ('venue', 'advance_location', 'advance_amphur');

-- เพิ่ม column advance_location ถ้ายังไม่มี
ALTER TABLE public.welfare_requests 
ADD COLUMN IF NOT EXISTS advance_location TEXT;

-- เพิ่ม comment สำหรับ column advance_location
COMMENT ON COLUMN public.welfare_requests.advance_location IS 'สถานที่จัดกิจกรรม (เบิกเงินล่วงหน้า)';

-- ตรวจสอบผลลัพธ์
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
AND column_name IN ('venue', 'advance_location', 'advance_amphur')
ORDER BY column_name;