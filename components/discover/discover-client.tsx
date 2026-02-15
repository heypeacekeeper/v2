"use client";

import React from "react";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  FileText,
  BookOpen,
  TrendingUp,
  Hash,
  ArrowBigUp,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { RocketLoader } from "@/components/ui/global-loader";
import { formatDistanceToNow } from "date-fns";
import type { Post, Profile, Resource } from "@/lib/types";

type TabType = "all" | "posts" | "people" | "resources";
type CategoryFilter = "all" | "fundraising" | "product" | "marketing" | "growth" | "legal" | "hiring";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "posts", label: "Posts", icon: <FileText className="w-4 h-4" /> },
  { id: "people", label: "People", icon: <Users className="w-4 h-4" /> },
  { id: "resources", label: "Resources", icon: <BookOpen className="w-4 h-4" /> },
];

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "fundraising", label: "Fundraising" },
  { id: "product", label: "Product" },
  { id: "marketing", label: "Marketing" },
  { id: "growth", label: "Growth" },
  { id: "legal", label: "Legal" },
  { id: "hiring", label: "Hiring" },
];

const TRENDING_TAGS = ["startup", "ai", "funding", "product", "growth", "saas", "b2b", "tech"];

interface DiscoverClientProps {
  initialPosts: (Post & { profiles: Profile })[];
  initialPeople: Profile[];
  initialResources: Resource[];
  initialQuery: string;
  initialTab: TabType;
}

function DiscoverClient({
  initialPosts,
  initialPeople,
  initialResources,
  initialQuery,
  initialTab,
}: DiscoverClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [isLoading, setIsLoading] = useState(false);

  const [posts, setPosts] = useState(initialPosts);
  const [people, setPeople] = useState(initialPeople);
  const [resources, setResources] = useState(initialResources);

  const supabase = useSupabase();

  const performSearch = useCallback(async (query: string, tab: TabType, cat: CategoryFilter) => {
    setIsLoading(true);
    const searchTerm = query.trim().toLowerCase();

    try {
      // Search posts
      if (tab === "all" || tab === "posts") {
        let postsQuery = supabase
          .from("posts")
          .select("*, profiles:user_id(*)")
          .order("created_at", { ascending: false })
          .limit(20);

        if (searchTerm) {
          postsQuery = postsQuery.or(`content.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
        }

        const { data: postsData } = await postsQuery;
        setPosts(postsData || []);
      } else {
        setPosts([]);
      }

      // Search people
      if (tab === "all" || tab === "people") {
        let peopleQuery = supabase
          .from("profiles")
          .select("*")
          .eq("is_onboarded", true)
          .order("created_at", { ascending: false })
          .limit(20);

        if (searchTerm) {
          peopleQuery = peopleQuery.or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,college.ilike.%${searchTerm}%`);
        }

        const { data: peopleData } = await peopleQuery;
        setPeople(peopleData || []);
      } else {
        setPeople([]);
      }

      // Search resources
      if (tab === "all" || tab === "resources") {
        let resourcesQuery = supabase
          .from("resources")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20);

        if (searchTerm) {
          resourcesQuery = resourcesQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        if (cat !== "all") {
          resourcesQuery = resourcesQuery.eq("category", cat);
        }

        const { data: resourcesData } = await resourcesQuery;
        setResources(resourcesData || []);
      } else {
        setResources([]);
      }
    } catch (error) {
      console.error("Search error:", error);
    }

    setIsLoading(false);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeTab !== "all") params.set("tab", activeTab);
    router.push(`/discover?${params.toString()}`);
    performSearch(searchQuery, activeTab, category);
  }

  function handleTabChange(tab: TabType) {
    setActiveTab(tab);
    performSearch(searchQuery, tab, category);
  }

  function handleCategoryChange(cat: CategoryFilter) {
    setCategory(cat);
    performSearch(searchQuery, activeTab, cat);
  }

  function handleTagClick(tag: string) {
    setSearchQuery(tag);
    router.push(`/discover?q=${tag}`);
    performSearch(tag, activeTab, category);
  }

  function generatePostSlug(title: string | null, id: string | number): string {
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
    return `${slug}--${safeId}`;
  }

  const hasResults = posts.length > 0 || people.length > 0 || resources.length > 0;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-semibold">Discover</h1>
          </div>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts, people, resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {(activeTab === "all" || activeTab === "resources") && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    category === cat.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Trending Tags */}
        {!searchQuery && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Trending Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RocketLoader size="md" className="text-primary" />
          </div>
        ) : (
          <>
            {/* Posts Section */}
            {(activeTab === "all" || activeTab === "posts") && posts.length > 0 && (
              <section className="space-y-3">
                {activeTab === "all" && (
                  <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Posts
                  </h2>
                )}
                <div className="space-y-3">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${generatePostSlug(post.title, post.id)}`}
                      className="block p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.profiles?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {post.profiles?.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate">
                              {post.profiles?.full_name || "Anonymous"}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {post.title && (
                            <h3 className="font-semibold mt-1">{post.title}</h3>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ArrowBigUp className="w-4 h-4" />
                              {post.upvotes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              {post.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* People Section */}
            {(activeTab === "all" || activeTab === "people") && people.length > 0 && (
              <section className="space-y-3">
                {activeTab === "all" && (
                  <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    People
                  </h2>
                )}
                <div className="grid gap-3">
                  {people.map((person) => (
                    <Link
                      key={person.id}
                      href={`/profile/${person.id}`}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={person.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {person.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {person.full_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 rounded bg-secondary">
                            {person.role}
                          </span>
                        </div>
                        {person.bio && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {person.bio}
                          </p>
                        )}
                        {person.college && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {person.college}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Resources Section */}
            {(activeTab === "all" || activeTab === "resources") && resources.length > 0 && (
              <section className="space-y-3">
                {activeTab === "all" && (
                  <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Resources
                  </h2>
                )}
                <div className="grid gap-3">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{resource.title}</h3>
                          {resource.is_featured && (
                            <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded capitalize">
                            {resource.resource_type}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {resource.category}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Empty States */}
            {!hasResults && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : "No content available yet"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export { DiscoverClient };
export default DiscoverClient;
