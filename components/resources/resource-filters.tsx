"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  "All",
  "Fundraising",
  "Product",
  "Marketing",
  "Legal",
  "Engineering",
  "Design",
  "Growth",
];

const TYPES = [
  "All",
  "article",
  "video",
  "tool",
  "template",
  "course",
  "book",
];

interface ResourceFiltersProps {
  selectedCategory?: string;
  selectedType?: string;
}

export function ResourceFilters({
  selectedCategory,
  selectedType,
}: ResourceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/resources?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Category</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter("category", cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                (cat === "All" && !selectedCategory) ||
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Type</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => updateFilter("type", type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize ${
                (type === "All" && !selectedType) || selectedType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
