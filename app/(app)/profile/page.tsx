import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Bookmark,
  ExternalLink,
  MapPin,
  Calendar,
  Rocket,
} from "lucide-react";

const ROLE_LABELS: Record<string, { label: string; emoji: string }> = {
  student: { label: "Student Entrepreneur", emoji: "🎓" },
  founder: { label: "Early-Stage Founder", emoji: "🚀" },
  mentor: { label: "Mentor / Creator", emoji: "🧠" },
  admin: { label: "Admin", emoji: "⚡" },
};

const STARTUP_STAGE_LABELS: Record<string, { label: string; emoji: string }> = {
  "Idea Phase": { label: "Idea Validation Stage", emoji: "💡" },
  "MVP/Prototype": { label: "MVP / Building Stage", emoji: "🛠️" },
  "Early Traction": { label: "Early Traction", emoji: "🌱" },
  "Scaling": { label: "Scaling Stage", emoji: "📈" },
  "Mentor/Investor": { label: "Mentor / Investor", emoji: "🧠" },
};

const INTEREST_LABELS: Record<string, { label: string; emoji: string }> = {
  "startup-ideas": { label: "Startup Ideas", emoji: "💡" },
  "ai-automation": { label: "AI & Automation", emoji: "🤖" },
  "mvp-building": { label: "MVP Building", emoji: "🚀" },
  "marketing": { label: "Marketing", emoji: "📈" },
  "web-development": { label: "Web Development", emoji: "💻" },
  "monetization": { label: "Monetization", emoji: "💰" },
  "productivity": { label: "Productivity", emoji: "🧠" },
  "personal-brand": { label: "Personal Brand", emoji: "🎯" },
};
import { formatDistanceToNow } from "date-fns";
import { ProfileStats } from "@/components/profile/profile-stats";
import { UserPosts } from "@/components/profile/user-posts";
import { SignOutButton } from "@/components/profile/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Run all queries in parallel for speed
  const [profileResult, postsCountResult, savedCountResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("saved_posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  const postsCount = postsCountResult.count;
  const savedCount = savedCountResult.count;

  if (!profile) {
    redirect("/onboarding");
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <h1 className="font-semibold text-lg">Profile</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile/edit">
                <Settings className="w-5 h-5" />
              </Link>
            </Button>
          </div>
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
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {profile.role && ROLE_LABELS[profile.role] && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1.5">
                    <span>{ROLE_LABELS[profile.role].emoji}</span>
                    <span>{ROLE_LABELS[profile.role].label}</span>
                  </span>
                )}
                {profile.startup_stage && STARTUP_STAGE_LABELS[profile.startup_stage] && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1.5">
                    <span>{STARTUP_STAGE_LABELS[profile.startup_stage].emoji}</span>
                    <span>{STARTUP_STAGE_LABELS[profile.startup_stage].label}</span>
                  </span>
                )}
              </div>
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
          {profile.website_url && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Website
              </a>
            </Button>
          )}
        </div>

        {profile.interests && profile.interests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Interest Areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest: string) => {
                const interestData = INTEREST_LABELS[interest];
                return (
                  <span
                    key={interest}
                    className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary flex items-center gap-1"
                  >
                    {interestData ? (
                      <>
                        <span>{interestData.emoji}</span>
                        <span>{interestData.label}</span>
                      </>
                    ) : (
                      <span className="capitalize">{interest.replace(/-/g, " ")}</span>
                    )}
                  </span>
                );
              })}
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

        <ProfileStats postsCount={postsCount || 0} savedCount={savedCount || 0} />

        <div className="flex gap-2">
          <Button variant="outline" asChild className="flex-1 bg-transparent">
            <Link href="/profile/saved">
              <Bookmark className="w-4 h-4 mr-1.5" />
              Saved Posts
            </Link>
          </Button>
          <SignOutButton />
        </div>

        <UserPosts userId={user.id} />
      </div>
    </main>
  );
}
