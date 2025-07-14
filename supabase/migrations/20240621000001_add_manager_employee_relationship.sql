-- Add foreign key constraint to link employees with their managers
-- First ensure the "Email.Manager" column exists
ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "manager_id" INTEGER;

-- Update manager_id based on "Email.Manager" values
UPDATE "Employee" e1
SET manager_id = e2.id
FROM "Employee" e2
WHERE e1."Email.Manager" = e2."Email.user";

-- Add foreign key constraint
ALTER TABLE "Employee"
ADD CONSTRAINT fk_employee_manager
FOREIGN KEY (manager_id)
REFERENCES "Employee" (id);

-- Create an index on manager_id for better query performance
CREATE INDEX idx_employee_manager_id ON "Employee" (manager_id); 