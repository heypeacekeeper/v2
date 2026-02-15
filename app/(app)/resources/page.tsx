import React from "react"
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  Star,
  ExternalLink,
  FileText,
  Video,
  Wrench,
  FileCode,
  GraduationCap,
  BookMarked,
  Rocket,
  TrendingUp,
  Scale,
  Palette,
  Code,
  Megaphone,
  Sparkles,
} from "lucide-react";
import type { Resource, ResourceType } from "@/lib/types";

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  article: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  tool: <Wrench className="w-4 h-4" />,
  template: <FileCode className="w-4 h-4" />,
  course: <GraduationCap className="w-4 h-4" />,
  book: <BookMarked className="w-4 h-4" />,
};

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; accent: string }> = {
  Fundraising: { 
    icon: <TrendingUp className="w-5 h-5" />, 
    gradient: "from-emerald-500/20 to-emerald-500/5",
    accent: "text-emerald-600 dark:text-emerald-400"
  },
  Product: { 
    icon: <Rocket className="w-5 h-5" />, 
    gradient: "from-blue-500/20 to-blue-500/5",
    accent: "text-blue-600 dark:text-blue-400"
  },
  Marketing: { 
    icon: <Megaphone className="w-5 h-5" />, 
    gradient: "from-orange-500/20 to-orange-500/5",
    accent: "text-orange-600 dark:text-orange-400"
  },
  Legal: { 
    icon: <Scale className="w-5 h-5" />, 
    gradient: "from-slate-500/20 to-slate-500/5",
    accent: "text-slate-600 dark:text-slate-400"
  },
  Engineering: { 
    icon: <Code className="w-5 h-5" />, 
    gradient: "from-violet-500/20 to-violet-500/5",
    accent: "text-violet-600 dark:text-violet-400"
  },
  Design: { 
    icon: <Palette className="w-5 h-5" />, 
    gradient: "from-pink-500/20 to-pink-500/5",
    accent: "text-pink-600 dark:text-pink-400"
  },
  Growth: { 
    icon: <Sparkles className="w-5 h-5" />, 
    gradient: "from-amber-500/20 to-amber-500/5",
    accent: "text-amber-600 dark:text-amber-400"
  },
};

function ResourceBentoCard({ resource, size = "normal" }: { resource: Resource; size?: "featured" | "normal" }) {
  const isFeatured = size === "featured";
  
  return (
    <Link
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${
        isFeatured ? "row-span-2 p-5" : "p-4"
      }`}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`flex items-center justify-center rounded-xl ${
            isFeatured ? "w-12 h-12 bg-primary/10" : "w-10 h-10 bg-secondary"
          }`}>
            <span className={isFeatured ? "text-primary" : "text-muted-foreground"}>
              {TYPE_ICONS[resource.resource_type]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {resource.is_featured && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <h3 className={`font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors ${
            isFeatured ? "text-base" : "text-sm"
          }`}>
            {resource.title}
          </h3>
          
          {resource.description && (
            <p className={`text-muted-foreground line-clamp-2 ${
              isFeatured ? "text-sm" : "text-xs"
            }`}>
              {resource.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
            isFeatured 
              ? "bg-primary/10 text-primary" 
              : "bg-secondary text-secondary-foreground"
          }`}>
            {resource.resource_type}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CategorySection({ 
  category, 
  resources 
}: { 
  category: string; 
  resources: Resource[];
}) {
  const config = CATEGORY_CONFIG[category] || { 
    icon: <BookOpen className="w-5 h-5" />, 
    gradient: "from-primary/20 to-primary/5",
    accent: "text-primary"
  };
  
  const featuredResource = resources.find(r => r.is_featured);
  const regularResources = resources.filter(r => !r.is_featured).slice(0, featuredResource ? 3 : 4);

  if (resources.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Category Header */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${config.gradient}`}>
        <div className={`w-10 h-10 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center ${config.accent}`}>
          {config.icon}
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{category}</h2>
          <p className="text-xs text-muted-foreground">{resources.length} resources</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        {featuredResource && (
          <ResourceBentoCard resource={featuredResource} size="featured" />
        )}
        {regularResources.map((resource) => (
          <ResourceBentoCard key={resource.id} resource={resource} />
        ))}
      </div>

      {/* View More Link */}
      {resources.length > 4 && (
        <Link 
          href={`/resources?category=${category}`}
          className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          View all {resources.length} {category.toLowerCase()} resources
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )}
    </section>
  );
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.type) {
    query = query.eq("resource_type", params.type);
  }

  const { data: resources } = await query.limit(100);

  // Group resources by category
  const resourcesByCategory: Record<string, Resource[]> = {};
  resources?.forEach((resource) => {
    if (!resourcesByCategory[resource.category]) {
      resourcesByCategory[resource.category] = [];
    }
    resourcesByCategory[resource.category].push(resource);
  });

  // Sort categories by number of resources
  const sortedCategories = Object.keys(resourcesByCategory).sort(
    (a, b) => resourcesByCategory[b].length - resourcesByCategory[a].length
  );

  const featuredResources = resources?.filter((r) => r.is_featured) || [];
  const hasFilters = params.category || params.type;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-none">Resources</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {resources?.length || 0} curated resources
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto">
        {/* Featured Section */}
        {featuredResources.length > 0 && !hasFilters && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="font-semibold text-foreground">Featured Resources</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {featuredResources.slice(0, 3).map((resource) => (
                <Link
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-amber-500/5 overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    {TYPE_ICONS[resource.resource_type]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 capitalize">
                        {resource.resource_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {resource.category}
                      </span>
                    </div>
                  </div>
                  
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories Bento Grid */}
        {hasFilters ? (
          // Filtered View - Show all matching resources in grid
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                {params.category || "All Categories"}
                {params.type && ` - ${params.type}`}
              </h2>
              <Link 
                href="/resources"
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </Link>
            </div>
            
            {resources && resources.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {resources.map((resource) => (
                  <ResourceBentoCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">No resources found</p>
                <Link 
                  href="/resources"
                  className="text-sm text-primary hover:underline inline-block"
                >
                  View all resources
                </Link>
              </div>
            )}
          </section>
        ) : (
          // Default View - Show by category
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                resources={resourcesByCategory[category]}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!resources || resources.length === 0) && !hasFilters && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No resources yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Resources will appear here once added
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
