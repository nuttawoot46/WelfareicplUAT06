-- =====================================================
-- Trigger: อัปเดต Employee budget เมื่อ welfare_requests มีการเปลี่ยนแปลง
-- รองรับทั้ง INSERT (สร้างใหม่) และ UPDATE (แก้ไข)
-- =====================================================

-- Function สำหรับอัปเดต Employee budget
CREATE OR REPLACE FUNCTION update_employee_budget_on_welfare_change()
RETURNS TRIGGER AS $$
DECLARE
    emp_id INTEGER;
    amount_difference NUMERIC;
    welfare_type TEXT;
    -- Variables สำหรับ training (หักเฉพาะส่วนที่พนักงานรับผิดชอบ)
    old_budget_deduction NUMERIC;
    new_budget_deduction NUMERIC;
    training_diff NUMERIC;
BEGIN
    -- ดึง employee_id จาก welfare_requests
    emp_id := COALESCE(NEW.employee_id, OLD.employee_id);

    -- ถ้าไม่พบ employee_id ให้ออกจาก function
    IF emp_id IS NULL THEN
        RAISE NOTICE 'Employee ID not found in welfare_requests';
        RETURN NEW;
    END IF;

    welfare_type := NEW.request_type;

    -- ===== กรณี INSERT (สร้าง request ใหม่) =====
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE 'Processing budget INSERT: employee_id=%, type=%, amount=%',
            emp_id, welfare_type, NEW.amount;

        IF welfare_type = 'training' THEN
            -- สำหรับ training: หักเฉพาะส่วนที่พนักงานรับผิดชอบ
            -- ยอดที่หัก = net_amount - company_payment
            new_budget_deduction := COALESCE(NEW.net_amount, NEW.amount, 0) - COALESCE(NEW.company_payment, 0);

            UPDATE "Employee"
            SET "Budget_Training" = COALESCE("Budget_Training", 0) - new_budget_deduction
            WHERE id = emp_id;

            RAISE NOTICE 'Training INSERT: budget_deduction=% (net_amount=%, company_payment=%)',
                new_budget_deduction, NEW.net_amount, NEW.company_payment;

        ELSIF welfare_type = 'wedding' THEN
            UPDATE "Employee"
            SET budget_wedding = COALESCE(budget_wedding, 0) - COALESCE(NEW.amount, 0)
            WHERE id = emp_id;

        ELSIF welfare_type IN ('dental', 'glasses') THEN
            UPDATE "Employee"
            SET budget_dentalglasses = COALESCE(budget_dentalglasses, 0) - COALESCE(NEW.amount, 0)
            WHERE id = emp_id;

        ELSIF welfare_type = 'fitness' THEN
            UPDATE "Employee"
            SET budget_fitness = COALESCE(budget_fitness, 0) - COALESCE(NEW.amount, 0)
            WHERE id = emp_id;

        ELSIF welfare_type = 'medical' THEN
            UPDATE "Employee"
            SET budget_medical = COALESCE(budget_medical, 0) - COALESCE(NEW.amount, 0)
            WHERE id = emp_id;

        ELSIF welfare_type = 'childbirth' THEN
            UPDATE "Employee"
            SET budget_childbirth = COALESCE(budget_childbirth, 0) - COALESCE(NEW.amount, 0)
            WHERE id = emp_id;

        ELSIF welfare_type = 'funeral' THEN
            UPDATE "Employee"
            SET budget_funeral = COALESCE(budget_funeral, 0) - COALESCE(NEW.amount, 0)
            WHERE id = emp_id;

        ELSE
            RAISE NOTICE 'Welfare type % does not require budget update', welfare_type;
        END IF;

    -- ===== กรณี UPDATE (แก้ไข request) =====
    ELSIF TG_OP = 'UPDATE' THEN
        -- คำนวณผลต่างของจำนวนเงิน (ค่าเก่า - ค่าใหม่)
        -- ถ้าค่าใหม่น้อยกว่าค่าเก่า = คืนเงินเข้า budget (ผลต่างเป็นบวก)
        -- ถ้าค่าใหม่มากกว่าค่าเก่า = หักเงินจาก budget (ผลต่างเป็นลบ)
        amount_difference := COALESCE(OLD.amount, 0) - COALESCE(NEW.amount, 0);

        RAISE NOTICE 'Processing budget UPDATE: employee_id=%, type=%, old_amount=%, new_amount=%, diff=%',
            emp_id, welfare_type, OLD.amount, NEW.amount, amount_difference;

        IF welfare_type = 'training' THEN
            -- สำหรับ training: หักเฉพาะส่วนที่พนักงานรับผิดชอบ (ไม่รวมส่วนที่บริษัทจ่าย)
            -- ยอดที่หัก = net_amount - company_payment
            -- ตัวอย่าง: งบคงเหลือ 9,700 + เบิก 10,000 (ส่วนเกิน 300 = บริษัท 150 + พนักงาน 150)
            -- ยอดที่ควรหักจากงบ = 10,000 - 150 = 9,850 บาท (ไม่รวมส่วนที่บริษัทจ่าย)
            old_budget_deduction := COALESCE(OLD.net_amount, OLD.amount, 0) - COALESCE(OLD.company_payment, 0);
            new_budget_deduction := COALESCE(NEW.net_amount, NEW.amount, 0) - COALESCE(NEW.company_payment, 0);
            training_diff := old_budget_deduction - new_budget_deduction;

            UPDATE "Employee"
            SET "Budget_Training" = COALESCE("Budget_Training", 0) + training_diff
            WHERE id = emp_id;

            RAISE NOTICE 'Training UPDATE: old_deduction=%, new_deduction=%, diff=%',
                old_budget_deduction, new_budget_deduction, training_diff;

        ELSIF welfare_type = 'wedding' THEN
            UPDATE "Employee"
            SET budget_wedding = COALESCE(budget_wedding, 0) + amount_difference
            WHERE id = emp_id;

        ELSIF welfare_type IN ('dental', 'glasses') THEN
            UPDATE "Employee"
            SET budget_dentalglasses = COALESCE(budget_dentalglasses, 0) + amount_difference
            WHERE id = emp_id;

        ELSIF welfare_type = 'fitness' THEN
            UPDATE "Employee"
            SET budget_fitness = COALESCE(budget_fitness, 0) + amount_difference
            WHERE id = emp_id;

        ELSIF welfare_type = 'medical' THEN
            UPDATE "Employee"
            SET budget_medical = COALESCE(budget_medical, 0) + amount_difference
            WHERE id = emp_id;

        ELSIF welfare_type = 'childbirth' THEN
            UPDATE "Employee"
            SET budget_childbirth = COALESCE(budget_childbirth, 0) + amount_difference
            WHERE id = emp_id;

        ELSIF welfare_type = 'funeral' THEN
            UPDATE "Employee"
            SET budget_funeral = COALESCE(budget_funeral, 0) + amount_difference
            WHERE id = emp_id;

        ELSE
            RAISE NOTICE 'Welfare type % does not require budget update', welfare_type;
        END IF;

        RAISE NOTICE 'Budget updated for employee_id=% (type: %, diff: %)', emp_id, welfare_type, amount_difference;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ลบ trigger เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS trigger_update_employee_budget_on_welfare_change ON welfare_requests;
DROP TRIGGER IF EXISTS trigger_insert_employee_budget_on_welfare_create ON welfare_requests;

-- สร้าง trigger สำหรับ INSERT (สร้าง request ใหม่)
CREATE TRIGGER trigger_insert_employee_budget_on_welfare_create
    AFTER INSERT ON welfare_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_budget_on_welfare_change();

-- สร้าง trigger สำหรับ UPDATE (แก้ไข request)
CREATE TRIGGER trigger_update_employee_budget_on_welfare_change
    AFTER UPDATE OF amount, net_amount, company_payment ON welfare_requests
    FOR EACH ROW
    WHEN (
        OLD.amount IS DISTINCT FROM NEW.amount OR
        OLD.net_amount IS DISTINCT FROM NEW.net_amount OR
        OLD.company_payment IS DISTINCT FROM NEW.company_payment
    )
    EXECUTE FUNCTION update_employee_budget_on_welfare_change();

-- ===== COMMENTS =====
COMMENT ON FUNCTION update_employee_budget_on_welfare_change() IS
'อัปเดต Employee budget เมื่อ welfare_requests มีการสร้างใหม่ (INSERT) หรือแก้ไข (UPDATE)

สำหรับ Training:
- หักเฉพาะส่วนที่พนักงานรับผิดชอบ (ไม่รวมส่วนที่บริษัทจ่าย 50%)
- สูตร: budget_deduction = net_amount - company_payment
- ตัวอย่าง: net 10,000 - company 150 = หัก 9,850 บาท

สำหรับประเภทอื่น:
- INSERT: หักเต็มจำนวน amount
- UPDATE: คำนวณผลต่าง OLD.amount - NEW.amount
  - ถ้าผลต่างเป็นบวก (ลดจำนวนเงิน) = คืนเงินเข้า budget
  - ถ้าผลต่างเป็นลบ (เพิ่มจำนวนเงิน) = หักเงินจาก budget';
