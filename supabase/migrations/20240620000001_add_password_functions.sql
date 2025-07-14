-- Create a function to hash the password (in production, use a more secure hashing algorithm)
CREATE OR REPLACE FUNCTION hash_password(password TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- In a production environment, use a proper password hashing function
  -- For example: RETURN crypt(password, gen_salt('bf'));
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify the password
CREATE OR REPLACE FUNCTION verify_employee_password(
  employee_name TEXT,
  password_to_verify TEXT
) 
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  is_valid BOOLEAN;
BEGIN
  -- Get the stored hash for the employee
  SELECT password_hash INTO stored_hash
  FROM "Employee"
  WHERE "Name" = employee_name;
  
  -- If no password is set, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- In production, use proper password verification
  -- For example: SELECT (stored_hash = crypt(password_to_verify, stored_hash)) INTO is_valid;
  SELECT (stored_hash = encode(digest(password_to_verify, 'sha256'), 'hex')) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update the password
CREATE OR REPLACE FUNCTION update_employee_password(
  employee_name TEXT,
  new_password TEXT
) 
RETURNS VOID AS $$
DECLARE
  password_hash TEXT;
BEGIN
  -- Hash the new password
  SELECT encode(digest(new_password, 'sha256'), 'hex') INTO password_hash;
  
  -- Update the employee's password hash
  UPDATE "Employee"
  SET password_hash = password_hash
  WHERE "Name" = employee_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found: %', employee_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 