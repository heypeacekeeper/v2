import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/components/feed/feed-header";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostCTA } from "@/components/feed/create-post-cta";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Run all queries in parallel for speed
  const [postsResult, upvotesResult, savedPostsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles:user_id(id, full_name, avatar_url, role)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    user?.id
      ? supabase.from("upvotes").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    user?.id
      ? supabase.from("saved_posts").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const posts = postsResult.data;
  const upvotes = upvotesResult.data;
  const savedPosts = savedPostsResult.data;

  const upvotedPostIds = new Set(upvotes?.map((u) => u.post_id) || []);
  const savedPostIds = new Set(savedPosts?.map((s) => s.post_id) || []);

  return (
    <main className="min-h-screen">
      <FeedHeader />
      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <CreatePostCTA />
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id || ""}
              isUpvoted={upvotedPostIds.has(post.id)}
              isSaved={savedPostIds.has(post.id)}
            />
          ))
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to share something with the community!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
