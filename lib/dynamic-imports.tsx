import dynamic from "next/dynamic";
import { PageLoader } from "@/components/ui/global-loader";

// Lightweight skeleton loading component for lazy-loaded content
function LazyLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <PageLoader message="Loading..." />
    </div>
  );
}

// Lightweight skeleton for forms
function FormLoadingSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-14 bg-muted/30 border-b" />
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="h-10 bg-muted/30 rounded-lg" />
        <div className="h-32 bg-muted/30 rounded-lg" />
        <div className="h-10 bg-muted/30 rounded-lg" />
      </div>
    </div>
  );
}

// Lightweight skeleton for chat
function ChatLoadingSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-14 bg-muted/30 border-b" />
      <div className="flex-1 p-4 space-y-4">
        <div className="h-20 bg-muted/30 rounded-lg w-3/4" />
        <div className="h-20 bg-muted/30 rounded-lg w-3/4 ml-auto" />
        <div className="h-20 bg-muted/30 rounded-lg w-3/4" />
      </div>
      <div className="h-16 bg-muted/30 border-t" />
    </div>
  );
}

// Heavy interactive components - lazy loaded using default imports
export const LazyJarvisChat = dynamic(
  () => import("@/components/jarvis/jarvis-chat"),
  {
    loading: () => <ChatLoadingSkeleton />,
    ssr: false, // Chat doesn't need SSR
  }
);

export const LazyUploadForm = dynamic(
  () => import("@/components/upload/upload-form"),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: false, // Upload form doesn't need SSR
  }
);

export const LazyProfileEditForm = dynamic(
  () => import("@/components/profile/profile-edit-form"),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: false, // Edit form doesn't need SSR
  }
);

export const LazyPostDetailClient = dynamic(
  () => import("@/components/post/post-detail-client"),
  {
    loading: () => <LazyLoadingSkeleton />,
    ssr: true, // Post detail benefits from SSR for SEO
  }
);

export const LazyDiscoverClient = dynamic(
  () => import("@/components/discover/discover-client"),
  {
    loading: () => <LazyLoadingSkeleton />,
    ssr: true, // Discover benefits from SSR
  }
);

// UI components that are rarely used - lazy loaded
export const LazyDialog = dynamic(
  () => import("@/components/ui/dialog").then((mod) => mod.Dialog),
  { ssr: false }
);

export const LazySheet = dynamic(
  () => import("@/components/ui/sheet").then((mod) => mod.Sheet),
  { ssr: false }
);

export const LazyDrawer = dynamic(
  () => import("@/components/ui/drawer").then((mod) => mod.Drawer),
  { ssr: false }
);

export const LazyAlertDialog = dynamic(
  () => import("@/components/ui/alert-dialog").then((mod) => mod.AlertDialog),
  { ssr: false }
);

// Chart components - heavy recharts library
export const LazyChartContainer = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod.ChartContainer),
  {
    loading: () => (
      <div className="aspect-video w-full animate-pulse bg-muted/30 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyCommentSection = dynamic(
  () => import("@/components/post/comment-section").then((mod) => mod.CommentSection),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-24 bg-muted/30 rounded" />
        <div className="h-11 bg-muted/30 rounded-lg" />
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted/30 rounded" />
              <div className="h-10 bg-muted/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);
