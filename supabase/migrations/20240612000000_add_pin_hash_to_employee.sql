-- Add pin_hash column to Employee table
ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS pin_hash TEXT DEFAULT NULL;
