-- =====================================================
-- Trigger: ส่ง Email แจ้งเตือนเมื่อ welfare_requests status เปลี่ยน
-- =====================================================

-- ต้องเปิดใช้งาน pg_net extension ก่อน
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function สำหรับส่ง email notification
CREATE OR REPLACE FUNCTION notify_welfare_status_change()
RETURNS TRIGGER AS $$
DECLARE
    employee_email TEXT;
    employee_name TEXT;
    edge_function_url TEXT;
    service_role_key TEXT;
BEGIN
    -- ดึงข้อมูลพนักงานจาก Employee table
    SELECT "email_user", "Name"
    INTO employee_email, employee_name
    FROM "Employee"
    WHERE id = NEW.employee_id;

    -- ถ้าไม่พบ email ให้ออกจาก function
    IF employee_email IS NULL THEN
        RAISE NOTICE 'Employee email not found for employee_id: %', NEW.employee_id;
        RETURN NEW;
    END IF;

    -- URL ของ Edge Function (เปลี่ยนเป็น project URL ของคุณ)
    edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-outlook-email';

    -- Service Role Key (ควรเก็บใน vault หรือ secrets)
    service_role_key := 'YOUR_SERVICE_ROLE_KEY';

    -- เรียก Edge Function ผ่าน pg_net
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
            'employee_email', employee_email,
            'employee_name', employee_name,
            'request_type', NEW.request_type,
            'amount', NEW.amount,
            'status', NEW.status,
            'old_status', OLD.status,
            'notes', NEW.manager_notes
        )
    );

    RAISE NOTICE 'Email notification sent to % for status change: % -> %',
        employee_email, OLD.status, NEW.status;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ลบ trigger เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS trigger_notify_welfare_status ON welfare_requests;

-- สร้าง trigger ใหม่ - ทำงานเมื่อ status เปลี่ยน
CREATE TRIGGER trigger_notify_welfare_status
    AFTER UPDATE OF status ON welfare_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_welfare_status_change();

-- ===== OPTIONAL: Trigger สำหรับแจ้งเตือนเมื่อสร้างคำร้องใหม่ =====
CREATE OR REPLACE FUNCTION notify_new_welfare_request()
RETURNS TRIGGER AS $$
DECLARE
    manager_email TEXT;
    manager_name TEXT;
    employee_name TEXT;
    edge_function_url TEXT;
    service_role_key TEXT;
BEGIN
    -- ดึงชื่อพนักงานที่ส่งคำร้อง
    SELECT "Name" INTO employee_name
    FROM "Employee"
    WHERE id = NEW.employee_id;

    -- ดึงข้อมูล manager
    SELECT e."email_user", e."Name"
    INTO manager_email, manager_name
    FROM "Employee" e
    WHERE e.id = NEW.manager_id;

    -- ถ้าไม่พบ manager email ให้ออกจาก function
    IF manager_email IS NULL THEN
        RAISE NOTICE 'Manager email not found for manager_id: %', NEW.manager_id;
        RETURN NEW;
    END IF;

    -- URL ของ Edge Function
    edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-outlook-email';
    service_role_key := 'YOUR_SERVICE_ROLE_KEY';

    -- ส่ง email แจ้ง manager ว่ามีคำร้องใหม่รออนุมัติ
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
            'employee_email', manager_email,
            'employee_name', manager_name,
            'request_type', NEW.request_type,
            'amount', NEW.amount,
            'status', 'new_request',
            'old_status', NULL,
            'notes', 'มีคำร้องใหม่จาก ' || COALESCE(employee_name, 'พนักงาน') || ' รออนุมัติ'
        )
    );

    RAISE NOTICE 'New request notification sent to manager: %', manager_email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger สำหรับคำร้องใหม่ (optional - uncomment ถ้าต้องการใช้)
-- DROP TRIGGER IF EXISTS trigger_notify_new_welfare_request ON welfare_requests;
-- CREATE TRIGGER trigger_notify_new_welfare_request
--     AFTER INSERT ON welfare_requests
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_new_welfare_request();

-- ===== COMMENTS =====
COMMENT ON FUNCTION notify_welfare_status_change() IS
'ส่ง email แจ้งเตือนพนักงานเมื่อ welfare_requests.status เปลี่ยนแปลง
- ใช้ pg_net เรียก Edge Function
- Edge Function ส่ง email ผ่าน Microsoft Graph API (Outlook 365)';
