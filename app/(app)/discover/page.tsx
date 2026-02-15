import { createClient } from "@/lib/supabase/server";
import { LazyDiscoverClient } from "@/lib/dynamic-imports";

type TabType = "all" | "posts" | "people" | "resources";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; tag?: string; tab?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  
  const initialQuery = params.q || params.tag || "";
  const initialTab = (params.tab as TabType) || "all";
  const searchTerm = initialQuery.trim().toLowerCase();

  // Fetch posts
  let postsQuery = supabase
    .from("posts")
    .select("*, profiles:user_id(*)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (searchTerm) {
    postsQuery = postsQuery.or(`content.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
  }

  const { data: posts } = await postsQuery;

  // Fetch people
  let peopleQuery = supabase
    .from("profiles")
    .select("*")
    .eq("is_onboarded", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (searchTerm) {
    peopleQuery = peopleQuery.or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,college.ilike.%${searchTerm}%`);
  }

  const { data: people } = await peopleQuery;

  // Fetch resources
  let resourcesQuery = supabase
    .from("resources")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (searchTerm) {
    resourcesQuery = resourcesQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  const { data: resources } = await resourcesQuery;

  return (
    <LazyDiscoverClient
      initialPosts={posts || []}
      initialPeople={people || []}
      initialResources={resources || []}
      initialQuery={initialQuery}
      initialTab={initialTab}
    />
  );
}
