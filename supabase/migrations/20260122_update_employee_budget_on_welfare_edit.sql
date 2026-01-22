-- =====================================================
-- Trigger: อัปเดต Employee budget เมื่อ welfare_requests มีการเปลี่ยนแปลง
-- =====================================================

-- Function สำหรับอัปเดต Employee budget
CREATE OR REPLACE FUNCTION update_employee_budget_on_welfare_change()
RETURNS TRIGGER AS $$
DECLARE
    emp_id INTEGER;
    amount_difference NUMERIC;
    welfare_type TEXT;
BEGIN
    -- ดึง employee_id จาก welfare_requests
    emp_id := COALESCE(NEW.employee_id, OLD.employee_id);

    -- ถ้าไม่พบ employee_id ให้ออกจาก function
    IF emp_id IS NULL THEN
        RAISE NOTICE 'Employee ID not found in welfare_requests';
        RETURN NEW;
    END IF;

    -- ===== กรณี UPDATE =====
    IF TG_OP = 'UPDATE' THEN
        -- คำนวณผลต่างของจำนวนเงิน (ค่าเก่า - ค่าใหม่)
        -- ถ้าค่าใหม่น้อยกว่าค่าเก่า = คืนเงินเข้า budget (ผลต่างเป็นบวก)
        -- ถ้าค่าใหม่มากกว่าค่าเก่า = หักเงินจาก budget (ผลต่างเป็นลบ)
        amount_difference := COALESCE(OLD.amount, 0) - COALESCE(NEW.amount, 0);
        welfare_type := NEW.request_type;

        RAISE NOTICE 'Processing budget update: employee_id=%, type=%, old_amount=%, new_amount=%, diff=%',
            emp_id, welfare_type, OLD.amount, NEW.amount, amount_difference;

        -- อัปเดต budget ตามประเภทสวัสดิการ
        CASE welfare_type
            WHEN 'wedding' THEN
                UPDATE "Employee"
                SET budget_wedding = COALESCE(budget_wedding, 0) + amount_difference
                WHERE id = emp_id;

            WHEN 'training' THEN
                UPDATE "Employee"
                SET "Budget_Training" = COALESCE("Budget_Training", 0) + amount_difference
                WHERE id = emp_id;

            WHEN 'dental', 'glasses' THEN
                -- dental และ glasses ใช้ budget ร่วมกัน
                UPDATE "Employee"
                SET budget_dentalglasses = COALESCE(budget_dentalglasses, 0) + amount_difference
                WHERE id = emp_id;

            WHEN 'fitness' THEN
                UPDATE "Employee"
                SET budget_fitness = COALESCE(budget_fitness, 0) + amount_difference
                WHERE id = emp_id;

            WHEN 'medical' THEN
                UPDATE "Employee"
                SET budget_medical = COALESCE(budget_medical, 0) + amount_difference
                WHERE id = emp_id;

            WHEN 'childbirth' THEN
                UPDATE "Employee"
                SET budget_childbirth = COALESCE(budget_childbirth, 0) + amount_difference
                WHERE id = emp_id;

            WHEN 'funeral' THEN
                UPDATE "Employee"
                SET budget_funeral = COALESCE(budget_funeral, 0) + amount_difference
                WHERE id = emp_id;

            ELSE
                -- ประเภทอื่นๆ ที่ไม่ต้องอัปเดต budget (advance, expense_clearing, etc.)
                RAISE NOTICE 'Welfare type % does not require budget update', welfare_type;
        END CASE;

        RAISE NOTICE 'Budget updated for employee_id=% (type: %, diff: %)', emp_id, welfare_type, amount_difference;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ลบ trigger เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS trigger_update_employee_budget_on_welfare_change ON welfare_requests;

-- สร้าง trigger ใหม่
CREATE TRIGGER trigger_update_employee_budget_on_welfare_change
    AFTER UPDATE OF amount ON welfare_requests
    FOR EACH ROW
    WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
    EXECUTE FUNCTION update_employee_budget_on_welfare_change();

-- ===== COMMENTS =====
COMMENT ON FUNCTION update_employee_budget_on_welfare_change() IS
'อัปเดต Employee budget เมื่อ welfare_requests.amount มีการเปลี่ยนแปลง
- ใช้ employee_id จาก welfare_requests เพื่อ link กับ Employee.id
- คำนวณผลต่าง: OLD.amount - NEW.amount
- ถ้าผลต่างเป็นบวก (ลดจำนวนเงิน) = คืนเงินเข้า budget
- ถ้าผลต่างเป็นลบ (เพิ่มจำนวนเงิน) = หักเงินจาก budget';
