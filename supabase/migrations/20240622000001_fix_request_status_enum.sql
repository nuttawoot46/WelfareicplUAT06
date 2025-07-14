-- Fix the status column in welfare_requests table to accept lowercase values
-- First, convert the existing enum type to text
ALTER TABLE welfare_requests
ALTER COLUMN status TYPE TEXT;

-- Update any existing values to lowercase for consistency
UPDATE welfare_requests
SET status = LOWER(status)
WHERE status IS NOT NULL;

-- Create a new enum type with lowercase values
DROP TYPE IF EXISTS request_status_lowercase;
CREATE TYPE request_status_lowercase AS ENUM ('pending', 'approved', 'rejected');

-- Convert the column to use the new enum type
ALTER TABLE welfare_requests
ALTER COLUMN status TYPE request_status_lowercase USING status::request_status_lowercase; 