-- Create sales_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales_data (
  id SERIAL PRIMARY KEY,
  department VARCHAR(10) NOT NULL,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(10) NOT NULL,
  manager_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sales data
INSERT INTO sales_data (department, code, name, position, manager_name) VALUES
-- DIS Department - Manager: แวน จันทร์ทอง
('DIS', 'A01', 'วรกานต์ เอิกเกริก', 'ME', 'แวน จันทร์ทอง'),
('DIS', 'A02', 'กมล ยศอิ', 'ME', 'แวน จันทร์ทอง'),
('DIS', 'A02', 'จิติมา เรืองเพชร', 'MR', 'แวน จันทร์ทอง'),
('DIS', 'A03', 'ปทิตตา จันทร์กลิ่น', 'ME', 'แวน จันทร์ทอง'),
('DIS', 'A03', 'พิรยา สินสุวรรณ์', 'MR', 'แวน จันทร์ทอง'),
('DIS', 'A04', 'พุทธิตา พงษ์ไผ่ขำ', 'ME', 'แวน จันทร์ทอง'),
('DIS', 'A04', 'จิรภิญญา สามพ่วงบุญ', 'MR', 'แวน จันทร์ทอง'),
('DIS', 'A04', 'ปนัดภร ไชยสุพัฒน์', 'MR', 'แวน จันทร์ทอง'),
('DIS', 'A05', 'อชิรญาณ์ เวฬวนารักษ์', 'ME', 'แวน จันทร์ทอง'),
('DIS', 'A05', 'ตามตะวัน โพธิ์ปั้น', 'MR', 'แวน จันทร์ทอง'),
('DIS', 'A06', 'ดุสิตา จำปาสัก', 'ME', 'แวน จันทร์ทอง'),
('DIS', 'A06', 'สุกัญญา ชูประสูติ', 'MR', 'แวน จันทร์ทอง'),
('DIS', 'A06', 'อัฐภิญญา พิมรินทร์', 'MR', 'แวน จันทร์ทอง'),

-- DIS Department - Manager: สันติ ผลคำสุข
('DIS', 'A07', 'วิลาสินี ขวัญเมือง', 'ME', 'สันติ ผลคำสุข'),
('DIS', 'A07', 'ชนาภัทร พลูหนัง', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A07', 'ภานุพงษ์ ตาลบำรุง', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A07', 'ประภัศพรรณ สอนราช', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A08', 'ธีระ เทพราช', 'ME', 'สันติ ผลคำสุข'),
('DIS', 'A08', 'วัชรพงศ์ พิลุณร์', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A08', 'ณัฐวัฒน์ ระดาไสย', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A09', 'อดิศักดิ์ จิราสุคนธ์', 'ME', 'สันติ ผลคำสุข'),
('DIS', 'A09', 'สุชาดา ราชคม', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A09', 'ออมสิน เนาว์ประเสริฐ', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A09', 'กัญญารัตน์ อยู่สุข', 'MR', 'สันติ ผลคำสุข'),
('DIS', 'A10', 'ดุสิต ว่องกสิกรรม', 'ME', 'สันติ ผลคำสุข'),
('DIS', 'A10', 'พรชิตา บุญแก้ว', 'MR', 'สันติ ผลคำสุข'),

-- WHS Department - Manager: ทรงกรด ปานแก้ว
('WHS', 'WHS-1', 'รัตนพนธ์ แก้วจักร', 'WHS', 'ทรงกรด ปานแก้ว'),
('WHS', 'WHS-2', 'เจษฎา พวงแก้ว', 'WHS', 'ทรงกรด ปานแก้ว'),
('WHS', 'WHS-3', 'พลกฤต วงค์ษาคม', 'WHS', 'ทรงกรด ปานแก้ว'),
('WHS', 'WHS-4', 'ครรชิต ลอยขจร', 'WHS', 'ทรงกรด ปานแก้ว'),

-- PD Department - Manager: ทรงกรด ปานแก้ว
('PD', 'PD', 'กนกนาฎ เชาวนพงษ์', 'PD', 'ทรงกรด ปานแก้ว'),
('PD', 'PD', 'ณัฐพล แสงธรรมวุฒิ', 'PD', 'ทรงกรด ปานแก้ว'),
('PD', 'PD', 'ปิยะ ไชยเกิด', 'PD', 'ทรงกรด ปานแก้ว'),
('PD', 'PD', 'อดิศักดิ์ นัดกระโทก', 'PD', 'ทรงกรด ปานแก้ว'),
('PD', 'PD', 'เพ็ญพิชชา หวังการะแน', 'PD', 'ทรงกรด ปานแก้ว'),
('PD', 'PD', 'สุกัญญา กำมา', 'PD', 'ทรงกรด ปานแก้ว'),

-- COR Department - Manager: ทรงกรด ปานแก้ว
('COR', 'COR1', 'สุภมาส วัฒนทัพ', 'COR', 'ทรงกรด ปานแก้ว'),
('COR', 'COR2', 'พิมพ์สิริ ดาทอง', 'COR', 'ทรงกรด ปานแก้ว'),

-- PBH Department - Manager: วิกรานต์ แซ่ตัน
('PBH', 'PH1', 'นิติกร ดอนจันดา', 'PBH', 'วิกรานต์ แซ่ตัน'),
('PBH', 'PH2', 'นัชชา ภารนาถ', 'PBH', 'วิกรานต์ แซ่ตัน');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_data_department ON sales_data(department);
CREATE INDEX IF NOT EXISTS idx_sales_data_code ON sales_data(code);
CREATE INDEX IF NOT EXISTS idx_sales_data_manager ON sales_data(manager_name);

-- Query to verify the data
SELECT 
  department,
  COUNT(*) as total_employees,
  manager_name
FROM sales_data
GROUP BY department, manager_name
ORDER BY department, manager_name;
