# Internal Training Tax Columns Fix Summary

## ปัญหาที่พบ
ในฟอร์ม Internal Training มีการคำนวณ VAT และภาษี ณ ที่จ่าย แยกตามหมวดหมู่:
- ค่าวิทยากร (Instructor Fee)
- ค่าห้อง อาหารและเครื่องดื่ม (Room, Food & Beverage)
- ค่าใช้จ่ายอื่นๆ (Other Expenses)

แต่ข้อมูลเหล่านี้ไม่ได้ถูกส่งไปยัง database เพราะขาด columns ที่จำเป็น

## การแก้ไข

### 1. เพิ่ม Database Columns
สร้างไฟล์ `add_internal_training_detailed_tax_columns.sql` เพื่อเพิ่ม columns:

```sql
-- ค่าวิทยากร
instructor_fee_withholding DECIMAL(10,2) DEFAULT 0
instructor_fee_vat DECIMAL(10,2) DEFAULT 0  
instructor_fee_total DECIMAL(10,2) DEFAULT 0

-- ค่าห้อง อาหารและเครื่องดื่ม
room_food_beverage_withholding DECIMAL(10,2) DEFAULT 0
room_food_beverage_vat DECIMAL(10,2) DEFAULT 0
room_food_beverage_total DECIMAL(10,2) DEFAULT 0

-- ค่าใช้จ่ายอื่นๆ
other_expenses_withholding DECIMAL(10,2) DEFAULT 0
other_expenses_vat DECIMAL(10,2) DEFAULT 0
other_expenses_total DECIMAL(10,2) DEFAULT 0
```

### 2. อัปเดต WelfareForm.tsx
- เพิ่มการส่งข้อมูล detailed tax fields ไปยัง database ในส่วน UPDATE และ CREATE
- อัปเดตการ reset ข้อมูลเมื่อ edit เพื่อรองรับ fields ใหม่
- อัปเดต internalTrainingData object เพื่อรวม fields ใหม่

### 3. การอัปเดตข้อมูลเก่า
สร้างไฟล์ `update_existing_internal_training_records.sql` เพื่ืออัปเดต records ที่มีอยู่แล้ว

## ไฟล์ที่แก้ไข
1. `add_internal_training_detailed_tax_columns.sql` - เพิ่ม database columns
2. `src/components/forms/WelfareForm.tsx` - อัปเดตการส่งข้อมูล
3. `update_existing_internal_training_records.sql` - อัปเดตข้อมูลเก่า

## วิธีการใช้งาน
1. รัน SQL script เพื่อเพิ่ม columns ใหม่:
   ```bash
   # รันไฟล์ add_internal_training_detailed_tax_columns.sql ใน database
   ```

2. รัน SQL script เพื่ออัปเดตข้อมูลเก่า (ถ้าจำเป็น):
   ```bash
   # รันไฟล์ update_existing_internal_training_records.sql ใน database
   ```

3. Deploy โค้ดใหม่ที่อัปเดตแล้ว

## ผลลัพธ์
หลังจากการแก้ไข:
- ข้อมูล VAT และภาษี ณ ที่จ่าย แยกตามหมวดหมู่จะถูกบันทึกใน database อย่างถูกต้อง
- สามารถ edit และ view ข้อมูลเหล่านี้ได้อย่างสมบูรณ์
- PDF ที่สร้างจะแสดงข้อมูลที่ถูกต้องและครบถ้วน

## การทดสอบ
1. สร้าง Internal Training request ใหม่และตรวจสอบว่าข้อมูล tax แยกหมวดหมู่ถูกบันทึกใน database
2. Edit Internal Training request ที่มีอยู่และตรวจสอบว่าข้อมูลถูกโหลดและบันทึกอย่างถูกต้อง
3. ตรวจสอบ PDF ที่สร้างว่าแสดงข้อมูลครบถ้วน