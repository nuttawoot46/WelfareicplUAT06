-- ทดสอบการบันทึกและดึงข้อมูล advance_location และ advance_amphur

-- 1. ตรวจสอบ column ที่เกี่ยวข้อง
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
AND column_name IN ('venue', 'advance_location', 'advance_amphur', 'advance_province')
ORDER BY column_name;

-- 2. ตรวจสอบข้อมูลที่มีอยู่
SELECT 
    id,
    type,
    venue,
    advance_location,
    advance_amphur,
    advance_province,
    created_at
FROM welfare_requests 
WHERE type = 'advance'
ORDER BY created_at DESC
LIMIT 10;

-- 3. ทดสอบการ Insert ข้อมูล (ตัวอย่าง)
-- INSERT INTO welfare_requests (
--     user_id, 
--     type, 
--     status, 
--     amount, 
--     advance_location, 
--     advance_amphur, 
--     advance_province,
--     created_at
-- ) VALUES (
--     'test-user-id',
--     'advance',
--     'pending_manager',
--     5000.00,
--     'ห้องประชุมใหญ่ ชั้น 5',
--     'เมือง',
--     'เชียงใหม่',
--     NOW()
-- );

-- 4. ตรวจสอบข้อมูลที่มี advance_location หรือ advance_amphur เป็น null
SELECT 
    COUNT(*) as total_advance_requests,
    COUNT(advance_location) as requests_with_location,
    COUNT(advance_amphur) as requests_with_amphur,
    COUNT(*) - COUNT(advance_location) as missing_location,
    COUNT(*) - COUNT(advance_amphur) as missing_amphur
FROM welfare_requests 
WHERE type = 'advance';

-- 5. แสดงข้อมูลที่ขาด advance_location
SELECT 
    id,
    user_name,
    amount,
    advance_location,
    advance_amphur,
    advance_province,
    created_at
FROM welfare_requests 
WHERE type = 'advance' 
AND (advance_location IS NULL OR advance_location = '')
ORDER BY created_at DESC
LIMIT 5;