-- Add password_hash column to Employee table
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN "Employee".password_hash IS 'Hashed password for user authentication';

-- Add a function to migrate existing PIN hashes to password hashes (optional)
CREATE OR REPLACE FUNCTION migrate_pin_to_password() RETURNS void AS $$
BEGIN
  -- Copy existing PIN hashes to password_hash column
  -- This is just a placeholder, in a real scenario you might want to rehash with a stronger algorithm
  UPDATE "Employee" SET password_hash = pin_hash WHERE pin_hash IS NOT NULL;
END;
$$ LANGUAGE plpgsql; 