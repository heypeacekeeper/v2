import React from "react"
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Video,
  Wrench,
  FileCode,
  GraduationCap,
  BookMarked,
  Star,
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

interface ResourceCardProps {
  resource: Resource;
  featured?: boolean;
}

export function ResourceCard({ resource, featured }: ResourceCardProps) {
  return (
    <Link
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 rounded-xl border transition-all hover:border-primary/50 ${
        featured
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border hover:bg-secondary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            featured ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
          }`}
        >
          {TYPE_ICONS[resource.resource_type]}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {resource.title}
            </h3>
            {featured && <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />}
          </div>

          {resource.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {resource.description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
              {resource.resource_type}
            </span>
            <span className="text-xs text-muted-foreground">
              {resource.category}
            </span>
            <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
          </div>
        </div>
      </div>
    </Link>
  );
}
