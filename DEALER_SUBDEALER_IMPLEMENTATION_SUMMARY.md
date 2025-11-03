# Dealer and Subdealer Implementation Summary

## Overview
Added dealer dropdown and subdealer text field to the Advance Form, replacing the previous checkbox implementation.

## Changes Made

### 1. Database Setup
- **Migration**: `supabase/migrations/20250211000000_create_data_dealer_table.sql`
  - Created `data_dealer` table with columns: `"No."` and `"Name"`
  - Enabled Row Level Security (RLS)
  - Added policies for authenticated users to read dealer data

- **Function**: `supabase/migrations/20250211000001_create_get_dealer_list_function.sql`
  - Created `get_dealer_list()` function to fetch dealer data
  - Returns sorted list by dealer name
  - Granted execute permission to authenticated users

### 2. Frontend Changes
- **File**: `src/components/forms/AdvanceForm.tsx`

#### Added State
```typescript
const [dealerList, setDealerList] = useState<Array<{ No: string; Name: string }>>([]);
```

#### Added Data Fetching
- Fetches dealer list from database on component mount
- Uses `get_dealer_list()` RPC function
- Handles errors gracefully

#### Updated UI
- Replaced checkbox fields with:
  - **ดีลเลอร์**: Dropdown (Select) component populated from `data_dealer` table
  - **ซับดีลเลอร์**: Text input field
- Both fields are optional
- Dealer dropdown includes "ไม่ระบุ" (Not specified) option

### 3. Form Fields
- `advanceDealerName`: Stores selected dealer name from dropdown
- `advanceSubdealerName`: Stores manually entered subdealer text

## Database Schema

```sql
CREATE TABLE public.data_dealer (
  "No." text NULL,
  "Name" text NULL
);
```

## Usage
1. User selects a dealer from the dropdown (optional)
2. User enters subdealer name in text field (optional)
3. Data is saved to `welfare_requests` table in existing columns:
   - `advance_dealer_name`
   - `advance_subdealer_name`

## Setup Instructions

### 1. Run Database Migration
Execute the `run_dealer_migrations.sql` file in your Supabase SQL Editor:
- This will create the `data_dealer` table
- Set up RLS policies
- Create the `get_dealer_list()` function
- Grant necessary permissions

### 2. Populate Dealer Data
Insert your dealer data into the `data_dealer` table:
```sql
INSERT INTO public.data_dealer ("No.", "Name") VALUES
('001', 'Dealer Name 1'),
('002', 'Dealer Name 2');
```

## Testing Checklist
- [ ] Run `run_dealer_migrations.sql` in Supabase SQL Editor
- [ ] Populate `data_dealer` table with actual dealer data
- [ ] Verify dealer dropdown loads data from `data_dealer` table
- [ ] Test dealer selection and form submission
- [ ] Test subdealer text input and form submission
- [ ] Verify data is saved correctly in database
- [ ] Test edit mode loads existing dealer/subdealer values
- [ ] Verify PDF generation includes dealer/subdealer information

## Error Handling
- If the `data_dealer` table doesn't exist, the dropdown will be empty
- If the RPC function fails, it falls back to direct table query
- The form will work even if dealer data is not available (both fields are optional)

## Notes
- The `data_dealer` table should be populated with dealer data before use
- Both fields are optional and can be left empty
- The implementation maintains backward compatibility with existing advance requests
- Uses "none" as placeholder value instead of empty string (Radix UI requirement)
