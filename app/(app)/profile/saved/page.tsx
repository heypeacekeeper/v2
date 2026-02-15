import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, AlertCircle } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";

export default async function SavedPostsPage() {
  try {
    const supabase = await createClient();
    
    // Get current user with error handling
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Failed to authenticate user");
    }

    // Get saved posts
    const { data: savedPosts, error: savedError } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (savedError) {
      console.error("[v0] Error fetching saved posts:", savedError);
      throw new Error("Failed to fetch saved posts");
    }

    const postIds = savedPosts?.map((sp) => sp.post_id) || [];

    // Get post data
    const { data: postsData, error: postsError } = postIds.length > 0
      ? await supabase
          .from("posts")
          .select("*, profiles:user_id(id, full_name, avatar_url, role)")
          .in("id", postIds)
      : { data: [], error: null };

    if (postsError) {
      console.error("[v0] Error fetching posts:", postsError);
      throw new Error("Failed to fetch posts");
    }

    // Get upvotes
    const { data: upvotes, error: upvotesError } = await supabase
      .from("upvotes")
      .select("post_id")
      .eq("user_id", user.id);

    if (upvotesError) {
      console.error("[v0] Error fetching upvotes:", upvotesError);
    }

    const upvotedPostIds = new Set(upvotes?.map((u) => u.post_id) || []);
    const savedPostIds = new Set(postIds);
    const posts = postsData || [];

    return (
      <main className="min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-semibold">Saved Posts</h1>
          </div>
        </header>

        <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
          {posts.length > 0 ? (
            posts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user.id}
                isUpvoted={upvotedPostIds.has(post.id)}
                isSaved={savedPostIds.has(post.id)}
              />
            ))
          ) : (
            <div className="text-center py-12 space-y-3">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No saved posts yet</p>
              <p className="text-sm text-muted-foreground">
                Posts you save will appear here
              </p>
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error("[v0] Error in SavedPostsPage:", error);
    
    return (
      <main className="min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-semibold">Saved Posts</h1>
          </div>
        </header>

        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <p className="text-foreground font-medium">Unable to load saved posts</p>
              <p className="text-sm text-muted-foreground">
                There was a problem fetching your saved posts. Please try again.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">Go back</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }
}
