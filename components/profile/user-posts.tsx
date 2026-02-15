"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/supabase-provider";
import { PostCard } from "@/components/feed/post-card";
import { RocketLoader } from "@/components/ui/global-loader";
import type { Post, Profile } from "@/lib/types";

interface UserPostsProps {
  userId: string;
}

export function UserPosts({ userId }: UserPostsProps) {
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    async function fetchPosts() {
      const { data: postsData } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (postsData) {
        setPosts(postsData as (Post & { profiles: Profile })[]);
      }

      const { data: upvotes } = await supabase
        .from("upvotes")
        .select("post_id")
        .eq("user_id", userId);

      const { data: saved } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", userId);

      setUpvotedIds(new Set(upvotes?.map((u) => u.post_id) || []));
      setSavedIds(new Set(saved?.map((s) => s.post_id) || []));
      setIsLoading(false);
    }

    fetchPosts();
  }, [userId, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RocketLoader size="md" className="text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Your Posts</h3>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          isUpvoted={upvotedIds.has(post.id)}
          isSaved={savedIds.has(post.id)}
        />
      ))}
    </div>
  );
}
