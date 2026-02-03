# Form Visibility Management Implementation Summary

## Overview
Implemented a comprehensive form visibility management system that allows admins to show/hide forms in both WelfareFormSelector and AccountingFormSelector components.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/20250210000000_create_form_visibility_table.sql`
- Created `form_visibility` table with columns:
  - `id`: UUID primary key
  - `form_type`: Text (unique) - identifies the form
  - `is_visible`: Boolean - controls visibility
  - `updated_at`: Timestamp
  - `updated_by`: UUID reference to users
- Enabled Row Level Security (RLS)
- Added policies:
  - Anyone can read form visibility
  - Only admins/superadmins can update
- Inserted default visibility settings for all 14 forms (10 welfare + 4 accounting)

### 2. API Service
**File**: `src/services/formVisibilityApi.ts`
- `getFormVisibility()`: Fetch all form visibility settings
- `updateFormVisibility()`: Update visibility for a specific form
- `isFormVisible()`: Check if a specific form is visible

### 3. Admin Management Page
**File**: `src/pages/admin/FormManagement.tsx`
- New admin page for managing form visibility
- Displays forms grouped by category (สวัสดิการ and บัญชี)
- Toggle switches to show/hide each form
- Real-time updates with toast notifications
- Loading states and error handling

### 4. Admin Route
**File**: `src/pages/Admin.tsx`
- Added import for `FormManagement` component
- Added route: `/admin/forms`

### 5. Sidebar Navigation
**File**: `src/components/layout/Sidebar.tsx`
- Added `Layout` icon import from lucide-react
- Added "จัดการฟอร์ม" link in admin section
- Link points to `/admin/forms`

### 6. AccountingFormSelector Updates
**File**: `src/components/forms/AccountingFormSelector.tsx`
- Added visibility settings state and loading
- Fetches form visibility on mount
- Filters options based on visibility settings
- Shows loading skeleton while fetching
- Shows "no forms available" message when all forms are hidden

### 7. WelfareFormSelector Updates
**File**: `src/components/forms/WelfareFormSelector.tsx`
- Added visibility settings state
- Combined visibility fetch with benefit limits fetch
- Added `isFormVisibleByAdmin()` check
- Integrated visibility check into `isWelfareTypeAvailable()`
- Filters options based on visibility
- Shows "form temporarily disabled" message for hidden forms
- Shows "no forms available" message when all forms are hidden

## Form Types Managed

### Welfare Forms (10)
1. training - ค่าอบรม
2. glasses - ค่าตัดแว่นสายตา
3. dental - ค่ารักษาทัตกรรม
4. fitness - ค่าออกกำลังกาย
5. medical - ของเยี่ยมกรณีเจ็บป่วย
6. wedding - สวัสดิการงานสมรส
7. childbirth - ค่าคลอดบุตร
8. funeral - ค่าช่วยเหลืองานศพ
9. internal_training - อบรมภายใน
10. employment-approval - ขออนุมัติการจ้างงาน

### Accounting Forms (4)
1. advance - เบิกเงินล่วงหน้า (ฝ่ายขาย)
2. general-advance - เบิกเงินล่วงหน้า (ทั่วไป)
3. expense-clearing - เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)
4. general-expense-clearing - เคลียร์ค่าใช้จ่าย (ทั่วไป)

## User Experience

### For Admins
1. Navigate to Admin → จัดการฟอร์ม
2. See all forms grouped by category
3. Toggle switches to show/hide forms
4. Changes take effect immediately
5. Toast notifications confirm changes

### For Regular Users
1. Hidden forms don't appear in form selectors
2. Existing validation rules still apply (budget, work duration, etc.)
3. If all forms are hidden, see friendly "no forms available" message
4. Loading states while fetching visibility settings

## Security
- RLS policies ensure only admins can modify visibility
- All users can read visibility settings
- Changes are tracked with `updated_by` and `updated_at`

## Testing Checklist
- [ ] Run migration to create form_visibility table
- [ ] Verify admin can access /admin/forms page
- [ ] Test toggling form visibility on/off
- [ ] Verify hidden forms don't appear in WelfareFormSelector
- [ ] Verify hidden forms don't appear in AccountingFormSelector
- [ ] Test that existing validation rules still work
- [ ] Verify non-admin users cannot modify visibility
- [ ] Test loading states and error handling
