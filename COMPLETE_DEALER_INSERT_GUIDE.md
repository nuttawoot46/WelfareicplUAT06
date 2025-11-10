# คำแนะนำการ INSERT ข้อมูล Dealer ครบทั้งหมด

## วิธีที่ 1: ใช้ CSV Import (แนะนำ - เร็วที่สุด)

### ขั้นตอน:
1. สร้างไฟล์ CSV จากข้อมูล Excel ที่คุณมี
2. ไปที่ Supabase Dashboard > Table Editor
3. เลือกตาราง `data_dealer`
4. คลิก "Import data from CSV"
5. Upload ไฟล์ CSV
6. Map columns ให้ตรงกัน

## วิธีที่ 2: รัน SQL Scripts ทีละส่วน

รันไฟล์ตามลำดับ:
1. `add_dealer_columns.sql` - เพิ่ม columns
2. `insert_all_dealers_part1.sql` - Records 1-50
3. `insert_all_dealers_part2.sql` - Records 51-100
4. สร้าง part 3, 4, 5 ต่อไปตามข้อมูลที่เหลือ

## วิธีที่ 3: ใช้ Script Generator

ใช้ Python หรือ Excel Formula สร้าง SQL:

### Excel Formula:
```excel
="('"&A2&"', '"&B2&"', '"&C2&"', '"&D2&"', '"&E2&"', '"&F2&"'),"
```

วางใน column G แล้ว drag ลงไปทุกแถว จะได้:
```sql
('CL000670', 'บริษัท ชวลิตกิจเกษตรเชียงราย จำกัด', 'เมืองเชียงราย', 'เชียงราย', '0629463354,0615545945', '0615545945'),
```

จากนั้นนำมารวมกันเป็น:
```sql
INSERT INTO public.data_dealer ("No.", "Name", "City", "County", "Phone No.", "SellCoda Phone") VALUES
-- วาง values ทั้งหมดที่นี่
;
```

## วิธีที่ 4: ใช้ Supabase Client Library

```javascript
const { data, error } = await supabase
  .from('data_dealer')
  .insert([
    { "No.": "CL000670", "Name": "บริษัท...", "City": "เมืองเชียงราย", ... },
    // ... ข้อมูลทั้งหมด
  ]);
```

## ตัวอย่าง SQL Template

```sql
TRUNCATE TABLE public.data_dealer;

INSERT INTO public.data_dealer ("No.", "Name", "City", "County", "Phone No.", "SellCoda Phone") VALUES
('CL000670', 'บริษัท ชวลิตกิจเกษตรเชียงราย จำกัด', 'เมืองเชียงราย', 'เชียงราย', '0629463354,0615545945', '0615545945'),
-- เพิ่มข้อมูลทั้งหมด 213 รายการที่นี่
('CL000649', 'บริษัท เวนดิ้ง พลัส จำกัด', 'บางขุนเทียน', 'กรุงเทพมหานคร', NULL, NULL);

-- Verify
SELECT COUNT(*) FROM public.data_dealer; -- ควรได้ 213
```

## หมายเหตุ

- ข้อมูลทั้งหมดมี 213 รายการ
- บาง records อาจมี Phone No. หรือ SellCoda Phone เป็น NULL
- แนะนำให้ใช้ CSV Import เพราะจะเร็วและง่ายที่สุด
- ถ้าต้องการ SQL script ครบทั้งหมด สามารถใช้ Excel Formula สร้างได้

## ตรวจสอบหลัง INSERT

```sql
-- นับจำนวน
SELECT COUNT(*) as total FROM public.data_dealer;

-- ดูตัวอย่าง
SELECT * FROM public.data_dealer LIMIT 10;

-- ตรวจสอบ NULL values
SELECT COUNT(*) as null_phone 
FROM public.data_dealer 
WHERE "Phone No." IS NULL;

-- ทดสอบ RPC function
SELECT * FROM get_dealer_list() LIMIT 5;
```
