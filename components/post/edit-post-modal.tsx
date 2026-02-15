"use client";

import React from "react"

import { useState } from "react";
import { X, Pencil, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabase } from "@/providers/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/lib/types";

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
}

export function EditPostModal({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}: EditPostModalProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(post.hashtags || []);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabase();
  const { toast } = useToast();

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !hashtags.includes(tag) && hashtags.length < 5) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .update({
          title: title.trim(),
          content: content.trim() || null,
          hashtags: hashtags.length > 0 ? hashtags : null,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Post updated",
        description: "Your changes have been saved successfully.",
      });

      onPostUpdated({
        ...post,
        title: data.title,
        content: data.content,
        hashtags: data.hashtags,
        is_edited: true,
      });
      onClose();
    } catch (error) {
      console.error("[v0] Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    title !== post.title ||
    content !== (post.content || "") ||
    JSON.stringify(hashtags) !== JSON.stringify(post.hashtags || []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              maxLength={200}
              className="bg-secondary"
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          {/* Content/Caption */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">
              {post.post_type === "image" || post.post_type === "video"
                ? "Caption"
                : "Content"}
            </Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                post.post_type === "image" || post.post_type === "video"
                  ? "Add a caption..."
                  : "Write your content here..."
              }
              maxLength={5000}
              rows={6}
              className="bg-secondary resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/5000
            </p>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="edit-hashtags">Hashtags (max 5)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-hashtags"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add hashtag"
                  className="pl-9 bg-secondary"
                  disabled={hashtags.length >= 5}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddHashtag}
                disabled={!hashtagInput.trim() || hashtags.length >= 5}
              >
                Add
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Media preview (non-editable) */}
          {(post.post_type === "image" || post.post_type === "video") &&
            post.media_url && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Media (cannot be changed)
                </Label>
                <div className="rounded-lg overflow-hidden border border-border bg-muted/50">
                  {post.post_type === "image" ? (
                    <img
                      src={post.media_url || "/placeholder.svg"}
                      alt="Post media"
                      className="w-full h-32 object-cover opacity-60"
                    />
                  ) : (
                    <video
                      src={post.media_url}
                      className="w-full h-32 object-cover opacity-60"
                    />
                  )}
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Media cannot be edited
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
            disabled={isLoading || !hasChanges || !title.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
