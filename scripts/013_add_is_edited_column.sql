-- Add is_edited column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- Create index for filtered queries
CREATE INDEX IF NOT EXISTS idx_posts_is_edited ON posts(is_edited);
