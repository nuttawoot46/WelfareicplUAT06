# Advance Form District Auto-Population Implementation

## Overview
Implemented automatic population of the "เขต" (district) field in the Advance Form based on employee data from the `sales_data` table.

## Changes Made

### 1. Database Setup
- **File**: `supabase/migrations/20250211000000_create_sales_data_table.sql`
- Created `sales_data` table with the following structure:
  - `id`: Serial primary key
  - `department`: VARCHAR(10) - Department code (DIS, WHS, PD, COR, PBH)
  - `code`: VARCHAR(10) - District/area code (A01, A02, WHS-1, etc.)
  - `name`: TEXT - Employee name
  - `position`: VARCHAR(10) - Position code (ME, MR, WHS, PD, COR, PBH)
  - `manager_name`: VARCHAR(100) - Manager's name
  - `created_at`: Timestamp
- Added indexes for performance optimization
- Enabled Row Level Security (RLS)
- Created policies for authenticated users to read data

### 2. AdvanceForm Component Updates
- **File**: `src/components/forms/AdvanceForm.tsx`

#### Auto-Population Logic
- Modified the `fetchEmployeeData` useEffect to:
  1. Fetch employee data from the `Employee` table
  2. Query the `sales_data` table using the employee's name
  3. Auto-populate the `advanceDistrict` field with the matching `code` value
  4. Log the result for debugging

#### UI Changes
- Made the "เขต" (district) field read-only with a gray background
- Added helper text: "เขตจะถูกกรอกอัตโนมัติตามข้อมูลพนักงาน"
- Field is automatically populated when the form loads

### 3. Data Structure
The `sales_data` table contains mappings for:
- **DIS Department**: Codes A01-A10 (Managers: แวน จันทร์ทอง, สันติ ผลคำสุข)
- **WHS Department**: Codes WHS-1 to WHS-4 (Manager: ทรงกรด ปานแก้ว)
- **PD Department**: Code PD (Manager: ทรงกรด ปานแก้ว)
- **COR Department**: Codes COR1-COR2 (Manager: ทรงกรด ปานแก้ว)
- **PBH Department**: Codes PH1-PH2 (Manager: วิกรานต์ แซ่ตัน)

## How It Works

1. **User Login**: When a user logs in and opens the Advance Form
2. **Employee Lookup**: System fetches employee data using their email
3. **District Lookup**: System queries `sales_data` table using employee name
4. **Auto-Fill**: If a match is found, the district code is automatically populated
5. **Read-Only**: User cannot manually edit the district field

## Benefits

1. **Data Consistency**: Ensures district codes are always correct and consistent
2. **User Experience**: Reduces manual data entry and potential errors
3. **Efficiency**: Saves time for users filling out advance forms
4. **Accuracy**: Eliminates typos and incorrect district codes

## Technical Notes

- Used TypeScript type assertions (`as any`) to handle the `sales_data` table since it's not in the generated Supabase types
- Added proper error handling for cases where employee is not found in `sales_data`
- Implemented console logging for debugging and monitoring
- Field remains editable in the database but read-only in the UI

## Testing Checklist

- [ ] Verify `sales_data` table is created in Supabase
- [ ] Populate `sales_data` table with employee data using `insert_sales_data.sql`
- [ ] Test form loading with different employees
- [ ] Verify district code auto-populates correctly
- [ ] Test with employees not in `sales_data` table
- [ ] Verify read-only behavior of district field
- [ ] Check console logs for proper debugging information

## Future Enhancements

1. Add admin interface to manage `sales_data` entries
2. Implement bulk import/export functionality
3. Add validation to ensure data consistency
4. Create reports showing district-wise advance requests
