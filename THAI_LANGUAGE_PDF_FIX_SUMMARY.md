# การแก้ไขปัญหาภาษาไทยใน Internal Training PDF

## ปัญหาที่พบ
- PDF ที่สร้างจาก jsPDF แสดงภาษาไทยเป็นตัวอักษรแปลกๆ และไม่สามารถอ่านได้
- jsPDF ไม่รองรับฟอนต์ภาษาไทยโดยตรง
- การแสดงผลภาษาไทยใน PDF มีปัญหา encoding

## วิธีแก้ไข

### 1. สร้าง HTML-to-PDF Generator ใหม่
สร้างไฟล์ `InternalTrainingPDFGeneratorHTML.tsx` ที่ใช้วิธีการ:
- สร้าง HTML template ที่รองรับภาษาไทย
- ใช้ฟอนต์ Google Fonts (Sarabun) ที่รองรับภาษาไทยได้ดี
- ใช้ html2canvas แปลง HTML เป็น image
- ใช้ jsPDF แปลง image เป็น PDF

### 2. ติดตั้ง Dependencies
```bash
npm install html2canvas
```

### 3. อัปเดตไฟล์ที่เกี่ยวข้อง

#### `src/utils/pdfManager.ts`
- เพิ่ม import สำหรับ HTML version
- อัปเดต `createInitialPDF` ให้ใช้ HTML-to-PDF สำหรับ internal training
- อัปเดต `generateWelfarePDFAsBase64` ให้ใช้ HTML-to-PDF

#### `src/components/forms/WelfareForm.tsx`
- เปลี่ยนจาก `generateInternalTrainingPDF` เป็น `generateInternalTrainingPDFFromHTML`

## คุณสมบัติของ HTML-to-PDF Generator

### 1. รองรับภาษาไทยเต็มรูปแบบ
- ใช้ฟอนต์ Sarabun จาก Google Fonts
- แสดงผลภาษาไทยได้ถูกต้อง 100%
- รองรับการจัดรูปแบบข้อความภาษาไทย

### 2. Layout ที่สวยงาม
- ใช้ CSS สำหรับจัดรูปแบบ
- ตารางที่มีเส้นขอบชัดเจน
- การจัดวางที่เป็นระเบียบ

### 3. ข้อมูลครบถ้วน
- แสดงข้อมูลการอบรมทั้งหมด
- ตารางผู้เข้าร่วมอบรม
- รายละเอียดค่าใช้จ่าย
- ส่วนลายเซ็นผู้อนุมัติ

## โครงสร้าง HTML Template

### 1. Header Section
```html
<div class="header">
  แบบขออนุมัติจัดฝึกอบรม
</div>
```

### 2. Form Fields
```html
<div class="form-row">
  <span class="label">เรื่อง</span>
  <span class="underline">ขออนุมัติหลักสูตรและค่าใช้จ่ายการอบรม</span>
</div>
```

### 3. Participants Table
```html
<table class="table">
  <thead>
    <tr>
      <th>ลำดับ</th>
      <th>รายการ</th>
      <th>จำนวน</th>
      <th>หน่วย</th>
    </tr>
  </thead>
  <tbody>
    <!-- Dynamic participant rows -->
  </tbody>
</table>
```

### 4. Cost Details
```html
<div class="cost-section">
  <div class="cost-row">
    <span>ค่าวิทยากร <span class="underline">...</span> บาท</span>
    <span>รวมทั้งสิ้น <span class="underline">...</span> บาท</span>
  </div>
</div>
```

### 5. Signature Section
```html
<div class="signature-section">
  <div class="signature-box">
    <div>ผู้ร้องขอ</div>
    <div class="signature-line"></div>
    <!-- Signature details -->
  </div>
</div>
```

## CSS Styling

### 1. ฟอนต์ภาษาไทย
```css
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
}
```

### 2. Layout และ Spacing
```css
.container {
  max-width: 210mm;
  margin: 0 auto;
  background: white;
}

.form-row {
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
}
```

### 3. ตารางและเส้นขอบ
```css
.table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.table th,
.table td {
  border: 1px solid #000;
  padding: 8px;
  text-align: center;
}
```

## ข้อดีของวิธีใหม่

### 1. ภาษาไทยสมบูรณ์
- แสดงผลภาษาไทยได้ถูกต้อง 100%
- ไม่มีปัญหา encoding
- รองรับอักขระพิเศษภาษาไทย

### 2. ความยืดหยุ่น
- ง่ายต่อการแก้ไข layout
- สามารถปรับแต่ง CSS ได้
- เพิ่มเติมข้อมูลได้ง่าย

### 3. คุณภาพสูง
- ความละเอียดสูง (scale: 2)
- สีสันและรูปแบบสวยงาม
- เหมาะสำหรับการพิมพ์

## การใช้งาน

### 1. สำหรับ Internal Training
```typescript
import { generateInternalTrainingPDFFromHTML } from '@/components/pdf/InternalTrainingPDFGeneratorHTML';

const pdfBlob = await generateInternalTrainingPDFFromHTML(
  request,
  user,
  employeeData
);
```

### 2. Integration ใน PDF Manager
```typescript
if (request.type === 'internal_training') {
  pdfBlob = await generateInternalTrainingPDFFromHTML(
    request as any,
    user,
    employeeData
  );
}
```

## ผลลัพธ์

### ก่อนแก้ไข
- ภาษาไทยแสดงเป็นตัวอักษรแปลก
- ไม่สามารถอ่านได้
- Layout ไม่สวยงาม

### หลังแก้ไข
- ภาษาไทยแสดงผลถูกต้อง
- อ่านได้ชัดเจน
- Layout สวยงามและเป็นระเบียบ
- เหมาะสำหรับการใช้งานจริง

## การทดสอบ

### 1. ทดสอบการสร้าง PDF
- ส่งคำร้อง Internal Training ใหม่
- ตรวจสอบ PDF ที่สร้างขึ้น
- ยืนยันว่าภาษาไทยแสดงผลถูกต้อง

### 2. ทดสอบ Approval Workflow
- ทดสอบการอนุมัติโดย Manager
- ทดสอบการอนุมัติโดย HR
- ตรวจสอบ PDF สุดท้ายที่มีลายเซ็น

### 3. ทดสอบการดาวน์โหลด
- ดาวน์โหลด PDF จากระบบ
- เปิดดูใน PDF viewer
- ตรวจสอบความถูกต้องของข้อมูล

## ข้อจำกัด

### 1. Performance
- การสร้าง PDF ใช้เวลานานกว่าเดิมเล็กน้อย
- ต้องใช้ browser rendering

### 2. Dependencies
- ต้องติดตั้ง html2canvas
- ต้องมี internet สำหรับโหลดฟอนต์

### 3. Browser Compatibility
- ต้องรองรับ HTML5 Canvas
- ต้องรองรับ modern CSS

## สรุป

การแก้ไขปัญหาภาษาไทยใน Internal Training PDF สำเร็จแล้ว โดยใช้วิธี HTML-to-PDF ที่:
- รองรับภาษาไทยเต็มรูปแบบ
- สร้าง PDF ที่สวยงามและอ่านง่าย
- ใช้งานได้จริงในระบบ approval workflow
- เหมาะสำหรับการพิมพ์และเก็บเอกสาร

ตอนนี้ระบบสามารถสร้าง PDF ภาษาไทยสำหรับ Internal Training ได้อย่างสมบูรณ์แล้ว!