# Expense Clearing Form Implementation Summary

## Overview
Created a comprehensive expense clearing form system that allows employees to report actual expenses from advance payments and calculate refunds.

## Files Created/Modified

### New Components Created
1. **src/components/forms/ExpenseClearingForm.tsx**
   - Complete expense clearing form with dropdown to select previous advance requests
   - Automatically populates fields from selected advance request
   - Allows manual entry if no previous advance request exists
   - Calculates refund amounts automatically
   - Includes digital signature integration

2. **src/components/pdf/ExpenseClearingPDFGenerator.tsx**
   - PDF generator specifically for expense clearing forms
   - Shows comparison between requested amounts and actual usage
   - Highlights refund amounts in green
   - Includes all activity type checkboxes and signatures

3. **src/utils/expenseClearingPdfManager.ts**
   - PDF management for expense clearing workflow
   - Handles signature additions and PDF updates
   - Manages PDF storage in different buckets based on approval stage

### Modified Files
1. **src/components/forms/AccountingFormSelector.tsx**
   - Added expense clearing option with appropriate icon
   - Updated type definitions to include 'expense-clearing'

2. **src/pages/AccountingFormsPage.tsx**
   - Added routing for expense clearing form
   - Imported ExpenseClearingForm component
   - Updated type handling for both advance and expense clearing

3. **src/types/index.ts**
   - Added 'expense-clearing' to WelfareType union
   - Added expense clearing specific fields:
     - originalAdvanceRequestId
     - expenseClearingItems
     - advanceLocation
     - advanceParticipants
     - advanceEventDate
     - advanceExpenseItems

4. **src/context/WelfareContext.tsx**
   - Added expense clearing fields to submitRequest function
   - Added field mapping in fetchRequests for proper data retrieval
   - Handles JSON serialization of expense clearing items

### Database Migration
1. **add_expense_clearing_columns.sql**
   - Adds original_advance_request_id column with foreign key reference
   - Adds expense_clearing_items JSONB column
   - Creates performance indexes
   - Adds documentation comments

## Key Features

### Form Functionality
- **Advance Request Selection**: Dropdown to select from approved advance requests
- **Auto-Population**: Automatically fills form fields from selected advance request
- **Manual Entry**: Option to create new expense clearing without reference
- **Expense Table**: Comprehensive table with columns for:
  - Item name (dropdown selection)
  - Tax rate
  - Requested amount (from advance)
  - Actual used amount (user input)
  - Tax and VAT calculations
  - Refund amount calculation
- **Real-time Calculations**: Automatic calculation of totals and refunds
- **File Attachments**: Support for receipts and expense documentation
- **Digital Signature**: Integration with signature system

### PDF Generation
- **Professional Layout**: Company logo and proper formatting
- **Comparison View**: Side-by-side comparison of requested vs actual amounts
- **Visual Highlights**: 
  - Yellow highlighting for actual usage amounts
  - Green highlighting for refund amounts
- **Activity Type Checkboxes**: Visual representation of selected activity type
- **Signature Sections**: Spaces for employee and manager signatures
- **Summary Box**: Clear display of total requested, used, and refund amounts

### Data Management
- **Proper Relationships**: Foreign key reference to original advance request
- **JSON Storage**: Flexible storage of expense items array
- **Type Safety**: Full TypeScript support throughout
- **Database Indexes**: Optimized queries for expense clearing operations

## Workflow Integration

### User Flow
1. Employee navigates to Accounting Forms
2. Selects "เคลียร์ค่าใช้จ่าย" (Expense Clearing)
3. Optionally selects previous advance request from dropdown
4. Form auto-populates with advance request data
5. Employee fills in actual usage amounts
6. System calculates refunds automatically
7. Employee adds supporting documents
8. Digital signature and submission
9. PDF generated and stored

### Approval Flow
- Follows same approval workflow as other requests
- Manager → HR → Accounting approval stages
- PDF updated with signatures at each stage
- Stored in appropriate buckets for each approval level

## Technical Implementation

### Type Safety
- Full TypeScript integration
- Proper type definitions for all expense clearing fields
- Type-safe form handling with react-hook-form

### Performance
- Database indexes for efficient queries
- Cached data in WelfareContext
- Optimized PDF generation

### Error Handling
- Comprehensive error handling in form submission
- Toast notifications for user feedback
- Graceful fallbacks for missing data

## Usage Instructions

### For Employees
1. Go to "ฟอร์มสำหรับบัญชี" (Accounting Forms)
2. Click "เคลียร์ค่าใช้จ่าย" (Expense Clearing)
3. If you have a previous advance request, select it from dropdown
4. Fill in actual amounts used for each expense item
5. Add receipts and supporting documents
6. Review calculated refund amounts
7. Sign and submit

### For Managers/HR
- Same approval process as other welfare requests
- PDF shows clear comparison of requested vs actual amounts
- Refund calculations are automatically computed
- Digital signatures are preserved in PDF

## Future Enhancements
- Integration with accounting systems for automatic refund processing
- Bulk expense clearing for multiple advance requests
- Advanced reporting and analytics for expense patterns
- Mobile-optimized interface for field expense reporting

## Database Schema Changes
```sql
-- New columns added to welfare_requests table
original_advance_request_id INTEGER REFERENCES welfare_requests(id)
expense_clearing_items JSONB

-- New indexes for performance
idx_welfare_requests_original_advance_request_id
idx_welfare_requests_expense_clearing_type
```

This implementation provides a complete expense clearing system that integrates seamlessly with the existing advance payment workflow while maintaining data integrity and providing clear audit trails.