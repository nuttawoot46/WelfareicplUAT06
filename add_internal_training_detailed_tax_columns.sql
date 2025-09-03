-- Add detailed VAT and withholding tax columns for internal training
-- These columns store VAT and withholding tax amounts for each expense category

ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS instructor_fee_withholding DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructor_fee_vat DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructor_fee_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS room_food_beverage_withholding DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS room_food_beverage_vat DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS room_food_beverage_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_expenses_withholding DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_expenses_vat DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_expenses_total DECIMAL(10,2) DEFAULT 0;

-- Add comments to document the new columns
COMMENT ON COLUMN welfare_requests.instructor_fee_withholding IS 'Withholding tax (3%) for instructor fee';
COMMENT ON COLUMN welfare_requests.instructor_fee_vat IS 'VAT (7%) for instructor fee';
COMMENT ON COLUMN welfare_requests.instructor_fee_total IS 'Total instructor fee including VAT minus withholding tax';
COMMENT ON COLUMN welfare_requests.room_food_beverage_withholding IS 'Withholding tax (3%) for room, food and beverage';
COMMENT ON COLUMN welfare_requests.room_food_beverage_vat IS 'VAT (7%) for room, food and beverage';
COMMENT ON COLUMN welfare_requests.room_food_beverage_total IS 'Total room, food and beverage cost including VAT minus withholding tax';
COMMENT ON COLUMN welfare_requests.other_expenses_withholding IS 'Withholding tax (3%) for other expenses';
COMMENT ON COLUMN welfare_requests.other_expenses_vat IS 'VAT (7%) for other expenses';
COMMENT ON COLUMN welfare_requests.other_expenses_total IS 'Total other expenses including VAT minus withholding tax';

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_welfare_requests_instructor_fee_total ON welfare_requests(instructor_fee_total);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_room_food_beverage_total ON welfare_requests(room_food_beverage_total);
CREATE INDEX IF NOT EXISTS idx_welfare_requests_other_expenses_total ON welfare_requests(other_expenses_total);