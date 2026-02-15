"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { RocketLoader } from "@/components/ui/global-loader";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { Comment, Profile } from "@/lib/types";

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<(Comment & { profiles: Profile })[]>(
    []
  );
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabase();

  useEffect(() => {
    async function fetchComments() {
      const { data } = await supabase
        .from("comments")
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
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (data) {
        setComments(data as (Comment & { profiles: Profile })[]);
      }
      setIsLoading(false);
    }

    fetchComments();
  }, [postId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: newComment.trim(),
      })
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
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as Comment & { profiles: Profile }]);
      setNewComment("");
    }

    setIsSubmitting(false);
  }

  if (isLoading) {
    return (
<div className="flex items-center justify-center py-8">
    <RocketLoader size="md" className="text-muted-foreground" />
  </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[44px] bg-secondary border-border resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting || !newComment.trim()}
          className="h-11 w-11 flex-shrink-0"
        >
{isSubmitting ? (
    <RocketLoader size="sm" />
  ) : (
  <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const profile = comment.profiles;
            const initials =
              profile?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "?";

            return (
              <div key={comment.id} className="flex gap-3">
                <Link href={`/profile/${profile?.id}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${profile?.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {profile?.full_name || "Anonymous"}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
