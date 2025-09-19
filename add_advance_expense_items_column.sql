-- Migration: Add advance_expense_items column to welfare_requests table
-- Date: 2024-12-23
-- Description: Add support for detailed expense items in advance payment requests

-- Add the new column
ALTER TABLE public.welfare_requests 
ADD COLUMN IF NOT EXISTS advance_expense_items jsonb NULL DEFAULT '[]'::jsonb;

-- Add index for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_welfare_requests_advance_expense_items 
ON public.welfare_requests USING gin (advance_expense_items) TABLESPACE pg_default;

-- Add comment to document the column
COMMENT ON COLUMN public.welfare_requests.advance_expense_items IS 'JSON array containing detailed expense items for advance payment requests. Each item contains: name, taxRate, requestAmount, usedAmount, tax, vat, refund';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'welfare_requests' 
AND column_name = 'advance_expense_items';