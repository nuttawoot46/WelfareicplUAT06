-- Migration script: ย้ายข้อมูลจาก venue ไปยัง advance_location
-- สำหรับ advance payment requests ที่มีอยู่แล้ว

-- 1. ตรวจสอบข้อมูลก่อน migrate
SELECT 
    'Before Migration' as status,
    COUNT(*) as total_advance_requests,
    COUNT(venue) as has_venue_data,
    COUNT(advance_location) as has_advance_location_data
FROM welfare_requests 
WHERE type = 'advance';

-- 2. ย้ายข้อมูลจาก venue ไปยัง advance_location สำหรับ advance requests
UPDATE welfare_requests 
SET advance_location = venue
WHERE type = 'advance' 
AND venue IS NOT NULL 
AND venue != ''
AND (advance_location IS NULL OR advance_location = '');

-- 3. ตรวจสอบผลลัพธ์หลัง migrate
SELECT 
    'After Migration' as status,
    COUNT(*) as total_advance_requests,
    COUNT(venue) as has_venue_data,
    COUNT(advance_location) as has_advance_location_data
FROM welfare_requests 
WHERE type = 'advance';

-- 4. แสดงตัวอย่างข้อมูลที่ถูก migrate
SELECT 
    id,
    type,
    user_name,
    venue,
    advance_location,
    advance_amphur,
    advance_province,
    created_at
FROM welfare_requests 
WHERE type = 'advance' 
AND advance_location IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 5. ตรวจสอบข้อมูลที่อาจจะมีปัญหา
SELECT 
    'Data Check' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN venue IS NOT NULL AND advance_location IS NULL THEN 1 END) as venue_not_migrated,
    COUNT(CASE WHEN venue != advance_location AND venue IS NOT NULL AND advance_location IS NOT NULL THEN 1 END) as data_mismatch
FROM welfare_requests 
WHERE type = 'advance';