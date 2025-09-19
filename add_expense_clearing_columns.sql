-- Add expense clearing columns to welfare_requests table
ALTER TABLE welfare_requests 
ADD COLUMN IF NOT EXISTS original_advance_request_id INTEGER REFERENCES welfare_requests(id),
ADD COLUMN IF NOT EXISTS expense_clearing_items JSONB;

-- Add comment for documentation
COMMENT ON COLUMN welfare_requests.original_advance_request_id IS 'Reference to the original advance payment request that this expense clearing is for';
COMMENT ON COLUMN welfare_requests.expense_clearing_items IS 'JSON array of expense clearing items with actual usage amounts';

-- Create index for better performance on expense clearing queries
CREATE INDEX IF NOT EXISTS idx_welfare_requests_original_advance_request_id 
ON welfare_requests(original_advance_request_id);

-- Create index for expense clearing type
CREATE INDEX IF NOT EXISTS idx_welfare_requests_expense_clearing_type 
ON welfare_requests(request_type) WHERE request_type = 'expense-clearing';