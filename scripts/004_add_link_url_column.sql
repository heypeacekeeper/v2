-- Add link_url column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link_url TEXT;
