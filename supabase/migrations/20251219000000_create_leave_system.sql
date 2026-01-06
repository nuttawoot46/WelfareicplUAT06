-- Create Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#add8e6',
  max_days_per_year INTEGER DEFAULT NULL,
  is_paid BOOLEAN DEFAULT true,
  requires_attachment BOOLEAN DEFAULT false,
  min_days_in_advance INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  year INTEGER NOT NULL,
  location TEXT DEFAULT 'All', -- 'All', 'Office', 'Factory'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Leave Balances Table (per employee per year)
CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES "Employee"(id) ON DELETE CASCADE,
  leave_type_id INTEGER REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_minutes DECIMAL(5,2) NOT NULL DEFAULT 0,
  remaining_days DECIMAL(5,2) GENERATED ALWAYS AS (total_days - used_days) STORED,
  carry_over_days DECIMAL(5,2) DEFAULT 0,
  carry_over_expiry DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Create Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES "Employee"(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  employee_position TEXT,
  employee_team TEXT,
  leave_type_id INTEGER REFERENCES leave_types(id),
  leave_type_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME DEFAULT '08:30:00',
  end_time TIME DEFAULT '17:30:00',
  is_half_day BOOLEAN DEFAULT false,
  half_day_period TEXT, -- 'morning' or 'afternoon'
  total_days DECIMAL(5,2) NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0,
  total_minutes DECIMAL(5,2) DEFAULT 0,
  reason TEXT,
  attachment_urls JSONB DEFAULT '[]',

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending_manager',

  -- Manager approval
  manager_id INTEGER REFERENCES "Employee"(id),
  manager_name TEXT,
  manager_approval_status TEXT,
  manager_approval_date TIMESTAMP WITH TIME ZONE,
  manager_signature TEXT,
  manager_comment TEXT,

  -- HR approval
  hr_approver_id INTEGER REFERENCES "Employee"(id),
  hr_approver_name TEXT,
  hr_approval_status TEXT,
  hr_approval_date TIMESTAMP WITH TIME ZONE,
  hr_signature TEXT,
  hr_comment TEXT,

  -- User signature
  user_signature TEXT,

  -- PDF storage
  pdf_url TEXT,
  pdf_request_manager TEXT,
  pdf_request_hr TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_types
CREATE POLICY "Anyone can read leave types"
  ON leave_types FOR SELECT USING (true);

CREATE POLICY "Only admins can manage leave types"
  ON leave_types FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin', 'hr')
    )
  );

-- RLS Policies for holidays
CREATE POLICY "Anyone can read holidays"
  ON holidays FOR SELECT USING (true);

CREATE POLICY "Only admins can manage holidays"
  ON holidays FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin', 'hr')
    )
  );

-- RLS Policies for leave_balances
CREATE POLICY "Employees can read own leave balances"
  ON leave_balances FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".id = leave_balances.employee_id
      AND "Employee".auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "HR and admins can read all leave balances"
  ON leave_balances FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin', 'hr', 'manager')
    )
  );

CREATE POLICY "HR and admins can manage leave balances"
  ON leave_balances FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin', 'hr')
    )
  );

-- RLS Policies for leave_requests
CREATE POLICY "Employees can read own leave requests"
  ON leave_requests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".id = leave_requests.employee_id
      AND "Employee".auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "Managers can read team leave requests"
  ON leave_requests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".id = leave_requests.manager_id
      AND "Employee".auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "HR and admins can read all leave requests"
  ON leave_requests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin', 'hr')
    )
  );

CREATE POLICY "Employees can create own leave requests"
  ON leave_requests FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".id = leave_requests.employee_id
      AND "Employee".auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "Managers can update team leave requests"
  ON leave_requests FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".id = leave_requests.manager_id
      AND "Employee".auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "HR and admins can update all leave requests"
  ON leave_requests FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."Employee"
      WHERE "Employee".auth_uid = auth.uid()::text
      AND "Employee"."Role" IN ('admin', 'superadmin', 'hr')
    )
  );

-- Insert default leave types (based on HTML analysis)
INSERT INTO leave_types (name_en, name_th, color, max_days_per_year, is_paid, requires_attachment) VALUES
  ('Annual Leave', 'ลาพักร้อน', '#add8e6', 8, true, false),
  ('Business Leave', 'ลากิจ', '#90EE90', 3, true, false),
  ('Sick Leave', 'ลาป่วย', '#DDA0DD', 30, true, true),
  ('Ordination Leave', 'ลาอุปสมบท/ประกอบพิธีฮัจน์', '#FFD700', 15, true, true),
  ('Leave Without Pay', 'ลาไม่รับค่าจ้าง', '#FF6B6B', 5, false, false),
  ('Sterilization Leave', 'ลาเพื่อการทำหมัน', '#D2691E', 0, true, true),
  ('Wedding Leave', 'ลาเพื่อการสมรส', '#FFB6C1', 2, true, true),
  ('Training Leave', 'ลาเพื่อการฝึกอบรม', '#87CEEB', 30, true, true),
  ('Military Leave', 'ลาไปรับราชการ', '#32CD32', 60, true, true),
  ('Maternity Leave', 'ลาคลอดบุตร', '#FFC0CB', 98, true, true)
ON CONFLICT DO NOTHING;

-- Insert 2025 holidays (based on HTML analysis - วันหยุดประจำปี 2568)
INSERT INTO holidays (date, name_en, name_th, year, location) VALUES
  ('2025-01-01', 'New Year''s Day', 'วันขึ้นปีใหม่', 2025, 'All'),
  ('2025-01-02', 'Special Holiday', 'วันหยุดพิเศษ', 2025, 'All'),
  ('2025-02-12', 'Makha Bucha Day', 'วันมาฆบูชา', 2025, 'All'),
  ('2025-04-07', 'Chakri Memorial Day (Substitute)', 'ชดเชยวันจักรี', 2025, 'All'),
  ('2025-04-14', 'Songkran Festival', 'วันสงกรานต์', 2025, 'All'),
  ('2025-04-15', 'Songkran Festival', 'วันสงกรานต์', 2025, 'All'),
  ('2025-04-16', 'Songkran Festival (Substitute)', 'ชดเชยวันสงกรานต์', 2025, 'All'),
  ('2025-05-01', 'National Labour Day', 'วันแรงงานแห่งชาติ', 2025, 'All'),
  ('2025-05-05', 'Coronation Day (Substitute)', 'ชดเชยวันฉัตรมงคล', 2025, 'All'),
  ('2025-06-03', 'H.M. Queen Suthida''s Birthday', 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดาพัชรสุธาพิมลลักษณ พระบรมราชินี', 2025, 'All'),
  ('2025-07-28', 'H.M. King''s Birthday', 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว', 2025, 'All'),
  ('2025-08-12', 'Mother''s Day', 'วันแม่แห่งชาติ', 2025, 'All'),
  ('2025-10-13', 'King Bhumibol Memorial Day', 'วันนวมินทรมหาราช', 2025, 'All'),
  ('2025-10-23', 'Chulalongkorn Day', 'วันปิยมหาราช', 2025, 'All'),
  ('2025-12-05', 'Father''s Day', 'วันพ่อแห่งชาติ', 2025, 'All'),
  ('2025-12-31', 'New Year''s Eve', 'วันสิ้นปี', 2025, 'All')
ON CONFLICT DO NOTHING;

-- Create function to calculate working days between dates
CREATE OR REPLACE FUNCTION calculate_working_days(p_start_date DATE, p_end_date DATE, location_filter TEXT DEFAULT 'All')
RETURNS INTEGER AS $$
DECLARE
  working_days INTEGER := 0;
  check_date DATE := p_start_date;
BEGIN
  WHILE check_date <= p_end_date LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM check_date) NOT IN (0, 6) THEN
      -- Check if not a holiday
      IF NOT EXISTS (
        SELECT 1 FROM holidays
        WHERE holidays.date = check_date
        AND holidays.is_active = true
        AND (holidays.location = 'All' OR holidays.location = location_filter)
      ) THEN
        working_days := working_days + 1;
      END IF;
    END IF;
    check_date := check_date + INTERVAL '1 day';
  END LOOP;
  RETURN working_days;
END;
$$ LANGUAGE plpgsql;

-- Create function to update leave balance when request is approved
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to 'completed' (fully approved)
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE leave_balances
    SET
      used_days = used_days + NEW.total_days,
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;

  -- If request is rejected, don't update balance
  -- If request was approved but now rejected, revert the balance
  IF (NEW.status LIKE 'rejected_%' AND OLD.status = 'completed') THEN
    UPDATE leave_balances
    SET
      used_days = used_days - OLD.total_days,
      updated_at = NOW()
    WHERE employee_id = OLD.employee_id
      AND leave_type_id = OLD.leave_type_id
      AND year = EXTRACT(YEAR FROM OLD.start_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leave balance updates
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leave_requests;
CREATE TRIGGER trigger_update_leave_balance
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
