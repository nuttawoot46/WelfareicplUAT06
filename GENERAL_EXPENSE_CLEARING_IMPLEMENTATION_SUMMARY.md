# General Expense Clearing Form Implementation Summary

## Overview
Created a new General Expense Clearing Form component for handling expense clearing for general advance payments (non-sales department).

## Implementation Date
January 22, 2025

## Files Created

### 1. src/components/forms/GeneralExpenseClearingForm.tsx
- New form component for general expense clearing
- Similar structure to ExpenseClearingForm but simplified for general use
- Features:
  - Load data from existing general advance requests
  - Simplified expense categories (no dealer/subdealer fields)
  - Real-time calculation of refunds
  - Tax calculation based on category
  - Digital signature integration
  - File attachment support
  - PDF generation and upload

## Files Modified

### 1. src/components/forms/AccountingFormSelector.tsx
- Added new option for "เคลียร์ค่าใช้จ่าย (ทั่วไป)"
- Updated existing expense clearing title to "เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)"
- Color scheme: purple-600 for general expense clearing

### 2. src/pages/AccountingFormsPage.tsx
- Added import for GeneralExpenseClearingForm
- Updated AccountingFormType to include 'general-expense-clearing'
- Added routing logic for the new form type

### 3. src/types/index.ts
- Added 'general-expense-clearing' to WelfareType union type

## Key Features

### General Expense Categories
The form includes simplified expense categories:
- ค่าอาหารและเครื่องดื่ม (0% tax)
- ค่าเช่าสถานที่ (5% tax)
- ค่าบริการ/ค่าสนับสนุน (3% tax)
- ค่าดนตรี/เครื่องเสียง (3% tax)
- ของรางวัล (5% tax)
- ค่าโฆษณา (2% tax)
- ค่าเดินทาง/ที่พัก (0% tax)
- อุปกรณ์และอื่นๆ (0% tax)

### Form Workflow
1. User selects existing general advance request (optional)
2. System loads expense items from selected request
3. User fills in actual used amounts
4. System auto-calculates:
   - Tax amounts based on category
   - Net amounts (used - tax)
   - Refund amounts (requested - used)
5. User adds additional details and attachments
6. User signs digitally
7. System generates PDF and submits request

### Calculation Logic
- **Tax Amount** = (Used Amount × Tax Rate) / 100
- **Net Amount** = Used Amount - Tax Amount
- **Refund** = Requested Amount - Used Amount
- **Total Refund** = Sum of all refund amounts (can be negative if overspent)

### Visual Indicators
- Green background for positive refunds (money to return)
- Red background for negative refunds (additional payment needed)
- Purple theme throughout the form
- Real-time updates as user enters data

## Database Integration
- Uses existing welfare_requests table
- Request type: 'general-expense-clearing'
- Stores expense items as JSON in expenseClearingItems field
- Links to original advance request via originalAdvanceRequestId

## PDF Generation
- Reuses existing ExpenseClearingPDFGenerator
- Filename format: `general_expense_clearing_emp{employeeId}_{timestamp}.pdf`
- Includes all expense details and digital signature

## User Experience Improvements
1. Auto-loads data from previous general advance requests
2. Real-time calculation feedback
3. Clear visual distinction between sales and general expense clearing
4. Simplified form fields (no dealer/subdealer complexity)
5. Responsive table layout for expense items

## Testing Recommendations
1. Test loading data from existing general advance requests
2. Verify tax calculations for all categories
3. Test refund calculations (positive and negative scenarios)
4. Verify PDF generation with correct data
5. Test file upload and attachment functionality
6. Verify digital signature integration
7. Test form submission and database storage

## Future Enhancements
- Add validation for maximum refund amounts
- Implement expense item templates
- Add bulk import for expense items
- Create expense clearing reports
- Add notification system for pending clearings

## Notes
- Form follows the same pattern as ExpenseClearingForm for consistency
- Simplified for general use cases without sales-specific fields
- Maintains compatibility with existing PDF generation system
- Uses purple color scheme to distinguish from sales expense clearing (green)
