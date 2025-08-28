# สรุปการเพิ่มระบบเบิกเงินทดลอง (Advance Payment)

## สิ่งที่ได้ทำเสร็จแล้ว

### 1. การอัปเดตฐานข้อมูล (add_advance_columns.sql)
- เพิ่ม type ใหม่ 'advance' ใน constraint check
- เพิ่มคอลัมน์ใหม่สำหรับข้อมูลเบิกเงินทดลอง:
  - `advance_department`: แผนก
  - `advance_district`: เขต
  - `advance_activity_type`: ประเภทกิจกรรม
  - `advance_activity_other`: ระบุอื่นๆ
  - `advance_shop_company`: ชื่อร้าน/บริษัท
  - `advance_amphur`: อำเภอ
  - `advance_province`: จังหวัด
  - `advance_travel_days`: จำนวนวันเดินทาง
  - `advance_work_days`: จำนวนวันปฏิบัติงาน
  - `advance_total_days`: รวมจำนวนวัน
  - `advance_daily_rate`: อัตราค่าใช้จ่ายรายวัน
  - `advance_accommodation_cost`: ค่าที่พัก
  - `advance_transportation_cost`: ค่าเดินทาง
  - `advance_meal_allowance`: เบี้ยเลี้ยง
  - `advance_other_expenses`: ค่าใช้จ่ายอื่นๆ
  - `advance_project_name`: ชื่อโครงการ
  - `advance_project_location`: สถานที่โครงการ
  - `advance_expected_return_date`: วันที่คาดว่าจะกลับ
  - `advance_urgency_level`: ระดับความเร่งด่วน
  - `advance_approval_deadline`: วันที่ต้องการอนุมัติ

### 2. การอัปเดต Type Definitions (src/types/index.ts)
- เพิ่ม 'advance' ใน WelfareType union
- เพิ่มฟิลด์ advance ทั้งหมดใน WelfareRequest interface

### 3. การอัปเดต WelfareForm Component (src/components/forms/WelfareForm.tsx)
- เพิ่มฟิลด์ advance ใน FormValues interface
- เพิ่ม form title สำหรับ advance
- เพิ่ม JSX form fields สำหรับ advance แบ่งเป็น 3 ส่วน:
  1. ข้อมูลทั่วไป
  2. ระยะเวลา
  3. รายละเอียดค่าใช้จ่าย
- เพิ่ม useEffect สำหรับคำนวณจำนวนวันและยอดเงินรวมอัตโนมัติ
- เพิ่มการจัดการข้อมูล advance ในส่วน edit และ submit

### 4. การอัปเดต WelfareFormSelector (src/components/forms/WelfareFormSelector.tsx)
- เพิ่ม AdvanceIcon component
- เพิ่มตัวเลือก advance ใน welfareOptions array
- เพิ่มการจัดการสีและสไตล์สำหรับ advance
- **อัปเดตการตรวจสอบสิทธิ์**: เบิกเงินทดลองสามารถเลือกได้ตลอดเวลา ไม่มีข้อจำกัดเรื่องอายุงานหรืองบประมาณ

### 5. การสร้าง PDF Generator ใหม่ (src/components/pdf/AdvancePDFGenerator.tsx)
- สร้าง generateAdvancePDF function
- รองรับการแสดงข้อมูลเบิกเงินทดลองในรูปแบบ PDF
- มีตาราง breakdown ค่าใช้จ่าย
- รองรับลายเซ็นดิจิทัล
- มีส่วนสำหรับการอนุมัติของผู้จัดการและ HR

## ฟิลด์หลักที่ใช้ในฟอร์ม

### ข้อมูลทั่วไป
- แผนก (required) - ไว้ด้านบนสุด
- เขต (required) - ไว้ด้านบนสุด
- ประเภทกิจกรรม (dropdown): จัดประชุม, ออกบูธ, ดีเลอร์, ซับดีลเลอร์, อื่นๆ ระบุ
- โปรดระบุ (แสดงเมื่อเลือก "อื่นๆ ระบุ")
- ชื่อร้าน/บริษัท (required)
- อำเภอ (required)
- จังหวัด (required)

### ระยะเวลา
- วันที่เริ่มต้น (required)
- วันที่สิ้นสุด (required)
- จำนวนวันเดินทาง
- จำนวนวันปฏิบัติงาน
- รวมจำนวนวัน (คำนวณอัตโนมัติ)
- วันที่คาดว่าจะกลับ
- วันที่ต้องการอนุมัติ (required)

### รายละเอียดค่าใช้จ่าย
- อัตราค่าใช้จ่ายรายวัน
- ค่าที่พัก
- ค่าเดินทาง
- เบี้ยเลี้ยง
- ค่าใช้จ่ายอื่นๆ
- รวมจำนวนเงินที่ขอเบิกทดลอง (คำนวณอัตโนมัติ)

## การคำนวณอัตโนมัติ

### จำนวนวันรวม
```javascript
const totalDays = travelDays + workDays;
```

### จำนวนเงินรวม
```javascript
const totalAmount = (dailyRate * totalDays) + accommodationCost + transportationCost + mealAllowance + otherExpenses;
```

## สิ่งที่ต้องทำต่อ

1. **รัน SQL migration** เพื่อเพิ่มคอลัมน์ใหม่ในฐานข้อมูล
```sql
-- รันไฟล์ add_advance_columns.sql
```

2. **แก้ไข linting errors** ที่เหลืออยู่

3. **ทดสอบการทำงาน** ของฟอร์มและ PDF generation

4. **เพิ่มการจัดการ advance ใน dashboard และ reports** หากต้องการ

5. **ทดสอบฟีเจอร์ใหม่** ในสภาพแวดล้อม staging

## การใช้งาน

ผู้ใช้สามารถเลือก "เบิกเงินทดลอง" จากหน้า WelfareFormSelector และกรอกฟอร์มตามฟิลด์ที่กำหนด ระบบจะคำนวณจำนวนวันและยอดเงินรวมอัตโนมัติ และสร้าง PDF สำหรับการอนุมัติ

### ข้อดีของระบบเบิกเงินทดลอง:
- **ไม่มีข้อจำกัด**: สามารถเบิกได้ตลอดเวลา ไม่ต้องรออายุงาน 180 วัน
- **ไม่จำกัดยอดเงิน**: ไม่มีงบประมาณคงเหลือที่ต้องตรวจสอบ
- **ไม่แสดงวงเงินสูงสุด**: หน้าฟอร์มจะไม่แสดงข้อมูลวงเงินและงบประมาณคงเหลือ
- **คำนวณอัตโนมัติ**: ระบบจะคำนวณจำนวนวันและยอดเงินให้เอง
- **ครบถ้วน**: รองรับทุกประเภทค่าใช้จ่าย (เดินทาง, ที่พัก, เบี้ยเลี้ยง, อื่นๆ)
- **UI เฉพาะ**: มีข้อความแจ้งเตือนพิเศษอธิบายลักษณะการเบิกเงินทดลอง

## โครงสร้างไฟล์ที่เปลี่ยนแปลง

1. `add_advance_columns.sql` - SQL migration script
2. `src/types/index.ts` - Type definitions
3. `src/components/forms/WelfareForm.tsx` - Main form component
4. `src/components/forms/WelfareFormSelector.tsx` - Form selector
5. `src/components/pdf/AdvancePDFGenerator.tsx` - PDF generator (ใหม่)
