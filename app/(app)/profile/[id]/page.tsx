import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PostCard } from "@/components/feed/post-card";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reserved route names that should not be treated as profile IDs
const RESERVED_ROUTES = ["saved", "edit", "settings"];

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Reserved routes should not match this dynamic route - return 404 to let Next.js
  // fall through to static routes (this shouldn't normally happen as static routes
  // have priority, but serves as a safeguard)
  if (RESERVED_ROUTES.includes(id.toLowerCase())) {
    notFound();
  }
  
  // Validate that id is a valid UUID
  if (!UUID_REGEX.test(id)) {
    notFound();
  }
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "?";

  const { data: posts } = await supabase
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
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: upvotes } = await supabase
    .from("upvotes")
    .select("post_id")
    .eq("user_id", user?.id || "");

  const { data: savedPosts } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("user_id", user?.id || "");

  const upvotedPostIds = new Set(upvotes?.map((u) => u.post_id) || []);
  const savedPostIds = new Set(savedPosts?.map((s) => s.post_id) || []);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/feed">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-semibold">Profile</h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div>
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {profile.role}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {profile.college && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.college}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined{" "}
                {formatDistanceToNow(new Date(profile.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile.bio}
          </p>
        )}

        <div className="flex gap-2">
          {profile.linkedin_url && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                LinkedIn
              </a>
            </Button>
          )}
          {profile.twitter_url && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Twitter
              </a>
            </Button>
          )}
        </div>

        {profile.interests && profile.interests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Interests
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest: string) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-medium">Posts</h3>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id || ""}
                isUpvoted={upvotedPostIds.has(post.id)}
                isSaved={savedPostIds.has(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
