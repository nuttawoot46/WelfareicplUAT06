-- Update manager_id in welfare_requests table based on employee's manager
-- This will ensure all existing requests have the correct manager_id

-- First, make sure all employee_id values are valid
UPDATE welfare_requests
SET employee_id = NULL
WHERE employee_id NOT IN (SELECT id FROM "Employee");

-- Then update the manager_id field for all requests
UPDATE welfare_requests wr
SET manager_id = e.manager_id
FROM "Employee" e
WHERE wr.employee_id = e.id
AND wr.employee_id IS NOT NULL;

-- Log the update for verification
CREATE OR REPLACE FUNCTION temp_log_welfare_requests()
RETURNS TABLE (
    request_id INTEGER,
    employee_id INTEGER,
    employee_name TEXT,
    manager_id INTEGER,
    manager_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wr.id AS request_id,
        wr.employee_id,
        e.Name AS employee_name,
        wr.manager_id,
        m.Name AS manager_name
    FROM 
        welfare_requests wr
    LEFT JOIN 
        "Employee" e ON wr.employee_id = e.id
    LEFT JOIN 
        "Employee" m ON wr.manager_id = m.id;
END;
$$ LANGUAGE plpgsql;

-- The function can be called to verify the update:
-- SELECT * FROM temp_log_welfare_requests(); 