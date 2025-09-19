# Debug Expense Clearing Form Submission

## Error Analysis
- **Error**: 400 Bad Request when submitting to Supabase
- **Likely Cause**: Database columns or constraints not properly set up

## Steps to Fix:

### 1. Run Database Migration
Copy and paste this SQL in your Supabase SQL Editor:

```sql
-- Fix for Expense Clearing Database Issues

-- 1. Add expense clearing columns
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS original_advance_request_id INTEGER,
ADD COLUMN IF NOT EXISTS expense_clearing_items JSONB;

-- 2. Update request_type constraint to include expense-clearing
ALTER TABLE welfare_requests DROP CONSTRAINT IF EXISTS welfare_requests_request_type_check;

ALTER TABLE welfare_requests 
ADD CONSTRAINT welfare_requests_request_type_check 
CHECK (request_type IN (
    'wedding', 
    'training', 
    'childbirth', 
    'funeral', 
    'glasses', 
    'dental', 
    'fitness', 
    'medical', 
    'internal_training', 
    'advance',
    'expense-clearing'
));

-- 3. Ensure advance payment columns exist
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS advance_department VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_district VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_activity_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_activity_other TEXT,
ADD COLUMN IF NOT EXISTS advance_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_participants INTEGER,
ADD COLUMN IF NOT EXISTS advance_dealer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_subdealer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_amphur VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_province VARCHAR(255),
ADD COLUMN IF NOT EXISTS advance_event_date DATE,
ADD COLUMN IF NOT EXISTS advance_expense_items JSONB;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_welfare_requests_expense_clearing 
ON welfare_requests(request_type) WHERE request_type = 'expense-clearing';

CREATE INDEX IF NOT EXISTS idx_welfare_requests_original_advance 
ON welfare_requests(original_advance_request_id);

-- 5. Test the setup
SELECT 'Setup completed successfully' as status;
```

### 2. Verify Database Schema
After running the SQL, check if these columns exist:
- `original_advance_request_id`
- `expense_clearing_items`
- All `advance_*` columns

### 3. Test Form Submission
Try submitting the expense clearing form again after running the SQL.

## Common Issues:

1. **Missing Columns**: Database doesn't have the new columns
2. **Constraint Error**: `request_type` constraint doesn't allow 'expense-clearing'
3. **Data Type Mismatch**: JSON fields not properly formatted

## Debug Data Structure:
The form sends this data structure:
```javascript
{
  type: 'expense-clearing',
  originalAdvanceRequestId: number,
  expenseClearingItems: [
    {
      name: string,
      taxRate: number,
      requestAmount: number,
      usedAmount: number,
      tax: number,
      vat: number,
      refund: number
    }
  ],
  // ... other advance payment fields
}
```

## Next Steps:
1. Run the SQL migration above
2. Test the form submission
3. Check browser network tab for detailed error message
4. If still failing, check Supabase logs for specific error details