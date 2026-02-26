-- =====================================================
-- Migration: อัพเดทยอดเงินสวัสดิการคงเหลือ ปี 2569
-- Date: 2026-02-24
-- Source: Google Sheets ข้อมูลการใช้สวัสดิการพนักงาน
-- Description: หักยอดเงินสวัสดิการที่พนักงานเบิกใช้แล้วออกจาก budget คงเหลือ
-- Note: ใช้ "Name" ในการ match พนักงาน (ไม่ใช่ id)
-- =====================================================

-- =========================================================
-- 1. ทำฟัน (Dental) - หักจาก budget_dentalglasses
--    วงเงินรวมทำฟัน+ตัดแว่น = 2,000 บาท/ปี
-- =========================================================

-- มัลลิกา เทียมสวัสดิ์ (11595, Accounting & Finance) - ทำฟัน 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'มัลลิกา เทียมสวัสดิ์';

-- อุดมชัย อุดมลาภ (11564, Inspiration) - ทำฟัน 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'อุดมชัย อุดมลาภ';

-- บงกช ภู่มาตร (11486, Operation) - ทำฟัน 1,300 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 1300) WHERE "Name" = 'บงกช ภู่มาตร';

-- รุ่งรัตน์ น้อยทิม (11193, Operation) - ทำฟัน 1,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 1000) WHERE "Name" = 'รุ่งรัตน์ น้อยทิม';

-- จักรพงษ์ ภูทวี (11599, Operation) - ทำฟัน 1,500 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 1500) WHERE "Name" = 'จักรพงษ์ ภูทวี';

-- ชอุ๋มรัตน์ อ่วมออง (11612, Operation) - ทำฟัน 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'ชอุ๋มรัตน์ อ่วมออง';

-- พิมพ์สิริ ดาทอง (11573, Marketing) - ทำฟัน 2,000 บาท (ก.พ)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'พิมพ์สิริ ดาทอง';

-- ณัฐนันท์ โพธิ์สังข์ (20053, Management) - ทำฟัน 1,850 บาท (ก.พ)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 1850) WHERE "Name" = 'ณัฐนันท์ โพธิ์สังข์';


-- =========================================================
-- 2. ตัดแว่น (Glasses) - หักจาก budget_dentalglasses
--    ใช้คอลัมน์เดียวกับทำฟัน (budget รวม 2,000 บาท/ปี)
-- =========================================================

-- อชิรญาณ์ เวฬุวนารักษ์ (11510, Marketing) - ตัดแว่น 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'อชิรญาณ์ เวฬุวนารักษ์';

-- อดิศักดิ์ จิราสุคนธ์ (11512, Marketing) - ตัดแว่น 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'อดิศักดิ์ จิราสุคนธ์';

-- ดลดนัย กุญชร ณ อยุธยา (11464, Procurement) - ตัดแว่น 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'ดลดนัย กุญชร ณ อยุธยา';

-- เสมียน กระแสโท (11215, Operation) - ตัดแว่น 2,000 บาท (ม.ค)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'เสมียน กระแสโท';

-- ดวงพร ก้านทอง (11385, Plant) - ตัดแว่น 2,000 บาท (ก.พ)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'ดวงพร ก้านทอง';

-- บุญสิตา สุจริยา (11547, Quality control) - ตัดแว่น 2,000 บาท (ก.พ)
UPDATE "Employee" SET budget_dentalglasses = GREATEST(0, COALESCE(budget_dentalglasses, 2000) - 2000) WHERE "Name" = 'บุญสิตา สุจริยา';


-- =========================================================
-- 3. ออกกำลังกาย (Fitness) - หักจาก budget_fitness
--    วงเงิน 300 บาท/เดือน
-- =========================================================

-- กฤตย์ ใจน้อย (20024, DNDS) - ออกกำลังกาย 300 บาท
UPDATE "Employee" SET budget_fitness = GREATEST(0, COALESCE(budget_fitness, 300) - 300) WHERE "Name" = 'กฤตย์ ใจน้อย';


-- =========================================================
-- 4. คลอดบุตร (Childbirth) - หักจาก budget_childbirth
--    วงเงิน 8,000 บาท (สูงสุด 3 ครั้ง)
-- =========================================================

-- จิราพร คนยงค์ (11450, Plant) - คลอดบุตร 6,000 บาท
UPDATE "Employee" SET budget_childbirth = GREATEST(0, COALESCE(budget_childbirth, 8000) - 6000) WHERE "Name" = 'จิราพร คนยงค์';


-- =========================================================
-- 5. อบรม (Training) - หักจาก "Budget_Training"
--    วงเงินตาม Original_Budget_Training ของแต่ละคน
-- =========================================================

-- คณิน สุวรรณนภาศรี (11412, Management) - อบรม 18,370.10 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 18370.10) WHERE "Name" = 'คณิน สุวรรณนภาศรี';

-- พิมลพรรณ สีสิงห์ (11621, Accounting & Finance) - อบรม 2,141 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2141) WHERE "Name" = 'พิมลพรรณ สีสิงห์';

-- วุฒินันท์ จันทร์อ่อน (11476, Inspiration) - อบรม 18,370.09 + 1,352 = 19,722.09 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 19722.09) WHERE "Name" = 'วุฒินันท์ จันทร์อ่อน';

-- ศิริลักษณ์ แก้วกุลศรี (11224, Procurement) - อบรม 2,500 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2500) WHERE "Name" = 'ศิริลักษณ์ แก้วกุลศรี';

-- ดลดนัย กุญชร ณ อยุธยา (11464, Procurement) - อบรม 9,360 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 9360) WHERE "Name" = 'ดลดนัย กุญชร ณ อยุธยา';

-- เชื้อ ปานทอง (11212, Plant) - อบรม 2,915.89 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2915.89) WHERE "Name" = 'เชื้อ ปานทอง';

-- วัลลิภา กลิ่นพยอม (11543, Plant) - อบรม 2,288 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2288) WHERE "Name" = 'วัลลิภา กลิ่นพยอม';

-- กวิสสรา คองอินทร์ (11516, Quality control) - อบรม 2,288 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2288) WHERE "Name" = 'กวิสสรา คองอินทร์';

-- วธาธร สอนซี (11515, Quality control) - อบรม 2,288 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2288) WHERE "Name" = 'วธาธร สอนซี';

-- สิริพิชญ์ สงสมพันธ์ (11517, Quality control) - อบรม 5,720 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 5720) WHERE "Name" = 'สิริพิชญ์ สงสมพันธ์';

-- บุญสิตา สุจริยา (11547, Quality control) - อบรม 5,720 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 5720) WHERE "Name" = 'บุญสิตา สุจริยา';

-- พนิดา เบิกบาน (11438, Operation) - อบรม 2,288 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2288) WHERE "Name" = 'พนิดา เบิกบาน';

-- วรรณภา ธีระสาร (11424, Operation) - อบรม 2,288 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 2288) WHERE "Name" = 'วรรณภา ธีระสาร';

-- ณัฐพล หงษ์ศรีสุข (20031, Inspiration) - อบรม 1,352 บาท
UPDATE "Employee" SET "Budget_Training" = GREATEST(0, COALESCE("Budget_Training", 0) - 1352) WHERE "Name" = 'ณัฐพล หงษ์ศรีสุข';


-- =========================================================
-- สรุปยอดทั้งหมด:
-- =========================================================
-- ทำฟัน (Dental):     8 คน, รวม 15,650 บาท
-- ตัดแว่น (Glasses):  6 คน, รวม 12,000 บาท
-- ออกกำลังกาย:        1 คน, รวม 300 บาท
-- คลอดบุตร:           1 คน, รวม 6,000 บาท
-- อบรม (Training):   14 คน, รวม 77,391.08 บาท
-- รวมทั้งสิ้น:                 111,341.08 บาท
-- =========================================================
