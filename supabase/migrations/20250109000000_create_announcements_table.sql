-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('system', 'welfare', 'training', 'general')),
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_announcements_priority ON announcements(priority);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read active announcements
CREATE POLICY "Allow authenticated users to read active announcements" ON announcements
  FOR SELECT TO authenticated
  USING (is_active = true AND (start_date IS NULL OR start_date <= CURRENT_DATE) AND (end_date IS NULL OR end_date >= CURRENT_DATE));

-- Allow admin users to manage announcements
CREATE POLICY "Allow admin users to manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Employee" 
      WHERE "Employee"."email_user" = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND LOWER("Employee"."Role") IN ('admin', 'superadmin')
    )
  );

-- Insert sample data
INSERT INTO announcements (title, content, priority, type, is_active, start_date, end_date) VALUES
('ประกาศปรับปรุงระบบสวัสดิการ', 'ระบบจะมีการปรับปรุงในวันที่ 15 มกราคม 2568 เวลา 18:00-22:00 น.', 'high', 'system', true, '2025-01-10', '2025-01-15'),
('เปิดรับสมัครสวัสดิการค่าเล่าเรียนบุตร ปี 2568', 'เปิดรับสมัครตั้งแต่วันที่ 1-31 มกราคม 2568', 'medium', 'welfare', true, '2025-01-05', '2025-01-31'),
('การอบรมภายในประจำเดือนกุมภาพันธ์', 'หัวข้อ: การพัฒนาทักษะการทำงานเป็นทีม วันที่ 20 กุมภาพันธ์ 2568', 'low', 'training', true, '2025-01-08', '2025-02-20');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON announcements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();