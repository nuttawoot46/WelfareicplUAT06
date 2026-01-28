-- =====================================================
-- Migration: เพิ่ม avatar_url column ในตาราง Employee
-- =====================================================

-- เพิ่มคอลัมน์ avatar_url ในตาราง Employee (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employee' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE "Employee" ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Comment สำหรับคอลัมน์
COMMENT ON COLUMN "Employee".avatar_url IS 'URL ของรูปโปรไฟล์พนักงาน (เก็บใน Supabase Storage)';

-- =====================================================
-- สร้าง Storage Bucket สำหรับ avatars
-- =====================================================
-- หมายเหตุ: ต้องสร้าง bucket ผ่าน Supabase Dashboard หรือ API
-- ไปที่ Storage > New bucket > ชื่อ: avatars, Public: true

-- =====================================================
-- Storage Policy สำหรับ avatars bucket
-- =====================================================

-- อนุญาตให้ authenticated users อัพโหลดรูปของตัวเอง
-- ต้องรันใน Supabase Dashboard > Storage > avatars > Policies

/*
-- Policy: Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy: Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
*/

-- ===== คำแนะนำการตั้งค่า Supabase Storage =====
-- 1. ไปที่ Supabase Dashboard
-- 2. เลือก Storage ในเมนูซ้าย
-- 3. คลิก "New bucket"
-- 4. ตั้งชื่อ: avatars
-- 5. เปิด "Public bucket" เพื่อให้สามารถเข้าถึงรูปได้โดยไม่ต้อง login
-- 6. คลิก "Create bucket"
-- 7. ไปที่ Policies tab และเพิ่ม policies ตามด้านบน
