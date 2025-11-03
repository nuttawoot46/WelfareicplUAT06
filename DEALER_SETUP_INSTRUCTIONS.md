# คำแนะนำการติดตั้ง Dealer Dropdown

## ⚠️ สิ่งที่ต้องทำก่อน

### 1. รัน Migration ใน Supabase SQL Editor

1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. คัดลอกโค้ดจากไฟล์ `run_dealer_migrations.sql`
4. วางและกด Run

หรือรันคำสั่งนี้:

```sql
-- Create table
CREATE TABLE IF NOT EXISTS public.data_dealer (
  "No." text NULL,
  "Name" text NULL
);

-- Enable RLS
ALTER TABLE public.data_dealer ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read dealer data"
ON public.data_dealer FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role to manage dealer data"
ON public.data_dealer FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create RPC function
CREATE OR REPLACE FUNCTION public.get_dealer_list()
RETURNS TABLE("No." text, "Name" text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT "No.", "Name"
  FROM public.data_dealer
  ORDER BY "Name" ASC NULLS LAST;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_dealer_list() TO authenticated;
```

### 2. เพิ่มข้อมูล Dealer

หลังจากสร้างตารางแล้ว ให้เพิ่มข้อมูล dealer:

```sql
INSERT INTO public.data_dealer ("No.", "Name") VALUES
('001', 'ดีลเลอร์ A'),
('002', 'ดีลเลอร์ B'),
('003', 'ดีลเลอร์ C');
```

### 3. ตรวจสอบการติดตั้ง

```sql
-- ตรวจสอบว่ามีข้อมูลหรือไม่
SELECT * FROM public.data_dealer;

-- ทดสอบ RPC function
SELECT * FROM get_dealer_list();
```

## การทำงานของระบบ

1. **ถ้ารัน migration แล้ว**: จะใช้ RPC function `get_dealer_list()` ดึงข้อมูล
2. **ถ้ายังไม่รัน migration**: จะพยายามดึงข้อมูลโดยตรงจากตาราง
3. **ถ้าไม่มีตาราง**: dropdown จะว่างเปล่า (แสดงเฉพาะ "ไม่ระบุ")

## Console Logs

เมื่อโหลดฟอร์ม คุณจะเห็น log ดังนี้:

- `🔍 Fetching dealer list...` - เริ่มดึงข้อมูล
- `✅ Dealer list loaded via RPC: X dealers` - สำเร็จผ่าน RPC
- `⚠️ RPC function not available, trying direct query` - RPC ไม่พร้อม ลองดึงตรง
- `✅ Dealer list loaded via direct query: X dealers` - สำเร็จผ่านการดึงตรง
- `⚠️ Dealer table not available` - ยังไม่มีตาราง

## การแก้ปัญหา

### ปัญหา: 404 Not Found
- **สาเหตุ**: ยังไม่ได้รัน migration
- **วิธีแก้**: รันคำสั่ง SQL ข้างต้นใน Supabase SQL Editor

### ปัญหา: Dropdown ว่างเปล่า
- **สาเหตุ**: ไม่มีข้อมูลในตาราง
- **วิธีแก้**: INSERT ข้อมูล dealer ตามตัวอย่างข้างต้น

### ปัญหา: Permission Denied
- **สาเหตุ**: RLS policies ไม่ถูกต้อง
- **วิธีแก้**: ตรวจสอบว่ารัน CREATE POLICY ครบทั้ง 2 policies
