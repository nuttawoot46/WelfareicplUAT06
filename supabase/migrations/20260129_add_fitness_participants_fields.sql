-- Add fitness participants fields to welfare_requests table
-- For tracking shared fitness costs among employees

-- Add fitness_participants column (JSON array of participants)
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS fitness_participants TEXT;

-- Add fitness_split_equally column (boolean flag)
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS fitness_split_equally BOOLEAN DEFAULT FALSE;

-- Add fitness_amount_per_person column (calculated split amount)
ALTER TABLE welfare_requests
ADD COLUMN IF NOT EXISTS fitness_amount_per_person DECIMAL(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN welfare_requests.fitness_participants IS 'JSON array of {employee_id, employee_name, email, amount} for shared fitness costs';
COMMENT ON COLUMN welfare_requests.fitness_split_equally IS 'Whether the fitness cost is split equally among participants';
COMMENT ON COLUMN welfare_requests.fitness_amount_per_person IS 'Calculated amount per person when splitting equally';
