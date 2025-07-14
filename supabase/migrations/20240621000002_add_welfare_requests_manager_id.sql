-- Add manager_id column to welfare_requests table
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS manager_id INTEGER;

-- Update manager_id in welfare_requests based on employee's manager
UPDATE welfare_requests wr
SET manager_id = e.manager_id
FROM "Employee" e
WHERE wr.employee_id = e.id;

-- Create an index on manager_id for better query performance
CREATE INDEX idx_welfare_requests_manager_id ON welfare_requests (manager_id);

-- Add foreign key constraint to link welfare_requests with manager
ALTER TABLE welfare_requests
ADD CONSTRAINT fk_welfare_requests_manager
FOREIGN KEY (manager_id)
REFERENCES "Employee" (id); 