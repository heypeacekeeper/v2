"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/providers/supabase-provider";

export function FeedHeader() {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useSupabase();

  // Fetch initial unread count and set up real-time subscription
  useEffect(() => {
    let userId: string | null = null;

    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        setUnreadCount(count || 0);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription
    const channel = supabase
      .channel("feed-header-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async () => {
          // Refetch count on new notification
          if (userId) {
            const { count } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("is_read", false);
            setUnreadCount(count || 0);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        async () => {
          // Refetch count when notification is marked as read
          if (userId) {
            const { count } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("is_read", false);
            setUnreadCount(count || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-lg">StartiGeniX</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-muted-foreground relative"
        >
          <Link href="/notifications">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>
      </div>
    </header>
  );
}
