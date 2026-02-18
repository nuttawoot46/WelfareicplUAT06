-- Add manager waiver fields for training excess amount
-- หัวหน้าสามารถอนุโลมส่วนเกินค่าอบรมให้พนักงานได้

ALTER TABLE welfare_requests
  ADD COLUMN IF NOT EXISTS manager_waiver_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS manager_waiver_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manager_waiver_reason TEXT DEFAULT NULL;

-- manager_waiver_type: 'none' | 'full' | 'partial' | NULL
-- manager_waiver_amount: จำนวนเงินที่หัวหน้าอนุโลมให้บริษัทจ่ายเพิ่ม
-- manager_waiver_reason: เหตุผลการอนุโลม

COMMENT ON COLUMN welfare_requests.manager_waiver_type IS 'ประเภทการอนุโลมส่วนเกิน: none=ตามปกติ 50/50, full=บริษัทจ่ายทั้งหมด, partial=กำหนดเอง';
COMMENT ON COLUMN welfare_requests.manager_waiver_amount IS 'จำนวนเงินที่อนุโลมให้บริษัทจ่ายเพิ่ม (เฉพาะ partial)';
COMMENT ON COLUMN welfare_requests.manager_waiver_reason IS 'เหตุผลการอนุโลมส่วนเกิน';
