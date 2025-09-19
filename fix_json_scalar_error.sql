-- Fix JSON scalar error for expense clearing

-- 1. Check the trigger function that's causing the issue
SELECT prosrc FROM pg_proc WHERE proname = 'update_expense_clearing_amount';

-- 2. Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS trigger_update_expense_clearing_amount ON welfare_requests;

-- 3. Test insert without the trigger
INSERT INTO welfare_requests (
    employee_id,
    employee_name,
    request_type,
    status,
    amount,
    created_at,
    expense_clearing_items
) VALUES (
    79,
    'ณัฐวุฒิ สุมานิก',
    'expense-clearing',
    'pending_manager',
    -10000.00,
    NOW(),
    '[{"name": "ค่าอาหารและเครื่องดื่ม","taxRate": 0,"requestAmount": 10000,"usedAmount": 20000,"tax": 0,"vat": 0,"refund": -10000}]'::jsonb
) RETURNING id, request_type, status, amount;

-- 4. Clean up test data
DELETE FROM welfare_requests 
WHERE employee_name = 'ณัฐวุฒิ สุมานิก' 
AND request_type = 'expense-clearing' 
AND amount = -10000.00;

-- 5. Create a safer trigger function
CREATE OR REPLACE FUNCTION update_expense_clearing_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for expense clearing requests
    IF NEW.request_type = 'expense-clearing' AND NEW.expense_clearing_items IS NOT NULL THEN
        -- Check if expense_clearing_items is a valid JSON array
        IF jsonb_typeof(NEW.expense_clearing_items) = 'array' THEN
            -- Calculate refund amount from expense clearing items
            NEW.amount := (
                SELECT COALESCE(SUM(
                    COALESCE((item->>'requestAmount')::numeric, 0) - 
                    COALESCE((item->>'usedAmount')::numeric, 0)
                ), 0)
                FROM jsonb_array_elements(NEW.expense_clearing_items) AS item
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Recreate the trigger
CREATE TRIGGER trigger_update_expense_clearing_amount
    BEFORE INSERT OR UPDATE ON welfare_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_clearing_amount();

-- 7. Test again with the new trigger
INSERT INTO welfare_requests (
    employee_id,
    employee_name,
    request_type,
    status,
    amount,
    created_at,
    expense_clearing_items
) VALUES (
    79,
    'ณัฐวุฒิ สุมานิก',
    'expense-clearing',
    'pending_manager',
    0.00,
    NOW(),
    '[{"name": "ค่าอาหารและเครื่องดื่ม","taxRate": 0,"requestAmount": 10000,"usedAmount": 20000,"tax": 0,"vat": 0,"refund": -10000}]'::jsonb
) RETURNING id, request_type, status, amount;

-- 8. Clean up test data
DELETE FROM welfare_requests 
WHERE employee_name = 'ณัฐวุฒิ สุมานิก' 
AND request_type = 'expense-clearing';

SELECT 'Trigger function updated successfully' as status;