-- SQL สำหรับเพิ่มคอลัมน์สำหรับเบิกเงินทดลอง
-- เพิ่ม 'advance' ใน request_type check constraint
ALTER TABLE public.welfare_requests 
DROP CONSTRAINT welfare_requests_request_type_check;

ALTER TABLE public.welfare_requests 
ADD CONSTRAINT welfare_requests_request_type_check 
CHECK (
  request_type = ANY (
    ARRAY[
      'wedding'::text,
      'training'::text,
      'childbirth'::text,
      'funeral'::text,
      'glasses'::text,
      'dental'::text,
      'fitness'::text,
      'medical'::text,
      'internal_training'::text,
      'advance'::text
    ]
  )
);

-- เพิ่มคอลัมน์สำหรับข้อมูลเบิกเงินทดลอง
ALTER TABLE public.welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department TEXT, -- แผนก
ADD COLUMN IF NOT EXISTS advance_district TEXT, -- เขต
ADD COLUMN IF NOT EXISTS advance_activity_type TEXT, -- ประเภทกิจกรรม
ADD COLUMN IF NOT EXISTS advance_activity_other TEXT, -- ระบุอื่นๆ
ADD COLUMN IF NOT EXISTS advance_shop_company TEXT, -- ชื่อร้าน/บริษัท
ADD COLUMN IF NOT EXISTS advance_amphur TEXT, -- อำเภอ
ADD COLUMN IF NOT EXISTS advance_province TEXT, -- จังหวัด
ADD COLUMN IF NOT EXISTS advance_travel_days INTEGER, -- จำนวนวันเดินทาง
ADD COLUMN IF NOT EXISTS advance_work_days INTEGER, -- จำนวนวันปฏิบัติงาน
ADD COLUMN IF NOT EXISTS advance_total_days INTEGER, -- รวมจำนวนวัน
ADD COLUMN IF NOT EXISTS advance_daily_rate NUMERIC(10,2), -- อัตราค่าใช้จ่ายรายวัน
ADD COLUMN IF NOT EXISTS advance_accommodation_cost NUMERIC(10,2), -- ค่าที่พัก
ADD COLUMN IF NOT EXISTS advance_transportation_cost NUMERIC(10,2), -- ค่าเดินทาง
ADD COLUMN IF NOT EXISTS advance_meal_allowance NUMERIC(10,2), -- เบี้ยเลี้ยง
ADD COLUMN IF NOT EXISTS advance_other_expenses NUMERIC(10,2), -- ค่าใช้จ่ายอื่นๆ
ADD COLUMN IF NOT EXISTS advance_project_name TEXT, -- ชื่อโครงการ
ADD COLUMN IF NOT EXISTS advance_project_location TEXT, -- สถานที่โครงการ
ADD COLUMN IF NOT EXISTS advance_expected_return_date DATE, -- วันที่คาดว่าจะกลับ
ADD COLUMN IF NOT EXISTS advance_urgency_level TEXT, -- ระดับความเร่งด่วน
ADD COLUMN IF NOT EXISTS advance_approval_deadline DATE; -- วันที่ต้องการอนุมัติ

-- สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_department 
ON public.welfare_requests USING btree (advance_department);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_district 
ON public.welfare_requests USING btree (advance_district);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_shop_company 
ON public.welfare_requests USING btree (advance_shop_company);

CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_province 
ON public.welfare_requests USING btree (advance_province);

COMMENT ON COLUMN public.welfare_requests.advance_department IS 'แผนกสำหรับการเบิกเงินทดลอง';
COMMENT ON COLUMN public.welfare_requests.advance_district IS 'เขตสำหรับการเบิกเงินทดลอง';
COMMENT ON COLUMN public.welfare_requests.advance_activity_type IS 'ประเภทกิจกรรม (จัดประชุม/ออกบูธ/ดีเลอร์/ซับดีลเลอร์/อื่นๆ)';
COMMENT ON COLUMN public.welfare_requests.advance_activity_other IS 'ระบุประเภทกิจกรรมอื่นๆ';
COMMENT ON COLUMN public.welfare_requests.advance_shop_company IS 'ชื่อร้านหรือบริษัท';
COMMENT ON COLUMN public.welfare_requests.advance_amphur IS 'อำเภอ';
COMMENT ON COLUMN public.welfare_requests.advance_province IS 'จังหวัด';
COMMENT ON COLUMN public.welfare_requests.advance_travel_days IS 'จำนวนวันเดินทาง';
COMMENT ON COLUMN public.welfare_requests.advance_work_days IS 'จำนวนวันปฏิบัติงาน';
COMMENT ON COLUMN public.welfare_requests.advance_total_days IS 'รวมจำนวนวัน';
COMMENT ON COLUMN public.welfare_requests.advance_daily_rate IS 'อัตราค่าใช้จ่ายรายวัน';
COMMENT ON COLUMN public.welfare_requests.advance_accommodation_cost IS 'ค่าที่พัก';
COMMENT ON COLUMN public.welfare_requests.advance_transportation_cost IS 'ค่าเดินทาง';
COMMENT ON COLUMN public.welfare_requests.advance_meal_allowance IS 'เบี้ยเลี้ยง';
COMMENT ON COLUMN public.welfare_requests.advance_other_expenses IS 'ค่าใช้จ่ายอื่นๆ';
COMMENT ON COLUMN public.welfare_requests.advance_project_name IS 'ชื่อโครงการ';
COMMENT ON COLUMN public.welfare_requests.advance_project_location IS 'สถานที่โครงการ';
COMMENT ON COLUMN public.welfare_requests.advance_expected_return_date IS 'วันที่คาดว่าจะกลับ';
COMMENT ON COLUMN public.welfare_requests.advance_urgency_level IS 'ระดับความเร่งด่วน (ปกติ/เร่งด่วน/เร่งด่วนมาก)';
COMMENT ON COLUMN public.welfare_requests.advance_approval_deadline IS 'วันที่ต้องการอนุมัติ';
