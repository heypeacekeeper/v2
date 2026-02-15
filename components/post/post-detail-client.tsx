"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ArrowBigUp,
  Bookmark,
  Share2,
  ExternalLink,
  Send,
  MessageCircle,
  Heart,
} from "lucide-react";
import { RocketLoader } from "@/components/ui/global-loader";
import { useToast } from "@/hooks/use-toast";
import type { Post, Profile, Comment } from "@/lib/types";

interface CommentWithReplies extends Comment {
  profiles: Profile;
  replies: CommentWithReplies[];
}

interface PostDetailClientProps {
  post: Post & { profiles: Profile };
  comments: CommentWithReplies[];
  currentUserId: string | null;
  initialIsUpvoted: boolean;
  initialIsSaved: boolean;
}

function PostDetailClient({
  post,
  comments: initialComments,
  currentUserId,
  initialIsUpvoted,
  initialIsSaved,
}: PostDetailClientProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { toast } = useToast();
  
  const [comments, setComments] = useState(initialComments);
  const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [upvoteCount, setUpvoteCount] = useState(post.upvotes_count || 0);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profile = post.profiles;
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  // Count all comments including nested replies
  function countAllComments(commentsList: CommentWithReplies[]): number {
    let count = 0;
    for (const comment of commentsList) {
      count += 1;
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies);
      }
    }
    return count;
  }

  const totalCommentsCount = countAllComments(comments);

  async function handleUpvote() {
    if (!currentUserId) return;
    
    const previousUpvoted = isUpvoted;
    const previousCount = upvoteCount;

    try {
      if (isUpvoted) {
        setIsUpvoted(false);
        setUpvoteCount((c) => Math.max(0, c - 1));
        
        const { error } = await supabase
          .from("upvotes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) {
          setIsUpvoted(previousUpvoted);
          setUpvoteCount(previousCount);
        }
      } else {
        setIsUpvoted(true);
        setUpvoteCount((c) => c + 1);
        
        const { error } = await supabase.from("upvotes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });

        if (error) {
          setIsUpvoted(previousUpvoted);
          setUpvoteCount(previousCount);
        }
      }
    } catch (error) {
      setIsUpvoted(previousUpvoted);
      setUpvoteCount(previousCount);
    }
  }

  async function handleSave() {
    if (!currentUserId) return;
    
    const previousSaved = isSaved;

    try {
      if (isSaved) {
        setIsSaved(false);
        
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) {
          setIsSaved(previousSaved);
        }
      } else {
        setIsSaved(true);
        
        const { error } = await supabase.from("saved_posts").insert({
          post_id: post.id,
          user_id: currentUserId,
        });

        if (error) {
          setIsSaved(previousSaved);
        }
      }
    } catch (error) {
      setIsSaved(previousSaved);
    }
  }

  async function handleShare() {
    try {
      const shareUrl = window.location.href;
      
      // Try native share API first (better UX on mobile)
      if (navigator.share && navigator.canShare?.({ url: shareUrl })) {
        try {
          await navigator.share({
            title: post.title || `Post by ${profile?.full_name}`,
            text: post.content?.slice(0, 100) || "",
            url: shareUrl,
          });
          toast({
            title: "Shared successfully",
            description: "Post shared with your selected app",
          });
        } catch (error) {
          // User cancelled share or other share error - fall back to clipboard
          if ((error as Error).name !== "AbortError") {
            await navigator.clipboard.writeText(shareUrl);
            toast({
              title: "Link copied",
              description: "Post URL copied to clipboard",
            });
          }
        }
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "Post URL copied to clipboard",
        });
      }
    } catch (error) {
      console.error("[v0] Share error:", error);
      toast({
        title: "Error sharing post",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  }

  async function loadComments() {
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*, profiles:user_id(*)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    const nestedComments = buildCommentTree(commentsData || []);
    setComments(nestedComments);
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

  async function handleAddComment(parentId: string | null = null) {
    if (!currentUserId || !newComment.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: post.id,
        user_id: currentUserId,
        content: newComment.trim(),
        parent_id: parentId,
      });

    if (!error) {
      await loadComments();
      setNewComment("");
    }

    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold truncate">Post</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Post Content */}
        <article className="p-4 border-b border-border">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${profile?.id}`}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${profile?.id}`}
                  className="font-medium hover:underline"
                >
                  {profile?.full_name || "Anonymous"}
                </Link>
                <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 rounded bg-secondary">
                  {profile?.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {post.title && (
              <h1 className="text-xl font-bold">{post.title}</h1>
            )}

            {post.content && (
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {post.media_url && post.post_type === "image" && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <Image
                  src={post.media_url || "/placeholder.svg"}
                  alt={post.title || "Post image"}
                  width={600}
                  height={400}
                  sizes="(max-width: 640px) 100vw, 600px"
                  className="w-full object-cover"
                  priority
                  quality={85}
                />
              </div>
            )}

            {post.media_url && post.post_type === "video" && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <video src={post.media_url} controls className="w-full">
                  <track kind="captions" />
                </video>
              </div>
            )}

            {post.link_url && (
              <a
                href={post.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{post.link_url}</span>
              </a>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/discover?tag=${tag}`}
                    className="text-xs text-primary hover:underline"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className={`gap-1.5 ${isUpvoted ? "text-primary" : "text-muted-foreground"}`}
            >
              <ArrowBigUp className={`w-5 h-5 ${isUpvoted ? "fill-primary" : ""}`} />
              <span>{upvoteCount}</span>
            </Button>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{totalCommentsCount}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className={isSaved ? "text-primary" : "text-muted-foreground"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-primary" : ""}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-muted-foreground"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </article>

        {/* Add Comment */}
        {currentUserId && (
          <div className="p-4 border-b border-border">
            <div className="flex gap-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={() => handleAddComment(null)}
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <RocketLoader size="sm" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="divide-y divide-border">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <NestedComment
                key={comment.id}
                comment={comment}
                postId={post.id}
                currentUserId={currentUserId}
                depth={0}
                onReplyAdded={loadComments}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

interface NestedCommentProps {
  comment: CommentWithReplies;
  postId: string;
  currentUserId: string | null;
  depth: number;
  onReplyAdded: () => void;
}

function NestedComment({
  comment,
  postId,
  currentUserId,
  depth,
  onReplyAdded,
}: NestedCommentProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2);

  const supabase = useSupabase();

  const profile = comment.profiles;
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  async function handleLike() {
    if (!currentUserId) return;

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((c) => c - 1);
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", currentUserId);
    } else {
      setIsLiked(true);
      setLikesCount((c) => c + 1);
      await supabase.from("comment_likes").insert({
        comment_id: comment.id,
        user_id: currentUserId,
      });
    }
  }

  async function handleReply() {
    if (!currentUserId || !replyContent.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: replyContent.trim(),
      parent_id: comment.id,
    });

    if (!error) {
      setReplyContent("");
      setShowReplyForm(false);
      onReplyAdded();
    }

    setIsSubmitting(false);
  }

  const maxDepth = 5;
  const canNest = depth < maxDepth;

  return (
    <div className={`${depth > 0 ? "ml-4 pl-4 border-l border-border" : ""}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${profile?.id}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${profile?.id}`}
                className="font-medium text-sm hover:underline"
              >
                {profile?.full_name || "Anonymous"}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs ${
                  isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500" : ""}`} />
                {likesCount > 0 && <span>{likesCount}</span>}
              </button>

              {canNest && currentUserId && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reply
                </button>
              )}
            </div>

            {showReplyForm && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] text-sm bg-secondary border-border resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    {isSubmitting ? <RocketLoader size="xs" /> : "Reply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <>
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="ml-12 mb-2 text-xs text-primary hover:underline"
            >
              Show {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            comment.replies.map((reply) => (
              <NestedComment
                key={reply.id}
                comment={reply}
                postId={postId}
                currentUserId={currentUserId}
                depth={depth + 1}
                onReplyAdded={onReplyAdded}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

export { PostDetailClient };
export default PostDetailClient;
