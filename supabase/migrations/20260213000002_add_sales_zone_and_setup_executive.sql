-- ====================================================================
-- เพิ่ม sales_zone (เขต) ใน Employee table
-- และตั้งค่า executive_id, manager_id ตามข้อมูลฝ่ายขาย
-- ====================================================================

-- Step 1: เพิ่ม column sales_zone ใน Employee table
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS sales_zone TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS sales_position TEXT;

-- ====================================================================
-- Step 2: อัปเดต sales_zone + sales_position ตามชื่อพนักงาน
-- ====================================================================

-- === เขต A01 (Manager: แวน จันทร์ทอง) ===
UPDATE "Employee" SET sales_zone = 'A01', sales_position = 'ME' WHERE "Name" = 'กมล ยศอิ';
UPDATE "Employee" SET sales_zone = 'A01', sales_position = 'MR' WHERE "Name" = 'จิติมา เรืองเพชร';
-- A01 New MR - ยังไม่มีข้อมูลชื่อจริง

-- === เขต A02 (Manager: แวน จันทร์ทอง) ===
UPDATE "Employee" SET sales_zone = 'A02', sales_position = 'ME' WHERE "Name" = 'ปทิตตา จันทร์กลิ่น';
UPDATE "Employee" SET sales_zone = 'A02', sales_position = 'MR' WHERE "Name" = 'ศิริพร มณีสวัสดิ์';

-- === เขต A03 (Manager: แวน จันทร์ทอง) ===
UPDATE "Employee" SET sales_zone = 'A03', sales_position = 'ME' WHERE "Name" = 'ดุสิตา จำปาสัก';
UPDATE "Employee" SET sales_zone = 'A03', sales_position = 'MR' WHERE "Name" = 'จิรภิญญา สามพ่วงบุญ';
UPDATE "Employee" SET sales_zone = 'A03', sales_position = 'MR' WHERE "Name" = 'ปนัดภร ไชยสุพัฒน์';

-- === เขต A04 (Manager: แวน จันทร์ทอง) ===
UPDATE "Employee" SET sales_zone = 'A04', sales_position = 'ME' WHERE "Name" = 'อชิรญาณ์ เวฬุวนารักษ์';
UPDATE "Employee" SET sales_zone = 'A04', sales_position = 'MR' WHERE "Name" = 'พุทธิตา พงษ์ไผ่ขำ';

-- === เขต A05 (Manager: แวน จันทร์ทอง) ===
UPDATE "Employee" SET sales_zone = 'A05', sales_position = 'ME' WHERE "Name" = 'สุกัญญา ชูประสูติ';
UPDATE "Employee" SET sales_zone = 'A05', sales_position = 'MR' WHERE "Name" = 'อัฐภิญญา พิมรินทร์';
UPDATE "Employee" SET sales_zone = 'A05', sales_position = 'MR' WHERE "Name" = 'ตามตะวัน โพธิ์ปั้น';

-- === เขต A06 (Manager: สันติ ผลคำสุข) ===
UPDATE "Employee" SET sales_zone = 'A06', sales_position = 'ME' WHERE "Name" = 'วิลาสินี ขวัญเมือง';
UPDATE "Employee" SET sales_zone = 'A06', sales_position = 'MR' WHERE "Name" = 'ประภัศพรรณ สอนราช';
UPDATE "Employee" SET sales_zone = 'A06', sales_position = 'MR' WHERE "Name" = 'ณัฐวัฒน์ ระดาไสย';

-- === เขต A07 (Manager: สันติ ผลคำสุข) ===
UPDATE "Employee" SET sales_zone = 'A07', sales_position = 'ME' WHERE "Name" = 'ชนาภัทร พลูหนัง';
UPDATE "Employee" SET sales_zone = 'A07', sales_position = 'MR' WHERE "Name" = 'ศตวรรษ วังสระปราบ';

-- === เขต A08 (Manager: สันติ ผลคำสุข) ===
UPDATE "Employee" SET sales_zone = 'A08', sales_position = 'ME' WHERE "Name" = 'ธีระ เทพราช';
UPDATE "Employee" SET sales_zone = 'A08', sales_position = 'MR' WHERE "Name" = 'ภาณุพงษ์ ตาลบำรุง';
UPDATE "Employee" SET sales_zone = 'A08', sales_position = 'MR' WHERE "Name" = 'วัชรพงศ์ พิลุณร์';

-- === เขต A09 (Manager: สันติ ผลคำสุข) ===
UPDATE "Employee" SET sales_zone = 'A09', sales_position = 'ME' WHERE "Name" = 'สุชาดา ราชคม';
UPDATE "Employee" SET sales_zone = 'A09', sales_position = 'MR' WHERE "Name" = 'ออมสิน เนาว์ประเสริฐ';
UPDATE "Employee" SET sales_zone = 'A09', sales_position = 'MR' WHERE "Name" = 'กัญญารัตน์ อยู่สุข';
UPDATE "Employee" SET sales_zone = 'A09', sales_position = 'MR' WHERE "Name" = 'ศิรินาฏ ภูวิเลิศ';

-- === เขต A10 (Manager: สันติ ผลคำสุข) ===
UPDATE "Employee" SET sales_zone = 'A10', sales_position = 'ME' WHERE "Name" = 'พิรยา สินสุวรรณ์';
UPDATE "Employee" SET sales_zone = 'A10', sales_position = 'MR' WHERE "Name" = 'พรชิตา บุญแก้ว';

-- === WHS (Manager: ทรงกรด ปานแก้ว) ===
UPDATE "Employee" SET sales_zone = 'WHS', sales_position = 'WHS-1' WHERE "Name" = 'รัตนพนธ์ แก้วจักร';
UPDATE "Employee" SET sales_zone = 'WHS', sales_position = 'WHS-2' WHERE "Name" = 'เจษฎา พวงแก้ว';
UPDATE "Employee" SET sales_zone = 'WHS', sales_position = 'WHS-3' WHERE "Name" = 'พลกฤต วงค์ษาคม';
UPDATE "Employee" SET sales_zone = 'WHS', sales_position = 'WHS-4' WHERE "Name" = 'ครรชิต ลอยขจร';

-- === COR (Manager: ทรงกรด ปานแก้ว) ===
UPDATE "Employee" SET sales_zone = 'COR', sales_position = 'COR1' WHERE "Name" = 'พิมพ์สิริ ดาทอง';
UPDATE "Employee" SET sales_zone = 'COR', sales_position = 'COR2' WHERE "Name" = 'สุภมาส วัฒนทัพ';

-- === PBH (Manager: ทรงกรด ปานแก้ว) ===
UPDATE "Employee" SET sales_zone = 'PBH', sales_position = 'PH1' WHERE "Name" = 'นิติกร ดอนจันดา';
UPDATE "Employee" SET sales_zone = 'PBH', sales_position = 'PH2' WHERE "Name" = 'นัชชา ภารนาถ';

-- === PD (Manager: ทรงกรด ปานแก้ว) ===
UPDATE "Employee" SET sales_zone = 'PD', sales_position = 'PD' WHERE "Name" = 'กนกนาฎ เชาวนพงษ์';
UPDATE "Employee" SET sales_zone = 'PD', sales_position = 'PD' WHERE "Name" = 'ณัฐพล แสงธรรมวุฒิ';
UPDATE "Employee" SET sales_zone = 'PD', sales_position = 'PD' WHERE "Name" = 'ปิยะ ไชยเกิด';
UPDATE "Employee" SET sales_zone = 'PD', sales_position = 'PD' WHERE "Name" = 'อดิศักดิ์ นัดกระโทก';
UPDATE "Employee" SET sales_zone = 'PD', sales_position = 'PD' WHERE "Name" = 'เพ็ญพิชชา หวังการะแน';
UPDATE "Employee" SET sales_zone = 'PD', sales_position = 'PD' WHERE "Name" = 'สุกัญญา กำมา';

-- ====================================================================
-- Step 3: ตั้งค่า manager_id + manager_name ตาม Manager ของแต่ละกลุ่ม
-- ====================================================================

-- A01-A05 → Manager: แวน จันทร์ทอง
UPDATE "Employee" e
SET manager_id = mgr.id, manager_name = mgr."Name"
FROM "Employee" mgr
WHERE mgr."Name" = 'แวน จันทร์ทอง'
  AND e.sales_zone IN ('A01','A02','A03','A04','A05')
  AND e.id != mgr.id;

-- A06-A10 → Manager: สันติ ผลคำสุข
UPDATE "Employee" e
SET manager_id = mgr.id, manager_name = mgr."Name"
FROM "Employee" mgr
WHERE mgr."Name" = 'สันติ ผลคำสุข'
  AND e.sales_zone IN ('A06','A07','A08','A09','A10')
  AND e.id != mgr.id;

-- WHS, COR, PBH, PD → Manager: ทรงกรด ปานแก้ว
UPDATE "Employee" e
SET manager_id = mgr.id, manager_name = mgr."Name"
FROM "Employee" mgr
WHERE mgr."Name" = 'ทรงกรด ปานแก้ว'
  AND e.sales_zone IN ('WHS','COR','PBH','PD')
  AND e.id != mgr.id;

-- ====================================================================
-- Step 4: ตั้งค่า executive_id สำหรับ MR → ME ในแต่ละเขต (A01-A10)
-- MR ที่อยู่ในเขตเดียวกัน จะมี executive_id ชี้ไปที่ ME ของเขตนั้น
-- ====================================================================

UPDATE "Employee" mr
SET executive_id = me.id
FROM "Employee" me
WHERE me.sales_zone = mr.sales_zone
  AND me.sales_position = 'ME'
  AND mr.sales_position = 'MR'
  AND mr.sales_zone IN ('A01','A02','A03','A04','A05','A06','A07','A08','A09','A10');
