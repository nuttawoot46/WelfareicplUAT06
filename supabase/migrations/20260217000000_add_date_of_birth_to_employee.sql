-- Add date_of_birth column to Employee table for birthday display on Dashboard
ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL;

COMMENT ON COLUMN "Employee".date_of_birth IS 'Employee date of birth for birthday display';
