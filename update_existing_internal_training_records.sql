-- Update existing internal training records to populate new detailed tax columns
-- This script will update records where the detailed tax columns are null or 0
-- but the main tax columns have values

UPDATE welfare_requests 
SET 
  instructor_fee_withholding = COALESCE(instructor_fee_withholding, 0),
  instructor_fee_vat = COALESCE(instructor_fee_vat, 0),
  instructor_fee_total = COALESCE(instructor_fee_total, instructor_fee),
  room_food_beverage_withholding = COALESCE(room_food_beverage_withholding, 0),
  room_food_beverage_vat = COALESCE(room_food_beverage_vat, 0),
  room_food_beverage_total = COALESCE(room_food_beverage_total, room_food_beverage),
  other_expenses_withholding = COALESCE(other_expenses_withholding, 0),
  other_expenses_vat = COALESCE(other_expenses_vat, 0),
  other_expenses_total = COALESCE(other_expenses_total, other_expenses)
WHERE request_type = 'internal_training'
  AND (
    instructor_fee_withholding IS NULL OR
    instructor_fee_vat IS NULL OR
    instructor_fee_total IS NULL OR
    room_food_beverage_withholding IS NULL OR
    room_food_beverage_vat IS NULL OR
    room_food_beverage_total IS NULL OR
    other_expenses_withholding IS NULL OR
    other_expenses_vat IS NULL OR
    other_expenses_total IS NULL
  );

-- Verify the update
SELECT 
  id,
  course_name,
  instructor_fee,
  instructor_fee_withholding,
  instructor_fee_vat,
  instructor_fee_total,
  room_food_beverage,
  room_food_beverage_withholding,
  room_food_beverage_vat,
  room_food_beverage_total,
  other_expenses,
  other_expenses_withholding,
  other_expenses_vat,
  other_expenses_total,
  withholding_tax,
  vat,
  total_amount
FROM welfare_requests 
WHERE request_type = 'internal_training'
ORDER BY created_at DESC
LIMIT 10;