-- Ensure requires_special_approval column exists in welfare_requests table
-- This is a safety migration in case the previous migration wasn't applied

DO $$ 
BEGIN
    -- Check if the column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'welfare_requests' 
        AND column_name = 'requires_special_approval'
    ) THEN
        ALTER TABLE welfare_requests 
        ADD COLUMN requires_special_approval BOOLEAN DEFAULT FALSE;
        
        -- Add comment to explain the column purpose
        COMMENT ON COLUMN welfare_requests.requires_special_approval IS 'Indicates if the request requires special approval (e.g., internal training > 10,000 THB)';
    END IF;
    
    -- Also ensure other special approval columns exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'welfare_requests' 
        AND column_name = 'special_approver_id'
    ) THEN
        ALTER TABLE welfare_requests 
        ADD COLUMN special_approver_id TEXT,
        ADD COLUMN special_approver_name TEXT,
        ADD COLUMN special_approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;