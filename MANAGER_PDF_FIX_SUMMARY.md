# Manager PDF Approval Fix Summary

## ปัญหาที่พบ
หลังจาก manager กด approve ไม่มีการบันทึก PDF URL ไปที่ฐานข้อมูล เนื่องจาก:

1. **คอลัมน์ที่ไม่มีอยู่**: โค้ดพยายามใช้คอลัมน์ `pdf_request_manager` และ `pdf_hr` ที่ไม่มีอยู่ในฐานข้อมูล
2. **Schema ไม่ตรงกัน**: ฐานข้อมูลมีคอลัมน์ `pdf_url` และ `pdf_base64` แต่โค้ดใช้ชื่อคอลัมน์อื่น

## การแก้ไขที่ทำ

### 1. แก้ไข `src/utils/pdfManager.ts`
- เปลี่ยนจาก `pdf_request_manager` เป็น `pdf_base64`
- เปลี่ยนจาก `pdf_hr` เป็น `pdf_base64`
- อัปเดต `createInitialPDF` ให้ใช้ `pdf_base64`
- แก้ไข `downloadPDFFromDatabase` ให้ใช้คอลัมน์ที่ถูกต้อง
- แก้ไข `debugPDFColumns` ให้แสดงคอลัมน์ที่ถูกต้อง
- แก้ไข `previewPDFFromDatabase` ให้รองรับทั้ง `pdf_url` และ `pdf_base64`

### 2. สร้าง Migration File
- สร้าง `supabase/migrations/20250130000001_ensure_pdf_columns.sql`
- เพิ่มคอลัมน์ที่จำเป็นทั้งหมด: `pdf_url`, `pdf_base64`, `manager_signature`, `hr_signature`, etc.

### 3. ตรวจสอบ `src/utils/pdfUtils.ts`
- ยืนยันว่ามี `uploadPDFToManagerBucket` function อยู่แล้ว
- Function นี้จะอัปโหลด PDF ไปยัง Supabase Storage และคืนค่า URL

## วิธีการทำงานหลังแก้ไข

1. **เมื่อ Manager Approve**:
   - บันทึกลายเซ็นใน `manager_signature`
   - สร้าง PDF ใหม่พร้อมลายเซ็น manager
   - บันทึก PDF base64 ใน `pdf_base64`
   - อัปโหลด PDF ไปยัง Supabase Storage
   - บันทึก URL ใน `pdf_url`

2. **เมื่อ HR Approve**:
   - บันทึกลายเซ็นใน `hr_signature`
   - สร้าง PDF ใหม่พร้อมลายเซ็นทั้ง manager และ HR
   - อัปเดต `pdf_base64` และ `pdf_url`

## การทดสอบ
1. เปิด Docker Desktop
2. รัน `supabase start`
3. รัน `supabase db reset` เพื่อใช้ migration ใหม่
4. ทดสอบการ approve ของ manager
5. ตรวจสอบว่า `pdf_url` ถูกบันทึกในฐานข้อมูล

## คอลัมน์ที่ใช้ในฐานข้อมูล
- `pdf_url`: URL ของไฟล์ PDF ใน Supabase Storage
- `pdf_base64`: ข้อมูล PDF ในรูปแบบ base64 (backup)
- `manager_signature`: ลายเซ็น manager (base64)
- `hr_signature`: ลายเซ็น HR (base64)
- `manager_approved_at`: วันเวลาที่ manager approve
- `hr_approved_at`: วันเวลาที่ HR approve
- `manager_approver_name`: ชื่อ manager ที่ approve
- `hr_approver_name`: ชื่อ HR ที่ approve