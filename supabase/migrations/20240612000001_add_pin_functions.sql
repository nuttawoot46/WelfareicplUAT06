-- Create a function to hash the PIN (in production, use a more secure hashing algorithm)
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- In a production environment, use a proper password hashing function
  -- For example: RETURN crypt(pin, gen_salt('bf'));
  RETURN encode(digest(pin, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify the PIN
CREATE OR REPLACE FUNCTION verify_employee_pin(
  employee_name TEXT,
  pin_to_verify TEXT
) 
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  is_valid BOOLEAN;
BEGIN
  -- Get the stored hash for the employee
  SELECT pin_hash INTO stored_hash
  FROM "Employee"
  WHERE "Name" = employee_name;
  
  -- If no PIN is set, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- In production, use proper password verification
  -- For example: SELECT (stored_hash = crypt(pin_to_verify, stored_hash)) INTO is_valid;
  SELECT (stored_hash = encode(digest(pin_to_verify, 'sha256'), 'hex')) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update the PIN
CREATE OR REPLACE FUNCTION update_employee_pin(
  employee_name TEXT,
  new_pin TEXT
) 
RETURNS VOID AS $$
DECLARE
  pin_hash TEXT;
BEGIN
  -- Hash the new PIN
  SELECT encode(digest(new_pin, 'sha256'), 'hex') INTO pin_hash;
  
  -- Update the employee's PIN hash
  UPDATE "Employee"
  SET pin_hash = pin_hash
  WHERE "Name" = employee_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found: %', employee_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
