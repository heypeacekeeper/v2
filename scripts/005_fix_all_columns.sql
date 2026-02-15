-- Comprehensive schema fix to align database with application code

-- 1. FIX POSTS TABLE - Add missing columns and remove constraints
-- Make title optional
ALTER TABLE public.posts ALTER COLUMN title DROP NOT NULL;

-- Drop category constraint temporarily and make it optional  
ALTER TABLE public.posts ALTER COLUMN category DROP NOT NULL;

-- Add missing columns for posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Drop the old post_type constraint and add new one
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_post_type_check CHECK (post_type IN ('text', 'image', 'video', 'link', 'idea', 'question', 'validation_request', 'reel', 'images', 'thread'));

-- Drop old category constraint and make it more flexible
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- 2. FIX PROFILES TABLE - Ensure all needed columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- 3. FIX RESOURCES TABLE - Align with code expectations
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS created_by UUID;

-- Make content_markdown optional
ALTER TABLE public.resources ALTER COLUMN content_markdown DROP NOT NULL;

-- Drop old category constraint
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_category_check;

-- Add index for is_pinned
CREATE INDEX IF NOT EXISTS posts_is_pinned_idx ON public.posts(is_pinned DESC);
