import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LazyProfileEditForm } from "@/lib/dynamic-imports";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <main className="min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-semibold">Edit Profile</h1>
          </div>
        </header>
        <div className="px-4 py-12 max-w-lg mx-auto text-center space-y-4">
          <p className="text-destructive">Failed to load profile. Please try again.</p>
          <Button variant="outline" asChild>
            <Link href="/profile/edit">Retry</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <LazyProfileEditForm profile={profile} />;
}
