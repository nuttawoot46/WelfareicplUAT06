-- Add youtube_embed_url column to announcements table
ALTER TABLE announcements 
ADD COLUMN youtube_embed_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN announcements.youtube_embed_url IS 'YouTube embed URL for announcements';