"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useSupabase } from "@/providers/supabase-provider";
import {
  ArrowBigUp,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Pin,
  ExternalLink,
  Play,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditPostModal } from "@/components/post/edit-post-modal";
import type { Post, Profile } from "@/lib/types";

function generateSlug(title: string | null | undefined, id: string | number | undefined): string {
  const safeId = String(id ?? "");
  if (!safeId) return "";
  if (!title) return safeId;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  // Format: title-slug--id (double hyphen separates title from numeric id)
  return `${slug}--${safeId}`;
}

interface PostCardProps {
  post: Post & { profiles: Profile };
  currentUserId: string;
  isUpvoted: boolean;
  isSaved: boolean;
}

export function PostCard({
  post,
  currentUserId,
  isUpvoted: initialIsUpvoted,
  isSaved: initialIsSaved,
}: PostCardProps) {
  const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [upvoteCount, setUpvoteCount] = useState(post.upvotes_count);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = useSupabase();
  const router = useRouter();
  const { toast } = useToast();

  const postSlug = generateSlug(post.title, post.id);

  const profile = post.profiles;
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  async function handleUpvote() {
    if (isLoading) return; // Prevent double-clicks
    
    // Store previous state for rollback
    const previousUpvoted = isUpvoted;
    const previousCount = upvoteCount;
    
    try {
      setIsLoading(true);

      if (isUpvoted) {
        // Remove upvote
        setIsUpvoted(false);
        setUpvoteCount((c) => Math.max(0, c - 1)); // Prevent negative counts
        
        const { error } = await supabase
          .from("upvotes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("[v0] Error removing upvote:", error);
          // Rollback on error
          setIsUpvoted(previousUpvoted);
          setUpvoteCount(previousCount);
          throw error;
        }
      } else {
        // Add upvote
        setIsUpvoted(true);
        setUpvoteCount((c) => c + 1);
        
        const { error } = await supabase
          .from("upvotes")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) {
          console.error("[v0] Error adding upvote:", error);
          // Rollback on error
          setIsUpvoted(previousUpvoted);
          setUpvoteCount(previousCount);
          throw error;
        }
      }
    } catch (error) {
      console.error("[v0] Upvote handler error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (isLoading) return; // Prevent double-clicks
    
    // Store previous state for rollback
    const previousSaved = isSaved;
    
    try {
      setIsLoading(true);

      if (isSaved) {
        // Remove save
        setIsSaved(false);
        
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("[v0] Error removing save:", error);
          // Rollback on error
          setIsSaved(previousSaved);
          throw error;
        }
      } else {
        // Add save
        setIsSaved(true);
        
        const { error } = await supabase
          .from("saved_posts")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) {
          console.error("[v0] Error adding save:", error);
          // Rollback on error
          setIsSaved(previousSaved);
          throw error;
        }
      }
    } catch (error) {
      console.error("[v0] Save handler error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShare() {
    try {
      const shareUrl = `${window.location.origin}/post/${postSlug}`;
      
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

  async function handleDelete() {
    setIsDeleting(true);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", currentUserId);

    if (!error) {
      setIsDeleted(true);
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  }

  if (isDeleted) {
    return null;
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Post
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              This action cannot be undone. This will permanently delete your post
              and remove all associated comments, upvotes, and saves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <article className="bg-card rounded-xl border border-border overflow-hidden">
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-primary">
          <Pin className="w-3 h-3" />
          <span>Pinned</span>
        </div>
      )}

      <div className="p-4">
        {/* Title as main element - large and clickable */}
        {post.title && (
          <Link 
            href={`/post/${postSlug}`}
            className="block text-xl font-bold leading-tight hover:text-primary transition-colors mb-2"
          >
            {post.title}
          </Link>
        )}

        {/* Author info - smaller, below title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${profile?.id}`} className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {profile?.full_name || "Anonymous"}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              {post.user_id === currentUserId && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {post.content}
          </p>

          {post.media_url && post.post_type === "image" && (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <Image
                src={post.media_url || "/placeholder.svg"}
                alt={post.title || "Post image"}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
                loading="lazy"
                quality={80}
              />
            </div>
          )}

          {post.media_url && post.post_type === "video" && (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <video
                src={post.media_url}
                controls
                className="w-full h-full object-cover"
                poster={post.media_url.replace(/\.[^/.]+$/, "_thumb.jpg")}
              >
                <track kind="captions" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-background/80 flex items-center justify-center">
                  <Play className="w-6 h-6 text-foreground ml-1" />
                </div>
              </div>
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
                  href={`/search?tag=${tag}`}
                  className="text-xs text-primary hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            className={`gap-1.5 h-9 ${
              isUpvoted ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ArrowBigUp
              className={`w-5 h-5 ${isUpvoted ? "fill-primary" : ""}`}
            />
            <span className="text-sm font-medium">{upvoteCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 h-9 text-muted-foreground"
          >
            <Link href={`/post/${postSlug}`}>
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comments_count || 0}</span>
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className={`h-9 w-9 ${
            isSaved ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-primary" : ""}`} />
        </Button>
      </div>
    </article>
    </>
  );
}
