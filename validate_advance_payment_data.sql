-- Validation queries for advance payment data
-- Run these to check data integrity after adding columns

-- Check if all columns were added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
  AND column_name LIKE 'advance_%'
ORDER BY column_name;

-- Check existing advance payment records
SELECT 
  id,
  request_type,
  type,
  employee_name,
  amount,
  advance_daily_rate,
  advance_total_days,
  advance_activity_type,
  advance_urgency_level,
  created_at
FROM welfare_requests 
WHERE request_type = 'advance' OR type = 'advance'
ORDER BY created_at DESC
LIMIT 10;

-- Check for any NULL values in critical advance fields
SELECT 
  COUNT(*) as total_advance_requests,
  COUNT(advance_daily_rate) as has_daily_rate,
  COUNT(advance_total_days) as has_total_days,
  COUNT(advance_activity_type) as has_activity_type,
  COUNT(employee_name) as has_employee_name
FROM welfare_requests 
WHERE request_type = 'advance' OR type = 'advance';

-- Check signature columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
  AND column_name LIKE '%signature%'
ORDER BY column_name;

-- Check PDF storage columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
  AND column_name LIKE 'pdf_%'
ORDER BY column_name;

-- Sample query to test data retrieval for PDF generation
SELECT 
  id,
  employee_id,
  employee_name,
  department_user,
  department_request,
  amount,
  details,
  advance_department,
  advance_district,
  advance_activity_type,
  advance_activity_other,
  advance_province,
  advance_total_days,
  advance_daily_rate,
  advance_accommodation_cost,
  advance_transportation_cost,
  advance_meal_allowance,
  advance_other_expenses,
  advance_project_name,
  advance_project_location,
  advance_expected_return_date,
  advance_urgency_level,
  advance_approval_deadline,
  venue,
  start_date,
  total_participants,
  user_signature,
  manager_signature,
  hr_signature,
  manager_approver_name,
  manager_approved_at,
  hr_approver_name,
  hr_approved_at,
  created_at,
  updated_at
FROM welfare_requests 
WHERE request_type = 'advance' OR type = 'advance'
ORDER BY created_at DESC
LIMIT 5;