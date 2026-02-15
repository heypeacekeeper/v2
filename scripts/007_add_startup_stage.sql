-- Add startup_stage column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS startup_stage TEXT;

-- Update the updated_at column type if needed
ALTER TABLE public.profiles 
ALTER COLUMN updated_at SET DEFAULT now();
