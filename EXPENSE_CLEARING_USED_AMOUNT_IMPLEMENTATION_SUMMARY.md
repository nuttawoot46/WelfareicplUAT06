# Expense Clearing Used Amount Implementation Summary

## Overview
เพิ่มคอลัมน์ "จำนวนเงินใช้" ในฟอร์ม ExpenseClearingForm และปรับปรุงการคำนวณเพื่อรองรับการเคลียร์ค่าใช้จ่ายที่แม่นยำยิ่งขึ้น

## Changes Made

### 1. Frontend Changes

#### ExpenseClearingForm.tsx
- ✅ เพิ่มฟิลด์ `usedAmount` ใน interface `ExpenseClearingFormValues`
- ✅ เพิ่มคอลัมน์ "จำนวนเงินใช้" ในตารางหลังจาก "จำนวนเงินเบิก"
- ✅ ปรับการคำนวณ:
  - **ยอดเงินสุทธิ** = จำนวนเงินใช้ - ภาษี
  - **จำนวนคืน** = จำนวนเงินเบิก - จำนวนเงินใช้
- ✅ ปรับ default values และการเพิ่มรายการใหม่
- ✅ ปรับการโหลดข้อมูลจาก advance request เดิม

#### AdvanceForm.tsx
- ✅ เพิ่มฟิลด์วันที่สิ้นสุดกิจกรรม (`endDate`)
- ✅ เปลี่ยน layout จาก 2 คอลัมน์เป็น 3 คอลัมน์
- ✅ ปรับการคำนวณภาษีให้กรอกเองแทนการคำนวณอัตโนมัติ

### 2. Database Schema Changes

#### Required Columns
```sql
-- คอลัมน์ที่ต้องมีในตาราง welfare_requests:
- expense_clearing_items (TEXT) - JSON array ของรายการเคลียร์ค่าใช้จ่าย
- original_advance_request_id (INTEGER) - อ้างอิงไปยังคำขอเบิกเงินล่วงหน้าเดิม
- end_date (DATE) - วันที่สิ้นสุดกิจกรรม
```

#### JSON Structure for Expense Items
```json
{
  "name": "ค่าอาหารและเครื่องดื่ม",
  "taxRate": 0,
  "requestAmount": 5000,
  "usedAmount": 4500,
  "taxAmount": 0,
  "netAmount": 4500,
  "refund": 500
}
```

### 3. Data Flow

#### Form Submission Process
1. **User Input**: กรอกจำนวนเงินเบิก และจำนวนเงินใช้
2. **Auto Calculation**: 
   - ยอดเงินสุทธิ = จำนวนเงินใช้ - ภาษี
   - จำนวนคืน = จำนวนเงินเบิก - จำนวนเงินใช้
3. **Form Validation**: ตรวจสอบข้อมูลที่จำเป็น
4. **Data Mapping**: ส่งข้อมูลไปยัง WelfareContext
5. **Database Storage**: บันทึกใน `expense_clearing_items` column

#### WelfareContext Mapping
```typescript
// ข้อมูลถูกส่งผ่าน requestData.expenseClearingItems
expense_clearing_items: JSON.stringify(requestData.expenseClearingItems)
```

### 4. Migration Files Created

#### ensure_expense_clearing_columns.sql
- เพิ่มคอลัมน์ที่จำเป็นถ้ายังไม่มี
- สร้าง foreign key constraint
- สร้าง indexes เพื่อประสิทธิภาพ
- อัปเดตข้อมูลเดิมให้มี `usedAmount` field

#### verify_expense_clearing_columns.sql
- ตรวจสอบ schema ปัจจุบัน
- ตรวจสอบโครงสร้างข้อมูล JSON
- นับจำนวน records ที่มี `usedAmount`

## Key Features

### 1. Enhanced Expense Tracking
- **จำนวนเงินเบิก**: เงินที่ขออนุมัติไว้
- **จำนวนเงินใช้**: เงินที่ใช้จริง
- **จำนวนคืน**: เงินที่ต้องคืน (หรือเพิ่ม)

### 2. Flexible Tax Calculation
- ภาษีสามารถกรอกเองได้
- ไม่ต้องพึ่งการคำนวณอัตโนมัติ
- Default เป็น 0

### 3. Real-time Calculation
- คำนวณยอดรวมแบบ real-time
- แสดงสีแดงถ้าต้องจ่ายเพิ่ม
- แสดงสีเขียวถ้าได้เงินคืน

### 4. Data Integrity
- Foreign key constraint กับ advance request เดิม
- JSON validation
- Proper indexing

## Testing Checklist

### Frontend Testing
- [ ] ทดสอบการเพิ่ม/ลบรายการค่าใช้จ่าย
- [ ] ทดสอบการคำนวณยอดรวม
- [ ] ทดสอบการโหลดข้อมูลจาก advance request เดิม
- [ ] ทดสอบการส่งฟอร์ม
- [ ] ทดสอบ validation

### Backend Testing
- [ ] ทดสอบการบันทึกข้อมูลในฐานข้อมูล
- [ ] ทดสอบ JSON structure
- [ ] ทดสอบ foreign key constraint
- [ ] ทดสอบการ query ข้อมูล

### Database Testing
- [ ] รัน migration scripts
- [ ] ตรวจสอบ schema
- [ ] ตรวจสอบข้อมูลเดิม
- [ ] ทดสอบ performance

## Migration Steps

1. **Run Database Migration**:
   ```sql
   -- รัน ensure_expense_clearing_columns.sql
   -- ตรวจสอบด้วย verify_expense_clearing_columns.sql
   ```

2. **Deploy Frontend Changes**:
   - ExpenseClearingForm.tsx
   - AdvanceForm.tsx

3. **Test End-to-End**:
   - สร้างคำขอเบิกเงินล่วงหน้า
   - สร้างคำขอเคลียร์ค่าใช้จ่าย
   - ตรวจสอบการคำนวณ
   - ตรวจสอบการบันทึกข้อมูล

## Notes

- การเปลี่ยนแปลงนี้ backward compatible
- ข้อมูลเดิมจะถูกอัปเดตให้มี `usedAmount: 0`
- ไม่กระทบกับฟังก์ชันเดิม
- เพิ่มความแม่นยำในการเคลียร์ค่าใช้จ่าย

## Future Enhancements

- เพิ่มรายงานการเปรียบเทียบเงินเบิกกับเงินใช้
- เพิ่ม notification เมื่อมีเงินคืนหรือต้องจ่ายเพิ่ม
- เพิ่มการ export ข้อมูลเป็น Excel
- เพิ่มกราฟแสดงสถิติการใช้เงิน