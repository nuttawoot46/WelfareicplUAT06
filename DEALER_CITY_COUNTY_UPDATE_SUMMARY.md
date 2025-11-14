# Dealer City/County Auto-Populate Implementation Summary

## สรุปการทำงาน

เมื่อผู้ใช้เลือก Dealer จาก dropdown ระบบจะดึงข้อมูล City (อำเภอ) และ County (จังหวัด) มาใส่ในฟิลด์โดยอัตโนมัติ

## การเปลี่ยนแปลงที่ทำ

### 1. แก้ไข AdvanceForm.tsx
- เพิ่ม City และ County ใน dealer list state
- แก้ไขฟิลด์อำเภอและจังหวัดให้ใช้ `value` และ `onChange` แทน `{...register()}`
- เพิ่ม logic auto-populate เมื่อเลือก dealer
- แก้ไข duplicate key warning โดยใช้ index

### 2. SQL Scripts ที่สร้าง
- `update_all_dealer_city_county.sql` - Update 40 dealers แรก
- `update_additional_dealers.sql` - Update 10 dealers เพิ่มเติม

## สถานะปัจจุบัน

✅ โค้ดพร้อมใช้งาน - auto-populate ทำงานได้แล้ว
⚠️ ข้อมูลใน database ยังไม่ครบ - มี 100 dealers แต่ update ไปแค่ 50 รายการ

## ขั้นตอนต่อไป

1. **รัน SQL scripts ที่มีอยู่:**
   ```sql
   -- รันใน Supabase SQL Editor
   -- 1. update_all_dealer_city_county.sql (40 dealers)
   -- 2. update_additional_dealers.sql (10 dealers)
   ```

2. **ต้องการข้อมูล dealer ที่เหลืออีก 50 รายการ:**
   - ส่งข้อมูลในรูปแบบ JSON:
   ```json
   [
     {"No.": "CL000XXX", "Name": "...", "City": "...", "County": "..."}
   ]
   ```

3. **ตรวจสอบข้อมูลใน database:**
   ```sql
   SELECT "No.", "Name", "City", "County" 
   FROM public.data_dealer 
   WHERE "City" IS NULL OR "City" = ''
   ORDER BY "No.";
   ```

## ตัวอย่างการทำงาน

เมื่อเลือก dealer "บริษัท เอทีดี อะกริเทค จำกัด":
- อำเภอ: "พิมาย"
- จังหวัด: "นครราชสีมา"

จะถูกกรอกอัตโนมัติในฟิลด์

## หมายเหตุ

- Dealer ที่ยังไม่มี City/County จะไม่สามารถ auto-populate ได้
- ต้อง update ข้อมูลให้ครบทั้ง 100 รายการ
- หลังจาก update แล้วต้อง refresh หน้าเว็บ
