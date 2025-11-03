-- ตรวจสอบ Role ของ user ปัจจุบัน
SELECT 
  "Employee"."Name",
  "Employee"."Role",
  "Employee".auth_uid,
  "Employee".email_user
FROM public."Employee"
WHERE "Employee".auth_uid = auth.uid()::text;

-- ตรวจสอบว่า auth.uid() คืออะไร
SELECT auth.uid() as current_auth_uid;

-- ตรวจสอบข้อมูลใน form_visibility table
SELECT * FROM form_visibility ORDER BY form_type;
