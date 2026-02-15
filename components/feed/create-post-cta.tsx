import Link from "next/link";
import { PenLine } from "lucide-react";

export function CreatePostCTA() {
  return (
    <Link
      href="/upload"
      className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <PenLine className="w-5 h-5 text-primary" />
      </div>
      <span className="text-muted-foreground text-sm">
        Share something with the community...
      </span>
    </Link>
  );
}
