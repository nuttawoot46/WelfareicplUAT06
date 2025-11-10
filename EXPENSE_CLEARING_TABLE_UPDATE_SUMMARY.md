# Expense Clearing Table Column Update Summary

## Date: 2025-02-11

## Overview
Updated the expense clearing form table structure to match the new column requirements with proper ordering and VAT field addition.

## Changes Made

### 1. Frontend Form Update (`src/components/forms/ExpenseClearingForm.tsx`)

#### New Table Column Structure:
1. **ลำดับ** - Row number (auto-numbered 1, 2, 3...)
2. **ชื่อรายการ** - Item name with dropdown selection
3. **อัตราภาษี** - Tax rate (auto-filled based on item selection)
4. **จำนวนเบิก** - Requested amount (editable)
5. **จำนวนใช้ (ก่อนภาษีมูลค่าเพิ่ม)** - Used amount before VAT (editable)
6. **ภาษีมูลค่าเพิ่ม** - VAT amount (currently 0.00, placeholder for future)
7. **ภาษีหัก ณ ที่จ่าย** - Withholding tax (auto-calculated)
8. **รวมจำนวนเงินทั้งสิ้น** - Total net amount (auto-calculated)
9. **คืนเงินบริษัท(+) เบิกเงินบริษัท(-)** - Refund/Additional payment
   - Green background for positive values (refund to company)
   - Red background for negative values (additional payment needed)
10. **จัดการ** - Actions (delete button)

#### Key Features:
- Auto-numbered sequence column
- VAT column added (currently showing 0.00 as placeholder)
- Color-coded refund column:
  - Green for positive (money returned to company)
  - Red for negative (additional money needed from company)
- Responsive table with proper column widths
- Total row with colspan for proper alignment

### 2. Database Migration (`add_vat_to_expense_clearing_items.sql`)

#### Migration Details:
- Adds `vatAmount` field to existing expense clearing items in JSONB structure
- Updates all existing records to include `vatAmount: 0`
- Updates column comment to document the new field structure
- Includes verification and sample data display

#### Fields in expense_clearing_items JSONB:
```json
{
  "name": "string",
  "taxRate": "number",
  "requestAmount": "number",
  "usedAmount": "number",
  "vatAmount": "number",      // NEW FIELD
  "taxAmount": "number",
  "netAmount": "number",
  "refund": "number",
  "otherDescription": "string"
}
```

### 3. PDF Generator Update (`src/components/pdf/ExpenseClearingPDFGenerator.tsx`)

#### Updated PDF Table:
- Matches the new form structure with all 9 columns
- Includes sequence number column
- Shows VAT amount column
- Color-coded refund column (green for positive, red for negative)
- Displays "otherDescription" when available
- Proper column widths for better readability
- Font size adjusted to 9px to fit all columns

#### PDF Table Features:
- Auto-numbered rows
- Proper formatting for all currency values
- Total row with proper calculations for all columns
- Color coding matches the form (green/red for refund amounts)

## Database Schema

### welfare_requests Table
```sql
expense_clearing_items JSONB
-- Structure: Array of objects with fields:
-- - name: string
-- - taxRate: number
-- - requestAmount: number
-- - usedAmount: number
-- - vatAmount: number (NEW)
-- - taxAmount: number
-- - netAmount: number
-- - refund: number
-- - otherDescription: string (optional)
```

## How to Apply Changes

### 1. Run Database Migration:
```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f add_vat_to_expense_clearing_items.sql
```

Or use Supabase SQL Editor:
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `add_vat_to_expense_clearing_items.sql`
3. Execute the migration

### 2. Frontend Changes:
The form and PDF generator have been updated automatically. No additional steps needed.

## Testing Checklist

- [ ] Create new expense clearing request
- [ ] Verify all 10 columns appear correctly
- [ ] Check sequence numbers are auto-generated
- [ ] Verify VAT column shows 0.00
- [ ] Test refund calculation (positive and negative)
- [ ] Verify color coding (green for positive, red for negative)
- [ ] Generate PDF and verify table structure matches form
- [ ] Check existing records still display correctly
- [ ] Verify total row calculations are accurate

## Notes

1. **VAT Field**: Currently set to 0.00 as a placeholder. Can be implemented in the future if needed.

2. **Refund Calculation**: 
   - Formula: `refund = requestAmount - usedAmount`
   - Positive value = Company gets money back
   - Negative value = Employee needs to pay more

3. **Color Coding**:
   - Green background = Positive refund (คืนเงินบริษัท)
   - Red background = Negative refund (เบิกเงินบริษัท)

4. **Backward Compatibility**: Existing records without `vatAmount` will be updated by the migration to include `vatAmount: 0`.

## Files Modified

1. `src/components/forms/ExpenseClearingForm.tsx` - Form table structure
2. `src/components/pdf/ExpenseClearingPDFGenerator.tsx` - PDF table structure
3. `add_vat_to_expense_clearing_items.sql` - Database migration (NEW)
4. `EXPENSE_CLEARING_TABLE_UPDATE_SUMMARY.md` - This documentation (NEW)

## Related Documentation

- See `EXPENSE_CLEARING_IMPLEMENTATION_SUMMARY.md` for original implementation
- See `EXPENSE_CLEARING_USED_AMOUNT_IMPLEMENTATION_SUMMARY.md` for used amount feature
