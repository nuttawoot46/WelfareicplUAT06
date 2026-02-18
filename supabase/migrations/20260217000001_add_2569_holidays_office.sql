-- Insert 2569 (2026) holidays for Bangkok Office - ICP Ladda Co., Ltd.
-- Source: ประกาศวันหยุดทำการประจำปี 2569 (สำนักงานใหญ่ จ.กรุงเทพ)

INSERT INTO holidays (date, name_en, name_th, year, location, is_active) VALUES
  ('2026-01-01', 'New Year''s Day', 'วันขึ้นปีใหม่', 2026, 'Office', true),
  ('2026-01-02', 'Company Special Holiday', 'วันหยุดพิเศษเพิ่มเติมของบริษัท', 2026, 'Office', true),
  ('2026-03-03', 'Makha Bucha Day', 'วันมาฆบูชา', 2026, 'Office', true),
  ('2026-04-06', 'Chakri Memorial Day', 'วันจักรี', 2026, 'Office', true),
  ('2026-04-13', 'Songkran Festival', 'วันสงกรานต์', 2026, 'Office', true),
  ('2026-04-14', 'Songkran Festival', 'วันสงกรานต์', 2026, 'Office', true),
  ('2026-04-15', 'Songkran Festival', 'วันสงกรานต์', 2026, 'Office', true),
  ('2026-05-01', 'National Labour Day', 'วันแรงงานแห่งชาติ', 2026, 'Office', true),
  ('2026-05-04', 'Coronation Day', 'วันฉัตรมงคล', 2026, 'Office', true),
  ('2026-06-03', 'H.M. Queen Suthida''s Birthday', 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดาพัชรสุธาพิมลลักษณ พระบรมราชินี', 2026, 'Office', true),
  ('2026-07-28', 'H.M. King''s Birthday', 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว', 2026, 'Office', true),
  ('2026-08-12', 'H.M. Queen Sirikit''s Birthday / Mother''s Day', 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวงและวันแม่แห่งชาติ', 2026, 'Office', true),
  ('2026-10-13', 'King Bhumibol Memorial Day', 'วันนวมินทรมหาราช', 2026, 'Office', true),
  ('2026-10-23', 'Chulalongkorn Day', 'วันปิยมหาราช', 2026, 'Office', true),
  ('2026-12-07', 'Substitution for Father''s Day / National Day', 'ชดเชยวันพ่อแห่งชาติและวันชาติ (5 ธ.ค.)', 2026, 'Office', true),
  ('2026-12-30', 'Company Special Holiday', 'วันหยุดพิเศษเพิ่มเติมของบริษัท', 2026, 'Office', true),
  ('2026-12-31', 'New Year''s Eve', 'วันสิ้นปี', 2026, 'Office', true)
ON CONFLICT DO NOTHING;
