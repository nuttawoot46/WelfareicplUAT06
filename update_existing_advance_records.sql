-- Update existing advance payment records with default values
-- Run this after adding the new columns

-- Update existing advance payment requests with default values where needed
UPDATE welfare_requests 
SET 
  advance_daily_rate = COALESCE(advance_daily_rate, 80.00),
  advance_total_days = COALESCE(advance_total_days, 1),
  advance_accommodation_cost = COALESCE(advance_accommodation_cost, 0.00),
  advance_transportation_cost = COALESCE(advance_transportation_cost, 0.00),
  advance_meal_allowance = COALESCE(advance_meal_allowance, 0.00),
  advance_other_expenses = COALESCE(advance_other_expenses, 0.00),
  total_participants = COALESCE(total_participants, 0)
WHERE request_type = 'advance' OR type = 'advance';

-- Set default activity type for existing advance requests without one
UPDATE welfare_requests 
SET advance_activity_type = 'other'
WHERE (request_type = 'advance' OR type = 'advance') 
  AND advance_activity_type IS NULL;

-- Set default urgency level for existing advance requests
UPDATE welfare_requests 
SET advance_urgency_level = 'medium'
WHERE (request_type = 'advance' OR type = 'advance') 
  AND advance_urgency_level IS NULL;

-- Update employee_name from existing data if available
UPDATE welfare_requests 
SET employee_name = COALESCE(employee_name, userName, user_name)
WHERE employee_name IS NULL;

-- Update department fields from existing data
UPDATE welfare_requests 
SET 
  department_user = COALESCE(department_user, userDepartment, user_department),
  department_request = COALESCE(department_request, userDepartment, user_department)
WHERE department_user IS NULL OR department_request IS NULL;