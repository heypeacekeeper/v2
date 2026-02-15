"use client";

import React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  ImageIcon,
  Video,
  Link as LinkIcon,
  Send,
  ArrowLeft,
  Hash,
  Upload,
} from "lucide-react";
import { RocketLoader } from "@/components/ui/global-loader";
import Link from "next/link";
import Image from "next/image";
import type { PostType } from "@/lib/types";

const POST_TYPES: { type: PostType; icon: React.ReactNode; label: string }[] = [
  { type: "text", icon: <Hash className="w-5 h-5" />, label: "Text" },
  { type: "image", icon: <ImageIcon className="w-5 h-5" />, label: "Image" },
  { type: "video", icon: <Video className="w-5 h-5" />, label: "Video" },
  { type: "link", icon: <LinkIcon className="w-5 h-5" />, label: "Link" },
];

// Generate slug from title and ID (matches pattern used throughout the app)
function generateSlug(title: string | null, id: string | number): string {
  const safeId = String(id ?? "");
  if (!safeId) return "";
  if (!title) return safeId;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}--${safeId}`;
}

export default function UploadForm() {
  const [postType, setPostType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPostSlug, setCreatedPostSlug] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMediaUrl(data.url);
      setUploadedFile({
        name: file.name,
        type: file.type,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setMediaUrl("");
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getAcceptTypes = () => {
    if (postType === "image") {
      return "image/jpeg,image/png,image/gif,image/webp";
    }
    if (postType === "video") {
      return "video/mp4,video/webm,video/quicktime";
    }
    return "";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Prevent double submissions
    if (isLoading) {
      return;
    }
    
    // Validate title is present (required field)
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    // Content is fully optional - users can submit with just a title
    // Only validate media/link requirements for specific post types
    if ((postType === "image" || postType === "video") && !mediaUrl) {
      setError(`Please upload a ${postType}`);
      return;
    }
    
    if (postType === "link" && !linkUrl) {
      setError("Please add a link URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const tagList = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        post_type: postType,
        media_url:
          postType === "image" || postType === "video" ? mediaUrl || null : null,
        link_url: postType === "link" ? linkUrl || null : null,
        tags: tagList,
      })
      .select("id, title")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    // Generate slug from title and ID (posts table doesn't have a slug column)
    const postSlug = newPost ? generateSlug(newPost.title, newPost.id) : null;
    setCreatedPostSlug(postSlug);
    setShowSuccessModal(true);
    setIsLoading(false);
  }

  // Prevent Enter key from submitting form in input fields
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Reset form after successful post
  const resetForm = () => {
    setTitle("");
    setContent("");
    setMediaUrl("");
    setLinkUrl("");
    setTags("");
    setPostType("text");
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  // Handle view post
  const handleViewPost = () => {
    if (createdPostSlug) {
      router.push(`/post/${createdPostSlug}`);
    }
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/feed">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-semibold">Create Post</h1>
          </div>
          <Button
            type="submit"
            form="upload-form"
            disabled={isLoading || !title.trim()}
            size="sm"
          >
            {isLoading ? (
              <RocketLoader size="sm" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                Post
              </>
            )}
          </Button>
        </div>
      </header>

      <form id="upload-form" onSubmit={handleSubmit} className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {POST_TYPES.map((pt) => (
            <button
              key={pt.type}
              type="button"
              onClick={() => {
                setPostType(pt.type);
                clearUploadedFile();
                setLinkUrl("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                postType === pt.type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {pt.icon}
              {pt.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Give your post a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="bg-secondary border-border text-base font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (optional)</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind? Share your startup journey, ideas, or learnings..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-secondary border-border resize-none text-base"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          {/* Image Upload */}
          {postType === "image" && (
            <div className="space-y-2">
              <Label>Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptTypes()}
                onChange={handleFileSelect}
                className="hidden"
              />

              {!uploadedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors bg-secondary"
                >
                  {isUploading ? (
                    <>
                      <RocketLoader size="md" className="text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Click to upload image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, GIF or WebP (max 50MB)
                        </p>
                      </div>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <Image
                    src={mediaUrl || "/placeholder.svg"}
                    alt="Uploaded preview"
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearUploadedFile}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <div className="p-2 bg-secondary border-t border-border">
                    <p className="text-xs text-muted-foreground truncate">
                      {uploadedFile.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video Upload */}
          {postType === "video" && (
            <div className="space-y-2">
              <Label>Video</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptTypes()}
                onChange={handleFileSelect}
                className="hidden"
              />

              {!uploadedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors bg-secondary"
                >
                  {isUploading ? (
                    <>
                      <RocketLoader size="md" className="text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Click to upload video
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP4, WebM or MOV (max 50MB)
                        </p>
                      </div>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-48 object-cover bg-black"
                  />
                  <div className="p-2 bg-secondary border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {uploadedFile.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedFile}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {postType === "link" && (
            <div className="space-y-2">
              <Label htmlFor="link">Link URL</Label>
              <div className="flex gap-2">
                <Input
                  id="link"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="bg-secondary border-border"
                />
                {linkUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLinkUrl("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="startup, funding, ai (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <DialogTitle className="text-center">Post successfully posted</DialogTitle>
            <DialogDescription className="text-center">
              Your post has been published and is now visible to the community.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="w-full sm:w-auto bg-transparent"
            >
              Close
            </Button>
            <Button
              onClick={handleViewPost}
              className="w-full sm:w-auto"
              disabled={!createdPostSlug}
            >
              View Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
