-- Add executive_id column to Employee table
-- Used for Marketing Representative → Marketing Executive approval chain
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS executive_id INTEGER REFERENCES "Employee"(id);
