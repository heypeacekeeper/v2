import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LazyUploadForm } from "@/lib/dynamic-imports";

export default async function UploadPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <LazyUploadForm />;
}
