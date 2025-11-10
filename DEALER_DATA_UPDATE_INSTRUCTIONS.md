# คำแนะนำการอัพเดทข้อมูล Dealer

## ขั้นตอนการอัพเดท

### 1. เพิ่ม Columns ใหม่

รันไฟล์ `add_dealer_columns.sql` ใน Supabase SQL Editor:

```sql
-- Add new columns
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "City" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "County" text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "Phone No." text NULL;
ALTER TABLE public.data_dealer ADD COLUMN IF NOT EXISTS "SellCoda Phone" text NULL;
```

### 2. อัพเดท RPC Function

```sql
CREATE OR REPLACE FUNCTION public.get_dealer_list()
RETURNS TABLE("No." text, "Name" text, "City" text, "County" text, "Phone No." text, "SellCoda Phone" text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "No.", "Name", "City", "County", "Phone No.", "SellCoda Phone"
  FROM public.data_dealer
  ORDER BY "Name" ASC NULLS LAST;
$$;
```

### 3. INSERT ข้อมูลครบถ้วน

ใช้ไฟล์ `insert_dealer_data_complete.sql` หรือ INSERT ข้อมูลด้วยตัวเอง:

```sql
INSERT INTO public.data_dealer ("No.", "Name", "City", "County", "Phone No.", "SellCoda Phone") 
VALUES
('CL000670', 'บริษัท ชวลิตกิจเกษตรเชียงราย จำกัด', 'เมืองเชียงราย', 'เชียงราย', '0629463354,0615545945', '0615545945'),
-- ... ข้อมูลอื่นๆ
```

## วิธีการ Import ข้อมูลจาก Excel/CSV

### ขั้นตอนที่ 1: Export จาก Excel เป็น CSV
1. เปิดไฟล์ Excel ที่มีข้อมูล dealer
2. File > Save As > CSV (Comma delimited)

### ขั้นตอนที่ 2: Import ใน Supabase
1. ไปที่ Supabase Dashboard > Table Editor
2. เลือกตาราง `data_dealer`
3. คลิก "Import data from CSV"
4. เลือกไฟล์ CSV ที่ export มา
5. Map columns ให้ตรงกัน:
   - Column 1 → "No."
   - Column 2 → "Name"
   - Column 3 → "City"
   - Column 4 → "County"
   - Column 5 → "Phone No."
   - Column 6 → "SellCoda Phone"

### ขั้นตอนที่ 3: หรือใช้ SQL Script

สร้างไฟล์ SQL จากข้อมูล Excel:

```sql
TRUNCATE TABLE public.data_dealer;

INSERT INTO public.data_dealer ("No.", "Name", "City", "County", "Phone No.", "SellCoda Phone") VALUES
('CL000670', 'บริษัท ชวลิตกิจเกษตรเชียงราย จำกัด', 'เมืองเชียงราย', 'เชียงราย', '0629463354,0615545945', '0615545945'),
('CL000639', 'ร้าน เหรียญทองมิตรเกษตร', 'จอมทอง', 'เชียงใหม่', '086-6332339,053-341086', '0819922889'),
-- ... เพิ่มข้อมูลทั้งหมด 213 รายการ
;
```

## อัพเดท Frontend Code

อัพเดท TypeScript interface ใน `AdvanceForm.tsx`:

```typescript
const [dealerList, setDealerList] = useState<Array<{ 
  No: string; 
  Name: string;
  City: string;
  County: string;
  'Phone No.': string;
  'SellCoda Phone': string;
}>>([]);
```

## ตรวจสอบข้อมูล

```sql
-- ดูจำนวนรายการทั้งหมด
SELECT COUNT(*) FROM public.data_dealer;

-- ดูข้อมูลตัวอย่าง
SELECT * FROM public.data_dealer LIMIT 10;

-- ตรวจสอบ columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'data_dealer'
ORDER BY ordinal_position;

-- ทดสอบ RPC function
SELECT * FROM get_dealer_list() LIMIT 5;
```

## หมายเหตุ

- ข้อมูลทั้งหมดมี 213 รายการ
- ถ้ามีข้อมูลใน Excel อยู่แล้ว แนะนำให้ใช้วิธี Import CSV จะเร็วกว่า
- ถ้าต้องการ script SQL ครบทั้งหมด 213 รายการ ให้แจ้งเพื่อสร้างไฟล์ให้
