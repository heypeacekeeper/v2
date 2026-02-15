-- Make the content column optional in posts table
ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;
