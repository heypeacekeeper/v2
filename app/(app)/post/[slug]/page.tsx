import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LazyPostDetailClient } from "@/lib/dynamic-imports";
import { Button } from "@/components/ui/button";
import type { Comment, Profile } from "@/lib/types";

interface CommentWithReplies extends Comment {
  profiles: Profile;
  replies: CommentWithReplies[];
}

function extractIdFromSlug(slug: string | undefined): string {
  if (!slug) return "";
  
  const doubleHyphenIndex = slug.lastIndexOf("--");
  if (doubleHyphenIndex !== -1) {
    return slug.slice(doubleHyphenIndex + 2);
  }
  
  if (/^\d+$/.test(slug)) {
    return slug;
  }
  
  const lastHyphenIndex = slug.lastIndexOf("-");
  if (lastHyphenIndex !== -1) {
    const potentialId = slug.slice(lastHyphenIndex + 1);
    if (/^\d+$/.test(potentialId)) {
      return potentialId;
    }
  }
  
  return slug;
}

function buildCommentTree(flatComments: any[]): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  flatComments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  flatComments.forEach((comment) => {
    const commentObj = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(commentObj);
    } else {
      roots.push(commentObj);
    }
  });

  return roots;
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const postId = extractIdFromSlug(slug);
  
  if (!postId || !/^\d+$/.test(postId)) {
    notFound();
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  // Fetch post with profile
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles:user_id(*)")
    .eq("id", postId)
    .limit(1);

  const post = posts?.[0];
  
  if (!post) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post not found</p>
        <Button asChild>
          <Link href="/feed">Go back to feed</Link>
        </Button>
      </main>
    );
  }

  // Fetch comments
  const { data: commentsData } = await supabase
    .from("comments")
    .select("*, profiles:user_id(*)")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  const comments = buildCommentTree(commentsData || []);

  // Check if upvoted/saved
  let isUpvoted = false;
  let isSaved = false;

  if (currentUserId) {
    const { data: upvote } = await supabase
      .from("upvotes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    const { data: saved } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    isUpvoted = !!upvote;
    isSaved = !!saved;
  }

  return (
    <LazyPostDetailClient
      post={post}
      comments={comments}
      currentUserId={currentUserId}
      initialIsUpvoted={isUpvoted}
      initialIsSaved={isSaved}
    />
  );
}
