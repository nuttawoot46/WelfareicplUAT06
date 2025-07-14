-- Add password_hash column to Employee table
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN "Employee".password_hash IS 'Hashed password for user authentication';

-- Create a function to hash the password
CREATE OR REPLACE FUNCTION hash_password(password TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- In a production environment, use a proper password hashing function
  -- For example: RETURN crypt(password, gen_salt('bf'));
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify the password (แทนที่ verify_employee_pin)
CREATE OR REPLACE FUNCTION verify_employee_password(
  employee_name TEXT,
  password_to_verify TEXT
) 
RETURNS BOOLEAN AS $$
DECLARE
  stored_pin TEXT;
  is_valid BOOLEAN;
BEGIN
  -- Get the stored PIN for the employee
  SELECT "Pin" INTO stored_pin
  FROM "Employee"
  WHERE "Name" = employee_name;
  
  -- If no PIN is set, return false
  IF stored_pin IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare the PIN directly
  SELECT (stored_pin = password_to_verify) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update the password (แทนที่ update_employee_pin)
CREATE OR REPLACE FUNCTION update_employee_password(
  employee_name TEXT,
  new_password TEXT
) 
RETURNS VOID AS $$
BEGIN
  -- Update the employee's PIN
  UPDATE "Employee"
  SET "Pin" = new_password
  WHERE "Name" = employee_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found: %', employee_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to migrate existing PIN hashes to password hashes (optional)
CREATE OR REPLACE FUNCTION migrate_pin_to_password() RETURNS void AS $$
BEGIN
  -- Copy existing PIN hashes to password_hash column
  -- This is just a placeholder, in a real scenario you might want to rehash with a stronger algorithm
  UPDATE "Employee" SET password_hash = pin_hash WHERE pin_hash IS NOT NULL;
END;
$$ LANGUAGE plpgsql; 