-- Create trigger to auto-update posts.upvotes_count when upvotes are added/removed
CREATE OR REPLACE FUNCTION public.update_post_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET upvotes_count = upvotes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET upvotes_count = GREATEST(upvotes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS upvotes_update_count_trigger ON public.upvotes;

-- Create the trigger
CREATE TRIGGER upvotes_update_count_trigger
AFTER INSERT OR DELETE ON public.upvotes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_upvote_count();

-- Recalculate upvote counts to ensure they match actual upvotes
UPDATE public.posts
SET upvotes_count = (
  SELECT COUNT(*)
  FROM public.upvotes
  WHERE upvotes.post_id = posts.id
);
