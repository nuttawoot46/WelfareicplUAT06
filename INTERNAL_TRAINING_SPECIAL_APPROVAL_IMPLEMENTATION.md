# Internal Training Special Approval Implementation

## Overview
การเพิ่มเงื่อนไขพิเศษสำหรับการอบรมภายใน (Internal Training) ที่มีจำนวนเงินเกิน 10,000 บาท จะต้องผ่านการอนุมัติพิเศษจาก kanin.s@icpladda.com หลังจาก HR อนุมัติแล้ว

## Workflow Changes

### เดิม (Original Flow):
```
Employee Submit → Manager Approve → HR Approve → Accounting Approve → Complete
```

### ใหม่ (New Flow for Internal Training > 10,000 บาท):
```
Employee Submit → Manager Approve → HR Approve → Special Approve (kanin.s) → Accounting Approve → Complete
```

## Technical Implementation

### 1. Database Changes
- เพิ่ม columns ใหม่ใน `welfare_requests` table:
  - `requires_special_approval` (BOOLEAN)
  - `special_approver_id` (TEXT)
  - `special_approver_name` (TEXT)
  - `special_approved_at` (TIMESTAMP)

### 2. Status Types
- เพิ่ม status ใหม่:
  - `pending_special_approval`
  - `rejected_special_approval`

### 3. Form Changes
- เพิ่ม Alert แจ้งเตือนเมื่อจำนวนเงินเกิน 10,000 บาท
- ตั้งค่า `requiresSpecialApproval` flag เมื่อ submit form

### 4. HR Approval Logic
- แก้ไข HR approval function เพื่อเช็คเงื่อนไข:
  - ถ้า Internal Training > 10,000 บาท → status = `pending_special_approval`
  - ถ้าไม่ → status = `pending_accounting` (เหมือนเดิม)

### 5. Special Approval Page
- สร้างหน้าใหม่ `/special-approve` สำหรับ kanin.s@icpladda.com
- แสดงเฉพาะคำร้อง Internal Training ที่เกิน 10,000 บาท
- มีฟังก์ชัน Approve/Reject พร้อมเหตุผล

### 6. Navigation
- เพิ่ม menu item ใน Sidebar สำหรับ kanin.s@icpladda.com และ Admin
- แสดงเป็น "อนุมัติพิเศษ (>10K)"

## Files Modified/Created

### Modified Files:
1. `src/types/index.ts` - เพิ่ม status และ fields ใหม่
2. `src/components/forms/WelfareForm.tsx` - เพิ่มเงื่อนไขและ Alert
3. `src/pages/HRApprovalPage.tsx` - แก้ไข approval logic
4. `src/components/layout/Sidebar.tsx` - เพิ่ม menu item
5. `src/App.tsx` - เพิ่ม route ใหม่

### New Files:
1. `supabase/migrations/20250130000000_add_special_approval_fields.sql` - Database migration (columns)
2. `supabase/migrations/20250130000001_fix_special_approval_rls.sql` - Database migration (RLS policies fix)
3. `src/services/specialApprovalApi.ts` - API functions
4. `src/pages/SpecialApprovalPage.tsx` - Special approval interface
5. `src/components/ui/badge.tsx` - Badge component

## Security Considerations

### Access Control:
- เฉพาะ `kanin.s@icpladda.com` และ Admin role เท่านั้นที่เข้าถึงหน้า Special Approval ได้
- RLS policies ใน Supabase ได้รับการอัปเดตเพื่อรองรับ special approver และ admin

### Data Validation:
- เช็คเงื่อนไข 10,000 บาท ทั้งใน frontend และ backend
- Validate email address ก่อนแสดงหน้า Special Approval

## Testing Scenarios

### Test Case 1: Internal Training ≤ 10,000 บาท
1. Submit Internal Training form จำนวน 8,000 บาท
2. Manager approve
3. HR approve → ควรไปที่ `pending_accounting` ตรงๆ

### Test Case 2: Internal Training > 10,000 บาท
1. Submit Internal Training form จำนวน 15,000 บาท
2. Manager approve
3. HR approve → ควรไปที่ `pending_special_approval`
4. kanin.s approve → ควรไปที่ `pending_accounting`

### Test Case 3: Access Control
1. User อื่นพยายามเข้า `/special-approve` → ควรแสดง error
2. kanin.s@icpladda.com เข้า `/special-approve` → ควรแสดงหน้าปกติ
3. Admin role เข้า `/special-approve` → ควรแสดงหน้าปกติ

## Deployment Steps

1. Run database migrations in order:
   ```sql
   -- Apply supabase/migrations/20250130000000_add_special_approval_fields.sql
   -- Apply supabase/migrations/20250130000001_fix_special_approval_rls.sql
   ```

2. Deploy frontend changes

3. Test with sample data

4. Notify kanin.s@icpladda.com and Admin users about new functionality

## Known Issues Fixed

### Issue: Column "user_id" does not exist
- **Problem**: Original RLS policy referenced non-existent `user_id` column
- **Solution**: Updated policy to use correct `employee_id` column with proper JOIN to Employee table
- **Files**: `supabase/migrations/20250130000001_fix_special_approval_rls.sql`

## Future Enhancements

1. **Email Notifications**: ส่งอีเมลแจ้งเตือนเมื่อมีคำร้องรอ special approval
2. **Dashboard Widget**: เพิ่ม widget แสดงจำนวนคำร้องรอใน dashboard
3. **Audit Trail**: บันทึก log การ approve/reject
4. **Configurable Threshold**: ทำให้จำนวน 10,000 บาท สามารถปรับได้ใน settings

## Notes

- เงื่อนไขนี้ใช้เฉพาะ Internal Training เท่านั้น
- External Training ยังคงใช้ workflow เดิม
- การเปลี่ยนแปลงนี้ backward compatible กับข้อมูลเดิม